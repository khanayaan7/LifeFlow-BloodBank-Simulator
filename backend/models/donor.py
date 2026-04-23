import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base
from models import BloodGroup


class Donor(Base):
    __tablename__ = "donors"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    donor_code = Column(String(30), unique=True, nullable=False, index=True)
    full_name = Column(String(100), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True, unique=True)
    blood_bank_id = Column(UUID(as_uuid=True), ForeignKey("blood_banks.id"), nullable=True)
    blood_group = Column(Enum(BloodGroup, name="blood_group"), nullable=True)
    age = Column(Integer, nullable=True)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(255), nullable=False)
    last_donation = Column(Date, nullable=True)
    is_eligible = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    created_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    blood_bank = relationship("BloodBank", back_populates="donors")
    creator = relationship("User", back_populates="created_donors", foreign_keys=[created_by])
    user = relationship("User", back_populates="donor_profile", foreign_keys=[user_id])
    blood_units = relationship("BloodUnit", back_populates="donor")
