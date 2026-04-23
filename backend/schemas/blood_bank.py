import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BloodBankOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    location: str
    code: str
    created_at: datetime
