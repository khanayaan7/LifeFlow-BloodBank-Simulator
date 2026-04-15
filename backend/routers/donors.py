import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_role
from database import get_db
from models.blood_unit import BloodUnit
from models.donor import Donor
from models.user import User
from schemas.blood_unit import BloodUnitOut
from schemas.donor import DonorCreate, DonorOut, DonorUpdate
from utils.audit import log_action

router = APIRouter(tags=["donors"])


@router.get("/", response_model=list[DonorOut])
def list_donors(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "lab_technician")),
):
    return db.query(Donor).filter(Donor.is_eligible.is_(True)).order_by(Donor.created_at.desc()).all()


@router.post("/", response_model=DonorOut)
def create_donor(
    payload: DonorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = Donor(**payload.model_dump(), created_by=current_user.id)
    db.add(donor)
    db.flush()
    log_action(
        db,
        action="DONOR_CREATED",
        entity_type="donor",
        entity_id=str(donor.id),
        user_id=current_user.id,
        details={"blood_group": donor.blood_group.value},
    )
    db.commit()
    db.refresh(donor)
    return donor


@router.get("/{donor_id}", response_model=DonorOut)
def get_donor(donor_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    return donor


@router.put("/{donor_id}", response_model=DonorOut)
def update_donor(
    donor_id: uuid.UUID,
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(donor, key, value)

    log_action(db, "DONOR_UPDATED", "donor", str(donor.id), user_id=current_user.id)
    db.commit()
    db.refresh(donor)
    return donor


@router.delete("/{donor_id}")
def delete_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = db.query(Donor).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    donor.is_eligible = False
    log_action(db, "DONOR_SOFT_DELETED", "donor", str(donor.id), user_id=current_user.id)
    db.commit()
    return {"message": "Donor soft deleted"}


@router.get("/{donor_id}/units", response_model=list[BloodUnitOut])
def donor_units(donor_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(BloodUnit).filter(BloodUnit.donor_id == donor_id).order_by(BloodUnit.created_at.desc()).all()
