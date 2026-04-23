import uuid

from sqlalchemy import Boolean, Column, DateTime, Enum, Float, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base
from models import ViolationSeverity


class ColdChainViolation(Base):
    __tablename__ = "cold_chain_violations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    storage_unit_id = Column(String(20), nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    safe_min = Column(Float, default=1.0, nullable=False)
    safe_max = Column(Float, default=8.0, nullable=False)
    duration_minutes = Column(Integer, default=0, nullable=False)
    severity = Column(Enum(ViolationSeverity, name="violation_severity"), nullable=False)
    alert_sent = Column(Boolean, default=False, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
