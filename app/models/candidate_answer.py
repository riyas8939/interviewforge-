import datetime
from sqlalchemy import Column, String, Float, Text, DateTime, ForeignKey, JSON, Integer
from sqlalchemy.orm import relationship
from app.models.base import Base

class CandidateAnswer(Base):
    __tablename__ = "candidate_answers"
    
    id = Column(String, primary_key=True, index=True) # UUID
    question_id = Column(String, ForeignKey("questions.id"), nullable=False)
    answer_text = Column(Text, nullable=False)
    
    # Detailed feedback breakdown
    score = Column(Float, default=0.0)
    correctness = Column(Float, default=0.0)
    communication = Column(Float, default=0.0)
    technical_depth = Column(Float, default=0.0)
    confidence = Column(Float, default=0.0)
    problem_solving = Column(Float, default=0.0)
    best_practices = Column(Float, default=0.0)
    
    # New Coach Metrics
    professionalism_score = Column(Float, default=0.0)
    grammar_score = Column(Float, default=0.0)
    pacing_score = Column(Float, default=0.0)
    
    overall_feedback = Column(Text, nullable=True)
    
    strengths = Column(JSON, nullable=False, default=list)
    weaknesses = Column(JSON, nullable=False, default=list)
    missing_points = Column(JSON, nullable=False, default=list)
    priority_improvements = Column(JSON, nullable=False, default=list)
    tips = Column(JSON, nullable=False, default=list)
    
    answer_pacing_feedback = Column(Text, nullable=True)
    recommended_framework = Column(String, nullable=True)
    ideal_answer_structure = Column(JSON, nullable=False, default=dict)
    ideal_answer_example = Column(Text, nullable=True)
    
    estimated_time_seconds = Column(Integer, default=0)
    actual_word_count = Column(Integer, default=0)
    actual_estimated_time = Column(Integer, default=0)
    filler_word_count = Column(Integer, default=0)
    ideal_word_count = Column(JSON, nullable=False, default=dict)
    interviewer_impression = Column(JSON, nullable=False, default=dict)
    
    suggestions = Column(Text, nullable=True) # Legacy
    
    # Follow-ups
    follow_up_question = Column(Text, nullable=True)
    follow_up_answer = Column(Text, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    # Relationships
    question = relationship("Question", back_populates="candidate_answer")
