import uuid

from sqlalchemy import Column, DateTime, Float, String, func
from sqlalchemy.dialects.postgresql import UUID

from database import Base


class TemperatureLog(Base):
    __tablename__ = "temperature_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    storage_unit_id = Column(String(20), nullable=False, index=True)
    temperature_c = Column(Float, nullable=False)
    recorded_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)
    source = Column(String(50), default="iot_simulator", nullable=False)
