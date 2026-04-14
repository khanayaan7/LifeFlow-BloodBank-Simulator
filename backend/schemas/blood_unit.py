import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field

from models import BloodComponent, BloodGroup, BloodUnitStatus


class BloodUnitCreate(BaseModel):
    unit_code: str
    blood_group: BloodGroup
    component: BloodComponent
    volume_ml: int
    expiry_date: date
    status: BloodUnitStatus
    cold_chain_ok: bool
    donor_id: uuid.UUID | None = None
    collection_date: date = Field(default_factory=date.today)
    storage_unit_id: str = "MANUAL-ENTRY"


class BloodUnitStatusUpdate(BaseModel):
    status: BloodUnitStatus


class BloodUnitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    unit_code: str
    blood_group: BloodGroup
    component: BloodComponent
    volume_ml: int
    donor_id: uuid.UUID | None
    collection_date: date
    expiry_date: date
    status: BloodUnitStatus
    storage_unit_id: str
    cold_chain_ok: bool
    cold_chain_score: float
    created_at: datetime
    updated_at: datetime | None
