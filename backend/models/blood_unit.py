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
    blood_bank_id = Column(UUID(as_uuid=True), ForeignKey("blood_banks.id"), nullable=True)
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
    blood_bank = relationship("BloodBank", back_populates="blood_units")
    allocations = relationship("BloodRequestAllocation", back_populates="blood_unit")

    @property
    def donor_code(self) -> str | None:
        return self.donor.donor_code if self.donor else None

    @property
    def donor_name(self) -> str | None:
        return self.donor.full_name if self.donor else None

    @property
    def blood_bank_name(self) -> str | None:
        return self.blood_bank.name if self.blood_bank else None

    @property
    def hospital_name(self) -> str | None:
        latest = self.latest_allocation
        if latest and latest.request and latest.request.hospital:
            return latest.request.hospital.name
        return None

    @property
    def patient_name(self) -> str | None:
        latest = self.latest_allocation
        return latest.request.patient_name if latest and latest.request else None

    @property
    def patient_id(self) -> str | None:
        latest = self.latest_allocation
        return latest.request.patient_id if latest and latest.request else None

    @property
    def allocated_at(self):
        latest = self.latest_allocation
        return latest.allocated_at if latest else None

    @property
    def latest_allocation(self):
        if not self.allocations:
            return None
        return max(self.allocations, key=lambda allocation: allocation.allocated_at)
