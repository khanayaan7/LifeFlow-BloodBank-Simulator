from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models import ViolationSeverity
from models.blood_bank import BloodBank
from models.cold_chain_violation import ColdChainViolation
from models.user import User
from schemas.cold_chain_violation import ColdChainViolationOut

router = APIRouter(tags=["violations"])


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


@router.get("/", response_model=list[ColdChainViolationOut])
def list_violations(
    severity: ViolationSeverity | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ColdChainViolation)
    prefix = _bank_storage_prefix(db, current_user)
    if prefix:
        query = query.filter(ColdChainViolation.storage_unit_id.like(f"{prefix}%"))
    if severity:
        query = query.filter(ColdChainViolation.severity == severity)
    if start_date:
        query = query.filter(ColdChainViolation.created_at >= start_date)
    if end_date:
        query = query.filter(ColdChainViolation.created_at <= end_date)
    return query.order_by(ColdChainViolation.created_at.desc()).all()


@router.get("/active", response_model=list[ColdChainViolationOut])
def active_violations(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    query = db.query(ColdChainViolation).filter(ColdChainViolation.resolved_at.is_(None))
    prefix = _bank_storage_prefix(db, current_user)
    if prefix:
        query = query.filter(ColdChainViolation.storage_unit_id.like(f"{prefix}%"))
    return query.order_by(ColdChainViolation.created_at.desc()).all()
