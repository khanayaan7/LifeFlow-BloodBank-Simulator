import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models import BloodComponent, BloodGroup, RequestStatus, RequestUrgency


class BloodRequestCreate(BaseModel):
    hospital_id: uuid.UUID | None = None
    blood_bank_id: uuid.UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int
    patient_name: str
    patient_id: str
    urgency: RequestUrgency
    status: RequestStatus = RequestStatus.pending
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
    blood_bank_id: uuid.UUID | None
    requested_by: uuid.UUID
    blood_group: BloodGroup
    component: BloodComponent
    units_needed: int
    patient_name: str
    patient_id: str
    urgency: RequestUrgency
    status: RequestStatus
    requested_at: datetime
    fulfilled_at: datetime | None
    notes: str | None
    requesting_hospital_name: str | None = None
    target_blood_bank_name: str | None = None
    allocations: list[BloodRequestAllocationOut] = []
