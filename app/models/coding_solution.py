from sqlalchemy import Column, Integer, Float, Text, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class CodingSolution(Base):
    __tablename__ = "coding_solutions"
    
    id = Column(String, primary_key=True, index=True)
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    code = Column(Text, nullable=False)
    execution_output = Column(Text, nullable=True)
    execution_time = Column(Float, default=0.0)
    memory_used = Column(Float, default=0.0)
    compilation_error = Column(Text, nullable=True)
    test_cases_passed = Column(Integer, default=0)
    test_cases_total = Column(Integer, default=0)
    code_review_feedback = Column(Text, nullable=True) # JSON or markdown string
    
    # Relationships
    question = relationship("Question", back_populates="coding_solution")
