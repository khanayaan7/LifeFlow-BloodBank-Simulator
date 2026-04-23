from datetime import datetime, timedelta, timezone
from concurrent.futures import ThreadPoolExecutor, TimeoutError

from sqlalchemy.orm import Session

from models import ViolationSeverity
from models.blood_unit import BloodUnit
from models.cold_chain_violation import ColdChainViolation
from models.temperature_log import TemperatureLog
from services.alert_service import send_cold_chain_sms, send_cold_chain_violation_email

SAFE_MIN = 1.0
SAFE_MAX = 8.0
VIOLATION_TRIGGER_MINUTES = 2
ALERT_INTERVAL_MINUTES = 2
ALERT_CALL_TIMEOUT_SECONDS = 3

# In-process throttle to avoid spamming on every ingest call.
last_alert_at_by_storage_unit: dict[str, datetime] = {}
alert_executor = ThreadPoolExecutor(max_workers=2)


def _call_alert_with_timeout(fn, *args) -> bool:
    # Keep ingest responsive even when external alert providers are slow.
    future = alert_executor.submit(fn, *args)
    try:
        return bool(future.result(timeout=ALERT_CALL_TIMEOUT_SECONDS))
    except TimeoutError:
        return False
    except Exception:
        return False


def _duration_to_severity(duration_minutes: int) -> ViolationSeverity:
    if duration_minutes < 15:
        return ViolationSeverity.minor
    if duration_minutes <= 60:
        return ViolationSeverity.moderate
    return ViolationSeverity.critical


def _score_factor(severity: ViolationSeverity) -> float:
    if severity == ViolationSeverity.minor:
        return 0.9
    if severity == ViolationSeverity.moderate:
        return 0.7
    return 0.4


def _assess_storage_unit(db: Session, storage_unit_id: str, send_alerts: bool = True):
    now = datetime.now(timezone.utc)
    recent = (
        db.query(TemperatureLog)
        .filter(TemperatureLog.storage_unit_id == storage_unit_id)
        .filter(TemperatureLog.recorded_at >= now - timedelta(minutes=60))
        .order_by(TemperatureLog.recorded_at.asc())
        .all()
    )
    if not recent:
        return

    latest = recent[-1]

    open_violation = (
        db.query(ColdChainViolation)
        .filter(ColdChainViolation.storage_unit_id == storage_unit_id)
        .filter(ColdChainViolation.resolved_at.is_(None))
        .order_by(ColdChainViolation.created_at.desc())
        .first()
    )

    if latest.temperature_c >= SAFE_MIN and latest.temperature_c <= SAFE_MAX:
        if open_violation:
            open_violation.resolved_at = now
        last_alert_at_by_storage_unit.pop(storage_unit_id, None)
        return

    # Compute continuous out-of-range streak ending at latest reading.
    streak_logs: list[TemperatureLog] = []
    for log in reversed(recent):
        if log.temperature_c < SAFE_MIN or log.temperature_c > SAFE_MAX:
            streak_logs.append(log)
            continue
        break

    if not streak_logs:
        return

    streak_start = streak_logs[-1].recorded_at
    duration_minutes = max(1, int((now - streak_start).total_seconds() // 60) + 1)
    if duration_minutes < VIOLATION_TRIGGER_MINUTES:
        return

    severity = _duration_to_severity(duration_minutes)
    if not open_violation:
        open_violation = ColdChainViolation(
            storage_unit_id=storage_unit_id,
            temperature_c=latest.temperature_c,
            safe_min=SAFE_MIN,
            safe_max=SAFE_MAX,
            duration_minutes=duration_minutes,
            severity=severity,
        )
        db.add(open_violation)
    else:
        open_violation.temperature_c = latest.temperature_c
        open_violation.duration_minutes = duration_minutes
        open_violation.severity = severity

    units = db.query(BloodUnit).filter(BloodUnit.storage_unit_id == storage_unit_id).all()
    factor = _score_factor(severity)
    for unit in units:
        unit.cold_chain_ok = False
        unit.cold_chain_score = max(0.1, float(unit.cold_chain_score) * factor)

    last_sent_at = last_alert_at_by_storage_unit.get(storage_unit_id)
    should_send_alert = (
        last_sent_at is None or now - last_sent_at >= timedelta(minutes=ALERT_INTERVAL_MINUTES)
    )
    if send_alerts and should_send_alert:
        email_ok = _call_alert_with_timeout(send_cold_chain_violation_email, open_violation)
        sms_ok = _call_alert_with_timeout(send_cold_chain_sms, open_violation)
        open_violation.alert_sent = email_ok and sms_ok
        if email_ok and sms_ok:
            last_alert_at_by_storage_unit[storage_unit_id] = now


def check_all_storage_units(db: Session, send_alerts: bool = True):
    storage_units = db.query(TemperatureLog.storage_unit_id).distinct().all()
    for (storage_unit_id,) in storage_units:
        _assess_storage_unit(db, storage_unit_id, send_alerts=send_alerts)


def check_storage_unit(db: Session, storage_unit_id: str, send_alerts: bool = True):
    _assess_storage_unit(db, storage_unit_id, send_alerts=send_alerts)
