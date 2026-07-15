import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Resume(Base):
    __tablename__ = "resumes"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=True)
    raw_text = Column(Text, nullable=True)
    skills = Column(Text, nullable=True) # JSON serialized list of skills
    experience = Column(Text, nullable=True) # JSON serialized list of experience blocks
    education = Column(Text, nullable=True) # JSON serialized list of education blocks
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="resumes")

class JobDescription(Base):
    __tablename__ = "job_descriptions"
    
    id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    raw_text = Column(Text, nullable=True)
    required_skills = Column(Text, nullable=True) # JSON serialized
    preferred_skills = Column(Text, nullable=True) # JSON serialized
    experience_level = Column(String, nullable=True)
    responsibilities = Column(Text, nullable=True) # JSON serialized
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    interview = relationship("Interview", back_populates="job_description")
