from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from auth.jwt_handler import create_access_token
from database import get_db
from models import UserRole
from models.donor import Donor
from models.user import User
from schemas.donor import DonorRegistrationCreate
from schemas.user import TokenResponse, UserCreate, UserOut
from utils.audit import log_action
from utils.donors import generate_donor_code, sync_donor_eligibility
from utils.security import hash_password, verify_password

router = APIRouter(tags=["auth"])


def _create_donor_account(
    *,
    full_name: str,
    email: str,
    phone_number: str,
    password: str,
    db: Session,
) -> TokenResponse:
    existing = db.query(User).filter(User.email == email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    donor = db.query(Donor).filter(Donor.email == email).first()
    if donor and donor.user_id:
        raise HTTPException(status_code=400, detail="Donor profile is already linked to another account")

    donor_code = donor.donor_code if donor and donor.donor_code else generate_donor_code()

    user = User(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
        role=UserRole.donor,
        phone_number=phone_number,
    )
    db.add(user)
    db.flush()

    if donor is None:
        donor = Donor(
            donor_code=donor_code,
            user_id=user.id,
            full_name=full_name,
            phone_number=phone_number,
            email=email,
            created_by=None,
            is_eligible=True,
        )
        db.add(donor)
    else:
        donor.user_id = user.id
        donor.full_name = full_name
        donor.phone_number = phone_number
        donor.email = email
        donor.donor_code = donor_code
        sync_donor_eligibility(donor)

    db.flush()

    log_action(
        db,
        action="DONOR_REGISTERED",
        entity_type="donor",
        entity_id=str(donor.id),
        user_id=user.id,
        details={"email": user.email, "donor_code": donor.donor_code},
    )
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.post("/register", response_model=TokenResponse)
def register(payload: UserCreate, db: Session = Depends(get_db)):
    if payload.role != UserRole.donor:
        raise HTTPException(status_code=403, detail="Only donor self-registration is allowed from this endpoint")
    if not payload.phone_number:
        raise HTTPException(status_code=400, detail="Phone number is required for donor registration")
    return _create_donor_account(
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password=payload.password,
        db=db,
    )


@router.post("/register/donor", response_model=TokenResponse)
def register_donor(payload: DonorRegistrationCreate, db: Session = Depends(get_db)):
    return _create_donor_account(
        full_name=payload.full_name,
        email=payload.email,
        phone_number=payload.phone_number,
        password=payload.password,
        db=db,
    )


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not user.is_active or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    return TokenResponse(access_token=token, user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return UserOut.model_validate(current_user)
