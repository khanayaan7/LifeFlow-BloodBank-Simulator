from datetime import date, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
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
def dashboard_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    total_units = db.query(BloodUnit).count()
    available_units = db.query(BloodUnit).filter(BloodUnit.status == BloodUnitStatus.available).count()
    expiring_soon = db.query(BloodUnit).filter(BloodUnit.expiry_date <= date.today() + timedelta(days=7)).count()
    pending_requests = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.pending).count()
    active_violations = db.query(ColdChainViolation).filter(ColdChainViolation.resolved_at.is_(None)).count()
    units_at_risk = db.query(BloodUnit).filter(BloodUnit.cold_chain_ok.is_(False)).count()
    total_donors = db.query(Donor).count()
    total_requests = db.query(BloodRequest).count()
    fulfilled = db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.fulfilled).count()

    by_group = {}
    for bg in BloodGroup:
        by_group[bg.value] = db.query(BloodUnit).filter(BloodUnit.blood_group == bg).count()

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
def recent_activity(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
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
