import datetime
from sqlalchemy import Column, Integer, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Analytics(Base):
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_sessions = Column(Integer, default=0)
    average_overall_score = Column(Float, default=0.0)
    weak_topics = Column(Text, nullable=True) # JSON serialized list of weak topics
    progress_history = Column(Text, nullable=True) # JSON serialized history
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="analytics")
