import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class TemperatureIngest(BaseModel):
    storage_unit_id: str
    temperature_c: float
    recorded_at: datetime | None = None


class TemperatureLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    storage_unit_id: str
    temperature_c: float
    recorded_at: datetime
    source: str
