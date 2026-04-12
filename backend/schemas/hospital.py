import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class HospitalBase(BaseModel):
    name: str
    address: str | None = None
    contact_person: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None


class HospitalCreate(HospitalBase):
    pass


class HospitalUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    contact_person: str | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    is_active: bool | None = None


class HospitalOut(HospitalBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_active: bool
    created_at: datetime
