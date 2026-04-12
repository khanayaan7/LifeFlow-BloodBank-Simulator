import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict

from models import ViolationSeverity


class ColdChainViolationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    storage_unit_id: str
    temperature_c: float
    safe_min: float
    safe_max: float
    duration_minutes: int
    severity: ViolationSeverity
    alert_sent: bool
    created_at: datetime
    resolved_at: datetime | None
