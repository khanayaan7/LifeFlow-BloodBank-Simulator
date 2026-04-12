from datetime import datetime

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user
from database import get_db
from models import ViolationSeverity
from models.cold_chain_violation import ColdChainViolation
from models.user import User
from schemas.cold_chain_violation import ColdChainViolationOut

router = APIRouter(tags=["violations"])


@router.get("/", response_model=list[ColdChainViolationOut])
def list_violations(
    severity: ViolationSeverity | None = Query(default=None),
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(ColdChainViolation)
    if severity:
        query = query.filter(ColdChainViolation.severity == severity)
    if start_date:
        query = query.filter(ColdChainViolation.created_at >= start_date)
    if end_date:
        query = query.filter(ColdChainViolation.created_at <= end_date)
    return query.order_by(ColdChainViolation.created_at.desc()).all()


@router.get("/active", response_model=list[ColdChainViolationOut])
def active_violations(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return (
        db.query(ColdChainViolation)
        .filter(ColdChainViolation.resolved_at.is_(None))
        .order_by(ColdChainViolation.created_at.desc())
        .all()
    )
