import uuid
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import and_
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_role
from database import get_db
from models import BloodComponent, BloodGroup, BloodUnitStatus
from models.blood_unit import BloodUnit
from models.user import User
from schemas.blood_unit import BloodUnitCreate, BloodUnitOut, BloodUnitStatusUpdate
from utils.audit import log_action

router = APIRouter(tags=["blood_units"])


def _expiry_for_component(component: BloodComponent, collection_date: date) -> date:
    if component in (BloodComponent.whole_blood, BloodComponent.packed_rbc):
        return collection_date + timedelta(days=35)
    if component == BloodComponent.plasma:
        return collection_date + timedelta(days=365)
    return collection_date + timedelta(days=5)


def _next_unit_code(db: Session) -> str:
    prefix = f"BU-{date.today().strftime('%Y%m%d')}-"
    count = db.query(BloodUnit).filter(BloodUnit.unit_code.like(f"{prefix}%")).count() + 1
    return f"{prefix}{count:03d}"


@router.get("/", response_model=list[BloodUnitOut])
def list_units(
    blood_group: BloodGroup | None = Query(default=None),
    status: BloodUnitStatus | None = Query(default=None),
    component: BloodComponent | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(BloodUnit)
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
    current_user: User = Depends(require_role("lab_technician")),
):
    existing = db.query(BloodUnit).filter(BloodUnit.unit_code == payload.unit_code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Unit code already exists")

    if payload.expiry_date < payload.collection_date:
        raise HTTPException(status_code=400, detail="Expiry date cannot be before collection date")

    unit = BloodUnit(
        unit_code=payload.unit_code,
        blood_group=payload.blood_group,
        component=payload.component,
        volume_ml=payload.volume_ml,
        donor_id=payload.donor_id,
        collection_date=payload.collection_date,
        expiry_date=payload.expiry_date,
        storage_unit_id=payload.storage_unit_id,
        status=payload.status,
        cold_chain_ok=payload.cold_chain_ok,
        cold_chain_score=1.0 if payload.cold_chain_ok else 0.4,
    )
    db.add(unit)
    db.flush()
    log_action(
        db,
        action="BLOOD_UNIT_CREATED",
        entity_type="blood_unit",
        entity_id=str(unit.id),
        user_id=current_user.id,
        details={"unit_code": unit.unit_code},
    )
    db.commit()
    db.refresh(unit)
    return unit


@router.get("/available/{blood_group}", response_model=list[BloodUnitOut])
def available_by_group(
    blood_group: BloodGroup,
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    return (
        db.query(BloodUnit)
        .filter(and_(BloodUnit.blood_group == blood_group, BloodUnit.status == BloodUnitStatus.available))
        .order_by(BloodUnit.expiry_date.asc())
        .all()
    )


@router.get("/expiring-soon", response_model=list[BloodUnitOut])
def expiring_soon(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    threshold = date.today() + timedelta(days=7)
    return (
        db.query(BloodUnit)
        .filter(BloodUnit.expiry_date <= threshold)
        .filter(BloodUnit.status.in_([BloodUnitStatus.available, BloodUnitStatus.reserved]))
        .order_by(BloodUnit.expiry_date.asc())
        .all()
    )


@router.get("/{unit_id}", response_model=BloodUnitOut)
def get_unit(unit_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    unit = db.query(BloodUnit).filter(BloodUnit.id == unit_id).first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    return unit


@router.put("/{unit_id}/status", response_model=BloodUnitOut)
def update_status(
    unit_id: uuid.UUID,
    payload: BloodUnitStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    unit = db.query(BloodUnit).filter(BloodUnit.id == unit_id).first()
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
    db.refresh(unit)
    return unit
