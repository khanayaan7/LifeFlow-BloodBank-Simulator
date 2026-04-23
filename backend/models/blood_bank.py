import uuid

from sqlalchemy import Column, DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base


class BloodBank(Base):
    __tablename__ = "blood_banks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(120), unique=True, nullable=False)
    location = Column(String(255), nullable=False)
    code = Column(String(40), unique=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    users = relationship("User", back_populates="blood_bank")
    donors = relationship("Donor", back_populates="blood_bank")
    blood_units = relationship("BloodUnit", back_populates="blood_bank")
    blood_requests = relationship("BloodRequest", back_populates="blood_bank")
