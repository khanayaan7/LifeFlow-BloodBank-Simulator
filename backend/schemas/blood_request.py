import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models import BloodComponent, BloodGroup, RequestStatus, RequestUrgency


class BloodRequestCreate(BaseModel):
    hospital_id: uuid.UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int
    urgency: RequestUrgency
    notes: str | None = None


class BloodRequestCancel(BaseModel):
    notes: str | None = None


class BloodRequestAllocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    request_id: uuid.UUID
    blood_unit_id: uuid.UUID
    allocated_at: datetime
    allocation_score: float


class BloodRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    hospital_id: uuid.UUID
    requested_by: uuid.UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int
    urgency: RequestUrgency
    status: RequestStatus
    requested_at: datetime
    fulfilled_at: datetime | None
    notes: str | None
    allocations: list[BloodRequestAllocationOut] = []
