from datetime import date

from apscheduler.schedulers.background import BackgroundScheduler

from database import SessionLocal
from models import BloodUnitStatus
from models.blood_unit import BloodUnit
from services.alert_service import send_expiry_summary_email
from services.violation_checker import check_all_storage_units
from utils.audit import log_action

scheduler = BackgroundScheduler()


def check_violations_job():
    db = SessionLocal()
    try:
        check_all_storage_units(db)
        db.commit()
    finally:
        db.close()


def expire_blood_units_job():
    db = SessionLocal()
    try:
        units = (
            db.query(BloodUnit)
            .filter(BloodUnit.expiry_date < date.today())
            .filter(BloodUnit.status == BloodUnitStatus.available)
            .all()
        )
        for unit in units:
            unit.status = BloodUnitStatus.expired
            log_action(
                db,
                action="BLOOD_UNIT_EXPIRED",
                entity_type="blood_unit",
                entity_id=str(unit.id),
                details={"unit_code": unit.unit_code},
            )
        if units:
            send_expiry_summary_email(units)
        db.commit()
    finally:
        db.close()


def start_scheduler():
    if not scheduler.running:
        scheduler.add_job(check_violations_job, "interval", minutes=5, id="check_violations", replace_existing=True)
        scheduler.add_job(expire_blood_units_job, "cron", hour=0, minute=0, id="expire_blood_units", replace_existing=True)
        scheduler.start()


def stop_scheduler():
    if scheduler.running:
        scheduler.shutdown(wait=False)
