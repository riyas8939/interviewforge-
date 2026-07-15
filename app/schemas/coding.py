from pydantic import BaseModel
from typing import Optional, Dict, Any

class CodeSubmit(BaseModel):
    code: str
    language: str # Python, JavaScript, Java, C++

class CodeExecutionResult(BaseModel):
    output: Optional[str] = None
    execution_time: float
    memory_used: float
    compilation_error: Optional[str] = None
    test_cases_passed: int
    test_cases_total: int
    code_review_feedback: Optional[Dict[str, Any]] = None
    next_question: Optional[Any] = None
