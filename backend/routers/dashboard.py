from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_role
from database import get_db
from models import BloodGroup, BloodUnitStatus, RequestStatus
from models.audit_log import AuditLog
from models.blood_request import BloodRequest
from models.blood_unit import BloodUnit
from models.cold_chain_violation import ColdChainViolation
from models.donor import Donor
from models.user import User

router = APIRouter(tags=["dashboard"])


@router.get("/stats")
def dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hospital_staff", "lab_technician", "auditor")),
):
    units_query = db.query(BloodUnit)
    requests_query = db.query(BloodRequest)
    donors_query = db.query(Donor)
    if current_user.blood_bank_id:
        units_query = units_query.filter(BloodUnit.blood_bank_id == current_user.blood_bank_id)
        requests_query = requests_query.filter(BloodRequest.blood_bank_id == current_user.blood_bank_id)
        donors_query = donors_query.filter(Donor.blood_bank_id == current_user.blood_bank_id)

    available_units_query = units_query.filter(BloodUnit.status == BloodUnitStatus.available)

    total_units = units_query.count()
    available_units = available_units_query.count()
    expiring_soon = units_query.filter(BloodUnit.expiry_date <= date.today() + timedelta(days=7)).count()
    pending_requests = requests_query.filter(BloodRequest.status == RequestStatus.pending).count()
    if current_user.blood_bank_id:
        storage_units_subquery = (
            db.query(BloodUnit.storage_unit_id)
            .filter(BloodUnit.blood_bank_id == current_user.blood_bank_id)
            .distinct()
            .subquery()
        )
        active_violations = (
            db.query(ColdChainViolation)
            .filter(ColdChainViolation.resolved_at.is_(None))
            .filter(ColdChainViolation.storage_unit_id.in_(storage_units_subquery))
            .count()
        )
    else:
        active_violations = db.query(ColdChainViolation).filter(ColdChainViolation.resolved_at.is_(None)).count()
    units_at_risk = units_query.filter(BloodUnit.cold_chain_ok.is_(False)).count()
    total_donors = donors_query.count()
    total_requests = requests_query.count()
    fulfilled = requests_query.filter(BloodRequest.status == RequestStatus.fulfilled).count()

    by_group = {}
    for bg in BloodGroup:
        by_group[bg.value] = available_units_query.filter(BloodUnit.blood_group == bg).count()

    return {
        "total_units": total_units,
        "available_units": available_units,
        "units_by_blood_group": by_group,
        "expiring_soon": expiring_soon,
        "pending_requests": pending_requests,
        "active_violations": active_violations,
        "units_at_risk": units_at_risk,
        "total_donors": total_donors,
        "fulfillment_rate": round((fulfilled / total_requests) * 100, 2) if total_requests else 0.0,
    }


@router.get("/recent-activity")
def recent_activity(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "lab_technician", "auditor")),
):
    rows = db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(20).all()
    return [
        {
            "id": str(r.id),
            "action": r.action,
            "entity_type": r.entity_type,
            "entity_id": r.entity_id,
            "details": r.details,
            "created_at": r.created_at,
        }
        for r in rows
    ]
