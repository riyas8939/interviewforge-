import datetime
from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base

class Interview(Base):
    __tablename__ = "interviews"
    
    id = Column(String, primary_key=True, index=True) # UUID
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    role = Column(String, nullable=False)
    company_style = Column(String, nullable=False, default="Startup")
    experience = Column(String, nullable=False)
    difficulty = Column(String, nullable=False, default="Medium")
    programming_language = Column(String, nullable=False)
    num_questions = Column(Integer, default=5)
    is_training_mode = Column(Boolean, default=False)
    status = Column(String, default="STARTED") # STARTED, COMPLETED
    
    # Aggregated Scores
    overall_score = Column(Float, nullable=True)
    technical_score = Column(Float, nullable=True)
    coding_score = Column(Float, nullable=True)
    communication_score = Column(Float, nullable=True)
    behavioral_score = Column(Float, nullable=True)
    
    # Recommendations
    hiring_decision = Column(String, nullable=True)
    hiring_reasoning = Column(Text, nullable=True)
    summary = Column(Text, nullable=True)
    strengths = Column(Text, nullable=True)
    weaknesses = Column(Text, nullable=True)
    learning_roadmap = Column(Text, nullable=True) # JSON structure
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="interviews")
    questions = relationship("Question", back_populates="interview", cascade="all, delete-orphan")
    job_description = relationship("JobDescription", uselist=False, back_populates="interview", cascade="all, delete-orphan")
    report = relationship("InterviewReport", uselist=False, back_populates="interview", cascade="all, delete-orphan")
