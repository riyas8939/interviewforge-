from fastapi import APIRouter, Depends, HTTPException, Form
from sqlalchemy.orm import Session
import json
import uuid
from app.core.database import get_db
from app.database.models import Question, CodingSubmission, Answer, Interview
from app.schemas.coding import CodeSubmit, CodeExecutionResult
from app.services.coding_executor import CodingExecutor
from app.services import interview_service
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Coding Round"])

@router.post("/coding/run", response_model=CodeExecutionResult)
@router.post("/api/coding/run", response_model=CodeExecutionResult)
def run_coding_challenge(
    code: str = Form(...),
    language: str = Form(...),
    question_id: str = Form(None),
    custom_input: str = Form(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Run code sandbox execution
        execution_results = CodingExecutor.run_code(code, language, custom_input=custom_input)
        
        # Run AI code review feedback
        ai_feedback = CodingExecutor.get_ai_code_review(code, language, execution_results)
        
        next_q = None
        # If question_id is provided, save it as the answer/submission
        if question_id:
            question = db.query(Question).filter(Question.id == question_id).first()
            if not question:
                raise HTTPException(status_code=404, detail="Question not found")
                
            # Remove any previous coding submission for this question
            prev_sub = db.query(CodingSubmission).filter(CodingSubmission.question_id == question_id).first()
            if prev_sub:
                db.delete(prev_sub)
                db.commit()
                
            db_submission = CodingSubmission(
                id=str(uuid.uuid4()),
                question_id=question_id,
                code=code,
                execution_output=execution_results.get("output"),
                execution_time=execution_results.get("execution_time"),
                memory_used=execution_results.get("memory_used"),
                compilation_error=execution_results.get("compilation_error"),
                test_cases_passed=execution_results.get("test_cases_passed"),
                test_cases_total=execution_results.get("test_cases_total"),
                code_review_feedback=json.dumps(ai_feedback)
            )
            db.add(db_submission)
            db.commit()
            
            # Since coding doesn't have a standard text Answer, we can simulate an Answer model
            # update to proceed in the interview state.
            # Calculate a representative score based on static analysis and tests passed.
            avg_score = (
                ai_feedback.get("correctness_rating", 75.0) +
                ai_feedback.get("complexity_rating", 75.0) +
                ai_feedback.get("readability_rating", 75.0)
            ) / 3.0
            
            # Remove any existing text Answer for this question
            prev_ans = db.query(Answer).filter(Answer.question_id == question_id).first()
            if prev_ans:
                db.delete(prev_ans)
                db.commit()
                
            db_answer = Answer(
                id=str(uuid.uuid4()),
                question_id=question_id,
                answer_text="[MONACO CODE SUBMISSION]",
                score=avg_score,
                correctness=ai_feedback.get("correctness_rating", 75.0),
                communication=ai_feedback.get("readability_rating", 75.0),
                technical_depth=ai_feedback.get("complexity_rating", 75.0),
                confidence=ai_feedback.get("naming_rating", 75.0),
                problem_solving=ai_feedback.get("optimization_rating", 75.0),
                best_practices=ai_feedback.get("best_practices_rating", 75.0),
                strengths="Correct complexity and clean structure.",
                weaknesses="Review edge-case inputs.",
                suggestions=ai_feedback.get("detailed_feedback", "Practice coding syntax."),
                follow_up_question=""
            )
            db.add(db_answer)
            db.commit()
            
            # Check if it's the last question to auto-finalize
            interview = db.query(Interview).filter(Interview.id == question.interview_id).first()
            if question.order_num < interview.num_questions:
                next_q = interview_service.generate_question_for_interview(db, interview.id, question.order_num + 1)
            else:
                interview_service.finalize_interview_report(db, interview.id)
        
        return {
            "output": execution_results.get("output"),
            "execution_time": execution_results.get("execution_time"),
            "memory_used": execution_results.get("memory_used"),
            "compilation_error": execution_results.get("compilation_error"),
            "test_cases_passed": execution_results.get("test_cases_passed"),
            "test_cases_total": execution_results.get("test_cases_total"),
            "code_review_feedback": ai_feedback,
            "next_question": next_q
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
