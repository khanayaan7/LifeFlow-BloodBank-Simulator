from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models.temperature_log import TemperatureLog
from models.user import User
from schemas.temperature_log import TemperatureIngest, TemperatureLogOut
from services.violation_checker import check_storage_unit

router = APIRouter(tags=["temperature"])


@router.post("/ingest")
def ingest_temperature(payload: TemperatureIngest, db: Session = Depends(get_db)):
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

    violation_created = payload.temperature_c < 2.0 or payload.temperature_c > 6.0
    return {"status": "ok", "violation_created": violation_created}


@router.get("/latest")
def latest_temperatures(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    subquery = (
        db.query(TemperatureLog.storage_unit_id, func.max(TemperatureLog.recorded_at).label("max_recorded_at"))
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
    _: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(hours=hours)
    return (
        db.query(TemperatureLog)
        .filter(TemperatureLog.storage_unit_id == storage_unit_id)
        .filter(TemperatureLog.recorded_at >= since)
        .order_by(TemperatureLog.recorded_at.desc())
        .limit(limit)
        .all()
    )


@router.get("/storage-units")
def storage_units(db: Session = Depends(get_db)):
    rows = db.query(TemperatureLog.storage_unit_id).distinct().all()
    return [r[0] for r in rows]
