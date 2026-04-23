import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from auth.dependencies import require_role
from database import get_db
from models import BloodComponent, BloodGroup, BloodUnitStatus
from models.blood_request import BloodRequest, BloodRequestAllocation
from models.blood_unit import BloodUnit
from models.donor import Donor
from models.user import User
from schemas.blood_unit import BloodUnitCreate, BloodUnitOut, BloodUnitStatusUpdate, BloodUnitUpdate
from utils.audit import log_action
from utils.donors import DONATION_COOLDOWN_DAYS, sync_donor_eligibility

router = APIRouter(tags=["blood_units"])


def _unit_query(db: Session):
    return db.query(BloodUnit).options(
        joinedload(BloodUnit.donor),
        joinedload(BloodUnit.blood_bank),
        joinedload(BloodUnit.allocations)
        .joinedload(BloodRequestAllocation.request)
        .joinedload(BloodRequest.hospital),
    )


def _scoped_unit_query(db: Session, current_user: User):
    query = _unit_query(db)
    if current_user.blood_bank_id:
        query = query.filter(BloodUnit.blood_bank_id == current_user.blood_bank_id)
    return query


def _validate_donor_for_unit(
    *,
    donor: Donor,
    blood_group: BloodGroup,
    collection_date: date,
):
    if donor.last_donation and collection_date > donor.last_donation and (collection_date - donor.last_donation).days < DONATION_COOLDOWN_DAYS:
        raise HTTPException(
            status_code=400,
            detail=f"Donor is still in the {DONATION_COOLDOWN_DAYS}-day recovery window",
        )
    if donor.blood_group and donor.blood_group != blood_group:
        raise HTTPException(status_code=400, detail="Blood group does not match donor profile")


def _sync_donor_after_donation(donor: Donor, current_user: User, collection_date: date, blood_group: BloodGroup):
    donor.last_donation = collection_date
    donor.blood_group = donor.blood_group or blood_group
    if donor.blood_bank_id is None:
        donor.blood_bank_id = current_user.blood_bank_id
    sync_donor_eligibility(donor, today=collection_date)


@router.get("/", response_model=list[BloodUnitOut])
def list_units(
    blood_group: BloodGroup | None = Query(default=None),
    status: BloodUnitStatus | None = Query(default=None),
    component: BloodComponent | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    query = _scoped_unit_query(db, current_user)
    if blood_group:
        query = query.filter(BloodUnit.blood_group == blood_group)
    if status:
        query = query.filter(BloodUnit.status == status)
    if component:
        query = query.filter(BloodUnit.component == component)
    return query.order_by(BloodUnit.expiry_date.asc()).all()


@router.post("/", response_model=BloodUnitOut)
def create_unit(
    payload: BloodUnitCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    existing = db.query(BloodUnit).filter(BloodUnit.unit_code == payload.unit_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit code already exists")

    if payload.expiry_date < payload.collection_date:
        raise HTTPException(status_code=400, detail="Expiry date cannot be before collection date")

    donor = db.query(Donor).filter(Donor.id == payload.donor_id).first()
    if not donor:
        raise HTTPException(status_code=404, detail="Donor not found")

    _validate_donor_for_unit(donor=donor, blood_group=payload.blood_group, collection_date=payload.collection_date)

    unit = BloodUnit(
        unit_code=payload.unit_code,
        blood_group=payload.blood_group,
        component=payload.component,
        volume_ml=payload.volume_ml,
        blood_bank_id=current_user.blood_bank_id,
        donor_id=donor.id,
        collection_date=payload.collection_date,
        expiry_date=payload.expiry_date,
        storage_unit_id=payload.storage_unit_id,
        status=payload.status,
        cold_chain_ok=payload.cold_chain_ok,
        cold_chain_score=1.0 if payload.cold_chain_ok else 0.4,
    )
    db.add(unit)
    _sync_donor_after_donation(donor, current_user, payload.collection_date, payload.blood_group)
    db.flush()

    log_action(
        db,
        action="BLOOD_UNIT_CREATED",
        entity_type="blood_unit",
        entity_id=str(unit.id),
        user_id=current_user.id,
        details={"unit_code": unit.unit_code, "donor_code": donor.donor_code},
    )
    db.commit()
    return _unit_query(db).filter(BloodUnit.id == unit.id).first()


@router.get("/available/{blood_group}", response_model=list[BloodUnitOut])
def available_by_group(
    blood_group: BloodGroup,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    query = _scoped_unit_query(db, current_user)
    return (
        query
        .filter(and_(BloodUnit.blood_group == blood_group, BloodUnit.status == BloodUnitStatus.available))
        .order_by(BloodUnit.expiry_date.asc())
        .all()
    )


@router.get("/expiring-soon", response_model=list[BloodUnitOut])
def expiring_soon(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    threshold = date.today() + timedelta(days=7)
    return (
        _scoped_unit_query(db, current_user)
        .filter(BloodUnit.expiry_date <= threshold)
        .filter(BloodUnit.status.in_([BloodUnitStatus.available, BloodUnitStatus.reserved]))
        .order_by(BloodUnit.expiry_date.asc())
        .all()
    )


@router.get("/{unit_id}", response_model=BloodUnitOut)
def get_unit(
    unit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    unit = _scoped_unit_query(db, current_user).filter(BloodUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.put("/{unit_id}", response_model=BloodUnitOut)
def update_unit(
    unit_id: uuid.UUID,
    payload: BloodUnitUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    unit = (
        db.query(BloodUnit)
        .options(joinedload(BloodUnit.donor))
        .filter(BloodUnit.id == unit_id)
        .first()
    )
    if not unit or (current_user.blood_bank_id and unit.blood_bank_id != current_user.blood_bank_id):
        raise HTTPException(status_code=404, detail="Unit not found")

    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        return _unit_query(db).filter(BloodUnit.id == unit.id).first()

    if "unit_code" in updates and updates["unit_code"] != unit.unit_code:
        duplicate = db.query(BloodUnit).filter(BloodUnit.unit_code == updates["unit_code"]).first()
        if duplicate:
            raise HTTPException(status_code=400, detail="Unit code already exists")

    collection_date = updates.get("collection_date", unit.collection_date)
    expiry_date = updates.get("expiry_date", unit.expiry_date)
    if expiry_date < collection_date:
        raise HTTPException(status_code=400, detail="Expiry date cannot be before collection date")

    donor = unit.donor
    if "donor_id" in updates and updates["donor_id"] != unit.donor_id:
        donor = db.query(Donor).filter(Donor.id == updates["donor_id"]).first()
        if not donor:
            raise HTTPException(status_code=404, detail="Donor not found")

    if donor:
        _validate_donor_for_unit(
            donor=donor,
            blood_group=updates.get("blood_group", unit.blood_group),
            collection_date=collection_date,
        )

    for key, value in updates.items():
        setattr(unit, key, value)

    if donor:
        _sync_donor_after_donation(donor, current_user, collection_date, unit.blood_group)

    if "cold_chain_ok" in updates and "cold_chain_score" not in updates:
        unit.cold_chain_score = 1.0 if unit.cold_chain_ok else 0.4

    log_action(
        db,
        action="BLOOD_UNIT_UPDATED",
        entity_type="blood_unit",
        entity_id=str(unit.id),
        user_id=current_user.id,
        details={"updated_fields": sorted(updates.keys())},
    )
    db.commit()
    return _unit_query(db).filter(BloodUnit.id == unit.id).first()


@router.put("/{unit_id}/status", response_model=BloodUnitOut)
def update_status(
    unit_id: uuid.UUID,
    payload: BloodUnitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    unit = _scoped_unit_query(db, current_user).filter(BloodUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    unit.status = payload.status
    log_action(
        db,
        action="BLOOD_UNIT_STATUS_UPDATED",
        entity_type="blood_unit",
        entity_id=str(unit.id),
        user_id=current_user.id,
        details={"status": payload.status.value},
    )
    db.commit()
    return _unit_query(db).filter(BloodUnit.id == unit.id).first()


@router.delete("/{unit_id}")
def delete_unit(
    unit_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    unit = _scoped_unit_query(db, current_user).filter(BloodUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    log_action(
        db,
        action="BLOOD_UNIT_DELETED",
        entity_type="blood_unit",
        entity_id=str(unit.id),
        user_id=current_user.id,
        details={"unit_code": unit.unit_code},
    )
    db.delete(unit)
    db.commit()
    return {"status": "deleted", "id": str(unit_id)}
