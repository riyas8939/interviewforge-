import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class InterviewReport(Base):
    __tablename__ = "interview_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    overall_feedback = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    roadmap = Column(Text, nullable=True) # JSON serialized roadmap steps
    pdf_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="report")
