import uuid
from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from models import BloodGroup


class DonorBase(BaseModel):
    full_name: str
    blood_group: BloodGroup | None = None
    age: int | None = None
    phone_number: str
    email: EmailStr
    last_donation: date | None = None


class DonorCreate(DonorBase):
    pass


class DonorRegistrationCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str
    password: str


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
    donor_code: str
    user_id: uuid.UUID | None = None
    blood_bank_id: uuid.UUID | None = None
    is_eligible: bool
    created_at: datetime
    created_by: uuid.UUID | None


class DonorDonationReceipt(BaseModel):
    id: uuid.UUID
    unit_id: uuid.UUID
    unit_code: str
    donor_code: str
    donor_name: str
    donor_email: EmailStr
    donor_phone_number: str
    blood_group: BloodGroup
    volume_ml: int
    collection_date: date
    component: str
    blood_bank_name: str | None = None
    blood_bank_location: str | None = None
    status: str
    hospital_name: str | None = None
    patient_name: str | None = None
    patient_id: str | None = None


class DonorDashboardOut(BaseModel):
    donor: DonorOut
    receipts: list[DonorDonationReceipt]
    total_donations: int
    allocated_units: int
    latest_donation_date: date | None = None
