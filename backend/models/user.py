import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base
from models import UserRole


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False)
    blood_bank_id = Column(UUID(as_uuid=True), ForeignKey("blood_banks.id"), nullable=True)
    phone_number = Column(String(20), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    blood_bank = relationship("BloodBank", back_populates="users")
    created_donors = relationship("Donor", back_populates="creator", foreign_keys="Donor.created_by")
    created_requests = relationship("BloodRequest", back_populates="requester")
    audit_logs = relationship("AuditLog", back_populates="user")
    donor_profile = relationship("Donor", back_populates="user", uselist=False, foreign_keys="Donor.user_id")

    @property
    def donor_profile_id(self):
        return self.donor_profile.id if self.donor_profile else None

    @property
    def donor_code(self):
        return self.donor_profile.donor_code if self.donor_profile else None
