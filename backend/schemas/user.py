import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr

from models import UserRole


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str
    role: UserRole
    phone_number: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    role: UserRole
    blood_bank_id: uuid.UUID | None = None
    phone_number: str | None = None
    donor_profile_id: uuid.UUID | None = None
    donor_code: str | None = None
    is_active: bool
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
