from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, JSON
from datetime import datetime, timezone
from app.database import Base

class AnalysisHistory(Base):
    __tablename__ = "analysis_history"

    id = Column(Integer, primary_key=True, index=True)
    schedule_text = Column(Text, nullable=False)
    transaction_count = Column(Integer, nullable=False)
    operation_count = Column(Integer, nullable=False)
    conflict_serializable = Column(Boolean, nullable=False)
    view_serializable = Column(Boolean, nullable=False)
    has_cycle = Column(Boolean, nullable=False)
    state_code = Column(String(50), nullable=False)
    headline = Column(String(200), nullable=False)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    full_json = Column(JSON, nullable=False)

