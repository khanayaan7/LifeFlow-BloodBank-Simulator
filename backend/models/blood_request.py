import uuid

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Float, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from database import Base
from models import BloodComponent, BloodGroup, RequestStatus, RequestUrgency


class BloodRequest(Base):
    __tablename__ = "blood_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    hospital_id = Column(UUID(as_uuid=True), ForeignKey("hospitals.id"), nullable=False)
    blood_bank_id = Column(UUID(as_uuid=True), ForeignKey("blood_banks.id"), nullable=True)
    requested_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    blood_group = Column(Enum(BloodGroup, name="blood_group"), nullable=False)
    component = Column(Enum(BloodComponent, name="blood_component"), nullable=False)
    units_needed = Column(Integer, nullable=False)
    patient_name = Column(String(120), nullable=False)
    patient_id = Column(String(60), nullable=False)
    urgency = Column(Enum(RequestUrgency, name="request_urgency"), nullable=False, default=RequestUrgency.routine)
    status = Column(Enum(RequestStatus, name="request_status"), nullable=False, default=RequestStatus.pending)
    requested_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    fulfilled_at = Column(DateTime(timezone=True), nullable=True)
    notes = Column(Text, nullable=True)

    hospital = relationship("Hospital", back_populates="requests")
    blood_bank = relationship("BloodBank", back_populates="blood_requests")
    requester = relationship("User", back_populates="created_requests")
    allocations = relationship("BloodRequestAllocation", back_populates="request")

    @property
    def requesting_hospital_name(self) -> str | None:
        return self.hospital.name if self.hospital else None

    @property
    def target_blood_bank_name(self) -> str | None:
        return self.blood_bank.name if self.blood_bank else None


class BloodRequestAllocation(Base):
    __tablename__ = "blood_request_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("blood_requests.id"), nullable=False)
    blood_unit_id = Column(UUID(as_uuid=True), ForeignKey("blood_units.id"), nullable=False)
    allocated_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    allocation_score = Column(Float, nullable=False)

    request = relationship("BloodRequest", back_populates="allocations")
    blood_unit = relationship("BloodUnit", back_populates="allocations")
