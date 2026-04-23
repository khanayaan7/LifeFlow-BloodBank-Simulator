import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth.dependencies import require_role
from database import get_db
from models.blood_request import BloodRequest
from models.hospital import Hospital
from models.user import User
from schemas.blood_request import BloodRequestOut
from schemas.hospital import HospitalCreate, HospitalOut, HospitalUpdate
from utils.audit import log_action

router = APIRouter(tags=["hospitals"])


@router.get("/", response_model=list[HospitalOut])
def list_hospitals(db: Session = Depends(get_db), _: User = Depends(require_role("admin"))):
    return db.query(Hospital).order_by(Hospital.created_at.desc()).all()


@router.post("/", response_model=HospitalOut)
def create_hospital(
    payload: HospitalCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    hospital = Hospital(**payload.model_dump())
    db.add(hospital)
    db.flush()
    log_action(db, "HOSPITAL_CREATED", "hospital", str(hospital.id), user_id=current_user.id)
    db.commit()
    db.refresh(hospital)
    return hospital


@router.get("/{hospital_id}", response_model=HospitalOut)
def get_hospital(
    hospital_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    return hospital


@router.put("/{hospital_id}", response_model=HospitalOut)
def update_hospital(
    hospital_id: uuid.UUID,
    payload: HospitalUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    hospital = db.query(Hospital).filter(Hospital.id == hospital_id).first()
    if not hospital:
        raise HTTPException(status_code=404, detail="Hospital not found")
    for key, value in payload.model_dump(exclude_unset=True).items():
        setattr(hospital, key, value)
    log_action(db, "HOSPITAL_UPDATED", "hospital", str(hospital.id), user_id=current_user.id)
    db.commit()
    db.refresh(hospital)
    return hospital


@router.get("/{hospital_id}/requests", response_model=list[BloodRequestOut])
def hospital_requests(
    hospital_id: uuid.UUID,
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin")),
):
    return (
        db.query(BloodRequest)
        .filter(BloodRequest.hospital_id == hospital_id)
        .order_by(BloodRequest.requested_at.desc())
        .all()
    )
