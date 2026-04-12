import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from models import BloodGroup


class DonorBase(BaseModel):
    full_name: str
    blood_group: BloodGroup
    age: int
    phone_number: str
    email: EmailStr | None = None
    last_donation: date | None = None


class DonorCreate(DonorBase):
    pass


class DonorUpdate(BaseModel):
    full_name: str | None = None
    blood_group: BloodGroup | None = None
    age: int | None = None
    phone_number: str | None = None
    email: EmailStr | None = None
    last_donation: date | None = None
    is_eligible: bool | None = None


class DonorOut(DonorBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    is_eligible: bool
    created_at: datetime
    created_by: uuid.UUID
