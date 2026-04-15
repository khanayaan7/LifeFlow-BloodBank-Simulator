import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from auth.dependencies import get_current_user, require_role
from database import get_db
from models import RequestStatus, RequestUrgency
from models.blood_request import BloodRequest
from models.user import User
from schemas.blood_request import BloodRequestCancel, BloodRequestCreate, BloodRequestOut
from services.allocation_engine import allocate_units
from utils.audit import log_action

router = APIRouter(tags=["requests"])


@router.get("/", response_model=list[BloodRequestOut])
def list_requests(
    status: RequestStatus | None = Query(default=None),
    urgency: RequestUrgency | None = Query(default=None),
    db: Session = Depends(get_db),
    _: User = Depends(get_current_user),
):
    query = db.query(BloodRequest)
    if status:
        query = query.filter(BloodRequest.status == status)
    if urgency:
        query = query.filter(BloodRequest.urgency == urgency)
    return query.order_by(BloodRequest.requested_at.desc()).all()


@router.get("/pending", response_model=list[BloodRequestOut])
def pending_requests(
    db: Session = Depends(get_db),
    _: User = Depends(require_role("admin", "hospital_staff", "lab_technician")),
):
    return db.query(BloodRequest).filter(BloodRequest.status == RequestStatus.pending).all()


@router.post("/", response_model=BloodRequestOut)
def create_request(
    payload: BloodRequestCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "hospital_staff")),
):
    if payload.status != RequestStatus.pending:
        raise HTTPException(status_code=400, detail="New requests must start with pending status")

    req = BloodRequest(
        **payload.model_dump(exclude={"status"}),
        requested_by=current_user.id,
        status=RequestStatus.pending,
    )
    db.add(req)
    db.flush()
    log_action(
        db,
        action="REQUEST_CREATED",
        entity_type="blood_request",
        entity_id=str(req.id),
        user_id=current_user.id,
        details={"units_needed": req.units_needed, "urgency": req.urgency.value, "status": req.status.value},
    )
    db.commit()
    db.refresh(req)
    return req


@router.get("/{request_id}", response_model=BloodRequestOut)
def get_request(request_id: uuid.UUID, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return req


@router.post("/{request_id}/fulfill", response_model=BloodRequestOut)
def fulfill_request(
    request_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "lab_technician")),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status == RequestStatus.cancelled:
        raise HTTPException(status_code=400, detail="Cannot fulfill cancelled request")
    if req.status == RequestStatus.fulfilled:
        raise HTTPException(status_code=400, detail="Request already fulfilled")

    allocate_units(request_id, db)
    log_action(db, "REQUEST_FULFILLED", "blood_request", str(request_id), user_id=current_user.id)
    db.commit()
    db.refresh(req)
    return req


@router.put("/{request_id}/cancel", response_model=BloodRequestOut)
def cancel_request(
    request_id: uuid.UUID,
    payload: BloodRequestCancel,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin")),
):
    req = db.query(BloodRequest).filter(BloodRequest.id == request_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    req.status = RequestStatus.cancelled
    if payload.notes:
        req.notes = payload.notes
    log_action(db, "REQUEST_CANCELLED", "blood_request", str(request_id), user_id=current_user.id)
    db.commit()
    db.refresh(req)
    return req
