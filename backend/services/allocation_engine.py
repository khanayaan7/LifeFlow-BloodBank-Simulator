from datetime import date, datetime, timezone

from sqlalchemy.orm import Session

from models import RequestStatus
from models.blood_request import BloodRequest, BloodRequestAllocation
from models.blood_unit import BloodUnit
from models import BloodUnitStatus
from utils.audit import log_action

URGENCY_MULTIPLIER = {
    "routine": 1.0,
    "urgent": 1.2,
    "emergency": 1.5,
}


def _score_unit(unit: BloodUnit, urgency: str) -> float:
    days_left = max((unit.expiry_date - date.today()).days, 0)
    expiry_score = 1 - (days_left / 35)
    expiry_score = min(max(expiry_score, 0.0), 1.0)
    cold_chain_score = float(unit.cold_chain_score or 0.0)
    return (expiry_score * 0.6 + cold_chain_score * 0.4) * URGENCY_MULTIPLIER.get(urgency, 1.0)


def allocate_units(request_id, db: Session) -> list[BloodUnit]:
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        return []

    units = (
        db.query(BloodUnit)
        .filter(BloodUnit.blood_group == req.blood_group)
        .filter(BloodUnit.component == req.component)
        .filter(BloodUnit.blood_bank_id == req.blood_bank_id)
        .filter(BloodUnit.status == BloodUnitStatus.available)
        .filter(BloodUnit.expiry_date > date.today())
        .all()
    )

    scored = sorted(
        [(unit, _score_unit(unit, req.urgency.value)) for unit in units],
        key=lambda pair: pair[1],
        reverse=True,
    )

    selected = scored[: req.units_needed]
    allocated_units = []

    if len(selected) < req.units_needed:
        req.status = RequestStatus.partial
        log_action(
            db,
            action="REQUEST_PARTIAL_SHORTAGE",
            entity_type="blood_request",
            entity_id=str(req.id),
            user_id=req.requested_by,
            details={"needed": req.units_needed, "allocated": len(selected)},
        )
    else:
        req.status = RequestStatus.fulfilled

    req.fulfilled_at = datetime.now(timezone.utc)

    for unit, score in selected:
        unit.status = BloodUnitStatus.allocated
        alloc = BloodRequestAllocation(
            request_id=req.id,
            blood_unit_id=unit.id,
            allocation_score=score,
        )
        db.add(alloc)
        allocated_units.append(unit)
        log_action(
            db,
            action="UNIT_ALLOCATED",
            entity_type="blood_unit",
            entity_id=str(unit.id),
            user_id=req.requested_by,
            details={"request_id": str(req.id), "score": score},
        )

    db.flush()
    return allocated_units
