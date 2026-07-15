from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class Question(Base):
    __tablename__ = "questions"
    
    id = Column(String, primary_key=True, index=True) # UUID
    interview_id = Column(String, ForeignKey("interviews.id"), nullable=False)
    interviewer_agent = Column(String, nullable=False) # e.g., Technical Interviewer, Reasoning Evaluator
    question_text = Column(Text, nullable=False)
    question_type = Column(String, nullable=False) # e.g., Multiple Choice, Short Answer, Coding
    difficulty = Column(String, nullable=False) # Easy, Medium, Hard
    options = Column(Text, nullable=True) # JSON array serialized to string
    correct_answer = Column(Text, nullable=True)
    order_num = Column(Integer, nullable=False)
    
    # Relationships
    interview = relationship("Interview", back_populates="questions")
    candidate_answer = relationship("CandidateAnswer", uselist=False, back_populates="question", cascade="all, delete-orphan")
    coding_solution = relationship("CodingSolution", uselist=False, back_populates="question", cascade="all, delete-orphan")
