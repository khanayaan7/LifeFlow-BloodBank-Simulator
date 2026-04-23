from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.blood_bank import BloodBank
from models.temperature_log import TemperatureLog
from models.user import User
from schemas.temperature_log import TemperatureIngest, TemperatureLogOut
from services.violation_checker import check_storage_unit

router = APIRouter(tags=["temperature"])


def _bank_storage_prefix(db: Session, current_user: User) -> str | None:
    if not current_user.blood_bank_id:
        return None

    bank = db.query(BloodBank).filter(BloodBank.id == current_user.blood_bank_id).first()
    if not bank:
        return None

    code = (bank.code or "").upper()
    if code == "BANK_MORE":
        return "BM-"
    if code == "CITY_CENTER":
        return "CC-"
    return None


def _is_supported_storage_unit(storage_unit_id: str) -> bool:
    return storage_unit_id.startswith("BM-") or storage_unit_id.startswith("CC-")


@router.post("/ingest")
def ingest_temperature(payload: TemperatureIngest, db: Session = Depends(get_db)):
    if not _is_supported_storage_unit(payload.storage_unit_id):
        raise HTTPException(status_code=400, detail="Unsupported storage unit. Use bank-specific fridge IDs.")

    log = TemperatureLog(
        storage_unit_id=payload.storage_unit_id,
        temperature_c=payload.temperature_c,
        recorded_at=payload.recorded_at or datetime.now(timezone.utc),
        source="iot_simulator",
    )
    db.add(log)
    db.flush()

    # Keep ingest latency low; scheduler handles outbound alert delivery.
    check_storage_unit(db, payload.storage_unit_id, send_alerts=False)
    db.commit()

    violation_created = payload.temperature_c < 1.0 or payload.temperature_c > 8.0
    return {"status": "ok", "violation_created": violation_created}


@router.get("/latest")
def latest_temperatures(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    base_query = db.query(TemperatureLog)
    prefix = _bank_storage_prefix(db, current_user)
    if prefix:
        base_query = base_query.filter(TemperatureLog.storage_unit_id.like(f"{prefix}%"))

    subquery = (
        base_query.with_entities(
            TemperatureLog.storage_unit_id,
            func.max(TemperatureLog.recorded_at).label("max_recorded_at"),
        )
        .group_by(TemperatureLog.storage_unit_id)
        .subquery()
    )
    rows = (
        db.query(TemperatureLog)
        .join(
            subquery,
            (TemperatureLog.storage_unit_id == subquery.c.storage_unit_id)
            & (TemperatureLog.recorded_at == subquery.c.max_recorded_at),
        )
        .all()
    )
    return [TemperatureLogOut.model_validate(r) for r in rows]


@router.get("/history/{storage_unit_id}", response_model=list[TemperatureLogOut])
def temperature_history(
    storage_unit_id: str,
    hours: int = Query(default=24),
    limit: int = Query(default=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    prefix = _bank_storage_prefix(db, current_user)
    if prefix and not storage_unit_id.startswith(prefix):
        return []

    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    query = (
        db.query(TemperatureLog)
        .filter(TemperatureLog.storage_unit_id == storage_unit_id)
        .filter(TemperatureLog.recorded_at >= since)
    )
    if prefix:
        query = query.filter(TemperatureLog.storage_unit_id.like(f"{prefix}%"))
    return query.order_by(TemperatureLog.recorded_at.desc()).limit(limit).all()


@router.get("/storage-units")
def storage_units(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(TemperatureLog.storage_unit_id)
    prefix = _bank_storage_prefix(db, current_user)
    if prefix:
        query = query.filter(TemperatureLog.storage_unit_id.like(f"{prefix}%"))
    rows = query.distinct().all()
    return [r[0] for r in rows]
