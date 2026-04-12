import uuid

from sqlalchemy import Boolean, Column, Date, DateTime, Enum, Float, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base
from models import BloodComponent, BloodGroup, BloodUnitStatus


class BloodUnit(Base):
    __tablename__ = "blood_units"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    unit_code = Column(String(20), unique=True, nullable=False)
    blood_group = Column(Enum(BloodGroup, name="blood_group"), nullable=False)
    component = Column(Enum(BloodComponent, name="blood_component"), nullable=False)
    volume_ml = Column(Integer, nullable=False)
    donor_id = Column(UUID(as_uuid=True), ForeignKey("donors.id"), nullable=True)
    collection_date = Column(Date, nullable=False)
    expiry_date = Column(Date, nullable=False)
    status = Column(Enum(BloodUnitStatus, name="blood_unit_status"), nullable=False, default=BloodUnitStatus.available)
    storage_unit_id = Column(String(20), nullable=False)
    cold_chain_ok = Column(Boolean, default=True, nullable=False)
    cold_chain_score = Column(Float, default=1.0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    donor = relationship("Donor", back_populates="blood_units")
    allocations = relationship("BloodRequestAllocation", back_populates="blood_unit")
