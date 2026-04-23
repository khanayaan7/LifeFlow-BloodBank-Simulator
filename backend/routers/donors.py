import uuid
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from auth.dependencies import get_current_user, require_role
from database import get_db
from models.blood_request import BloodRequest, BloodRequestAllocation
from models.blood_unit import BloodUnit
from models.donor import Donor
from models.user import User
from schemas.blood_unit import BloodUnitOut
from schemas.donor import DonorCreate, DonorDashboardOut, DonorDonationReceipt, DonorOut, DonorUpdate
from utils.audit import log_action
from utils.donors import sync_donor_eligibility

router = APIRouter(tags=["donors"])


def _staff_visible_donors_query(db: Session, current_user: User):
    query = db.query(Donor).filter(or_(Donor.user_id.is_(None), Donor.user.has(User.is_active.is_(True))))
    if current_user.blood_bank_id:
        query = query.filter(
            or_(
                Donor.blood_bank_id == current_user.blood_bank_id,
                Donor.blood_bank_id.is_(None),
                Donor.blood_units.any(BloodUnit.blood_bank_id == current_user.blood_bank_id),
            )
        )
    return query


def _receipt_from_unit(unit: BloodUnit) -> DonorDonationReceipt:
    return DonorDonationReceipt(
        id=unit.id,
        unit_id=unit.id,
        unit_code=unit.unit_code,
        donor_code=unit.donor_code or "-",
        donor_name=unit.donor.full_name if unit.donor else "Unknown Donor",
        donor_email=unit.donor.email if unit.donor else "unknown@example.com",
        donor_phone_number=unit.donor.phone_number if unit.donor else "-",
        blood_group=unit.blood_group,
        volume_ml=unit.volume_ml,
        collection_date=unit.collection_date,
        component=unit.component.value,
        blood_bank_name=unit.blood_bank.name if unit.blood_bank else None,
        blood_bank_location=unit.blood_bank.location if unit.blood_bank else None,
        status=unit.status.value,
        hospital_name=unit.hospital_name,
        patient_name=unit.patient_name,
        patient_id=unit.patient_id,
    )


def _get_donor_for_user(db: Session, current_user: User) -> Donor:
    donor = (
        db.query(Donor)
        .options(
            joinedload(Donor.user),
            joinedload(Donor.blood_units).joinedload(BloodUnit.blood_bank),
            joinedload(Donor.blood_units)
            .joinedload(BloodUnit.allocations)
            .joinedload(BloodRequestAllocation.request)
            .joinedload(BloodRequest.hospital),
        )
        .filter(Donor.user_id == current_user.id)
        .first()
    )
    if not donor:
        raise HTTPException(status_code=404, detail="Donor profile not found")
    return donor


@router.get("/me", response_model=DonorOut)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("donor")),
):
    donor = _get_donor_for_user(db, current_user)
    return donor


@router.get("/me/dashboard", response_model=DonorDashboardOut)
def donor_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("donor")),
):
    donor = _get_donor_for_user(db, current_user)
    units = sorted(donor.blood_units, key=lambda unit: (unit.collection_date, unit.created_at), reverse=True)
    receipts = [_receipt_from_unit(unit) for unit in units]

    return DonorDashboardOut(
        donor=DonorOut.model_validate(donor),
        receipts=receipts,
        total_donations=len(units),
        allocated_units=sum(1 for unit in units if unit.status.value == "allocated"),
        latest_donation_date=max((unit.collection_date for unit in units), default=None),
    )


@router.get("/me/units", response_model=list[BloodUnitOut])
def donor_units_self(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("donor")),
):
    donor = _get_donor_for_user(db, current_user)
    return (
        db.query(BloodUnit)
        .options(
            joinedload(BloodUnit.donor),
            joinedload(BloodUnit.blood_bank),
            joinedload(BloodUnit.allocations)
            .joinedload(BloodRequestAllocation.request)
            .joinedload(BloodRequest.hospital),
        )
        .filter(BloodUnit.donor_id == donor.id)
        .order_by(BloodUnit.collection_date.desc(), BloodUnit.created_at.desc())
        .all()
    )


@router.get("/", response_model=list[DonorOut])
def list_donors(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donors = _staff_visible_donors_query(db, current_user).order_by(Donor.created_at.desc()).all()
    for donor in donors:
        sync_donor_eligibility(donor)
    db.commit()
    return donors


@router.post("/", response_model=DonorOut)
def create_donor(
    _payload: DonorCreate,
    _: Session = Depends(get_db),
    __: User = Depends(require_role("admin", "lab_technician")),
):
    raise HTTPException(
        status_code=status.HTTP_405_METHOD_NOT_ALLOWED,
        detail="Donors must self-register from the login page",
    )


@router.get("/{donor_id}", response_model=DonorOut)
def get_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = _staff_visible_donors_query(db, current_user).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    sync_donor_eligibility(donor)
    db.commit()
    return donor


@router.put("/{donor_id}", response_model=DonorOut)
def update_donor(
    donor_id: uuid.UUID,
    payload: DonorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = _staff_visible_donors_query(db, current_user).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    updates = payload.model_dump(exclude_unset=True)
    if "email" in updates and updates["email"] and updates["email"] != donor.email:
        duplicate = db.query(Donor).filter(Donor.email == updates["email"], Donor.id != donor.id).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Email is already used by another donor")
        duplicate_user = db.query(User).filter(User.email == updates["email"]).first()
        if duplicate_user and duplicate_user.id != donor.user_id:
            raise HTTPException(status_code=400, detail="Email is already used by another account")

    for key, value in updates.items():
        setattr(donor, key, value)

    if donor.user:
        donor.user.full_name = donor.full_name
        donor.user.phone_number = donor.phone_number
        donor.user.email = donor.email

    sync_donor_eligibility(donor, today=date.today())
    log_action(
        db,
        "DONOR_UPDATED",
        "donor",
        str(donor.id),
        user_id=current_user.id,
        details={"updated_fields": sorted(updates.keys())},
    )
    db.commit()
    db.refresh(donor)
    return donor


@router.delete("/{donor_id}")
def delete_donor(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = _staff_visible_donors_query(db, current_user).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")
    donor.is_eligible = False
    if donor.user:
        donor.user.is_active = False
    log_action(db, "DONOR_SOFT_DELETED", "donor", str(donor.id), user_id=current_user.id)
    db.commit()
    return {"message": "Donor deactivated"}


@router.get("/{donor_id}/units", response_model=list[BloodUnitOut])
def donor_units(
    donor_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    donor = _staff_visible_donors_query(db, current_user).filter(Donor.id == donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    units_query = (
        db.query(BloodUnit)
        .options(
            joinedload(BloodUnit.donor),
            joinedload(BloodUnit.blood_bank),
            joinedload(BloodUnit.allocations)
            .joinedload(BloodRequestAllocation.request)
            .joinedload(BloodRequest.hospital),
        )
        .filter(BloodUnit.donor_id == donor_id)
    )
    if current_user.blood_bank_id:
        units_query = units_query.filter(BloodUnit.blood_bank_id == current_user.blood_bank_id)
    return units_query.order_by(BloodUnit.collection_date.desc(), BloodUnit.created_at.desc()).all()
