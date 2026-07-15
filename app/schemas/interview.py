from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict, Any
import datetime
import json

class InterviewStart(BaseModel):
    role: str
    company_style: str = "Startup"
    experience: str
    difficulty: str = "Medium"
    programming_language: str
    num_questions: int = 5
    is_training_mode: bool = False
    resume_text: Optional[str] = None
    jd_text: Optional[str] = None

class InterviewOut(BaseModel):
    id: str
    role: str
    company_style: str
    experience: str
    difficulty: str
    programming_language: str
    num_questions: int
    is_training_mode: bool = False
    status: str
    overall_score: Optional[float] = None
    technical_score: Optional[float] = None
    coding_score: Optional[float] = None
    communication_score: Optional[float] = None
    behavioral_score: Optional[float] = None
    hiring_decision: Optional[str] = None
    hiring_reasoning: Optional[str] = None
    summary: Optional[str] = None
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class QuestionOut(BaseModel):
    id: str
    interview_id: str
    interviewer_agent: str
    question_text: str
    question_type: str
    difficulty: str
    options: Optional[List[str]] = None
    order_num: int

    class Config:
        from_attributes = True

    @field_validator('options', mode='before')
    @classmethod
    def decode_options(cls, v: Any) -> Optional[List[str]]:
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return []
        return v

class AnswerSubmit(BaseModel):
    answer_text: str

class AnswerFeedbackOut(BaseModel):
    score: float
    correctness: float
    communication: float
    technical_depth: float
    confidence: float
    problem_solving: float
    best_practices: float
    
    overall_score: float
    overall_feedback: Optional[str] = None
    professionalism_score: float
    grammar_score: float
    pacing_score: float
    
    strengths: List[str]
    weaknesses: List[str]
    missing_points: List[str]
    priority_improvements: List[str]
    tips: List[str]
    
    answer_pacing_feedback: Optional[str] = None
    recommended_framework: Optional[str] = None
    ideal_answer_structure: Dict[str, str]
    ideal_answer_example: Optional[str] = None
    
    estimated_time_seconds: int
    actual_word_count: int
    actual_estimated_time: int
    filler_word_count: int
    ideal_word_count: Dict[str, int]
    interviewer_impression: Dict[str, str]
    
    suggestions: Optional[str] = None
    follow_up_question: Optional[str] = None
    next_question: Optional[QuestionOut] = None

class ResumeParseResponse(BaseModel):
    text: str
    skills: List[str]
    experience: List[str]
    education: List[str]

class JdMatchResponse(BaseModel):
    ats_match_percentage: float
    missing_technologies: List[str]
    priority_learning_areas: List[str]
    suggested_questions: List[str]

class TrainingHintOut(BaseModel):
    hint_level: int  # 1=vague, 2=medium, 3=full answer
    hint_text: str
    correct_answer: Optional[str] = None
    explanation: Optional[str] = None
    resources: Optional[List[Dict[str, str]]] = None

class TrainingProgressOut(BaseModel):
    total_questions: int
    answered: int
    correct: int
    score_by_category: Dict[str, float]
    weak_areas: List[str]
    strong_areas: List[str]
    recommended_topics: List[str]
    completion_pct: float
