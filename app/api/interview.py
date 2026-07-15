from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Response, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from app.core.database import get_db
from app.database.models import Interview, Question, Answer, Resume, JobDescription
from app.schemas.interview import InterviewStart, InterviewOut, QuestionOut, AnswerFeedbackOut
from app.services import interview_service, resume_parser, jd_matcher
from app.api.auth import get_current_user
from app.models.user import User

router = APIRouter(tags=["Interviews"])

MAX_UPLOAD_SIZE = 10 * 1024 * 1024 # 10MB

@router.post("/interview/start", response_model=InterviewOut)
@router.post("/api/interview/start", response_model=InterviewOut)
def start_interview(
    setup: InterviewStart,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return interview_service.create_new_interview(db, current_user.id, setup)

@router.post("/interview/next-question", response_model=QuestionOut)
@router.post("/api/question/generate", response_model=QuestionOut)
def generate_question(
    interview_id: str = Form(...),
    order_num: int = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        return interview_service.generate_question_for_interview(db, interview_id, order_num)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/interview/submit-answer", response_model=AnswerFeedbackOut)
@router.post("/api/answer/evaluate", response_model=AnswerFeedbackOut)
def evaluate_answer(
    question_id: str = Form(...),
    answer_text: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        question = db.query(Question).filter(Question.id == question_id).first()
        if not question:
            raise HTTPException(status_code=404, detail="Question not found")
            
        eval_result = interview_service.evaluate_answer_and_update(db, question_id, answer_text)
        interview = db.query(Interview).filter(Interview.id == question.interview_id).first()
        
        next_q = None
        if question.order_num < interview.num_questions:
            next_q = interview_service.generate_question_for_interview(db, interview.id, question.order_num + 1)
        else:
            interview_service.finalize_interview_report(db, interview.id)
            
        return {
            "score": eval_result.score,
            "correctness": eval_result.correctness,
            "communication": eval_result.communication,
            "technical_depth": eval_result.technical_depth,
            "confidence": eval_result.confidence,
            "problem_solving": eval_result.problem_solving,
            "best_practices": eval_result.best_practices,
            "overall_score": eval_result.score,
            "overall_feedback": eval_result.overall_feedback,
            "professionalism_score": eval_result.professionalism_score,
            "grammar_score": eval_result.grammar_score,
            "pacing_score": eval_result.pacing_score,
            "strengths": eval_result.strengths,
            "weaknesses": eval_result.weaknesses,
            "missing_points": eval_result.missing_points,
            "priority_improvements": eval_result.priority_improvements,
            "tips": eval_result.tips,
            "answer_pacing_feedback": eval_result.answer_pacing_feedback,
            "recommended_framework": eval_result.recommended_framework,
            "ideal_answer_structure": eval_result.ideal_answer_structure,
            "ideal_answer_example": eval_result.ideal_answer_example,
            "estimated_time_seconds": eval_result.estimated_time_seconds,
            "actual_word_count": eval_result.actual_word_count,
            "actual_estimated_time": eval_result.actual_estimated_time,
            "filler_word_count": eval_result.filler_word_count,
            "ideal_word_count": eval_result.ideal_word_count,
            "interviewer_impression": eval_result.interviewer_impression,
            "suggestions": eval_result.suggestions,
            "follow_up_question": eval_result.follow_up_question,
            "next_question": next_q
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/interview/end")
@router.post("/api/interview/end")
def end_interview(
    interview_id: str = Form(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        report = interview_service.finalize_interview_report(db, interview_id)
        return {"status": "success", "message": "Interview finalized.", "overall_score": report.overall_score}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/history", response_model=List[InterviewOut])
@router.get("/api/interview/history", response_model=List[InterviewOut])
def get_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Interview).filter(Interview.user_id == current_user.id).order_by(Interview.created_at.desc()).all()

@router.get("/history/{id}", response_model=InterviewOut)
@router.get("/api/interview/{id}", response_model=InterviewOut)
def get_history_detail(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    session = db.query(Interview).filter(Interview.id == id, Interview.user_id == current_user.id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    return session

@router.post("/resume/upload")
@router.post("/api/resume/parse")
async def upload_resume(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Enforce file limits
    file_bytes = await file.read()
    if len(file_bytes) > MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds maximum limit of 10MB.")
        
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF resumes are supported.")
        
    try:
        extracted_text = resume_parser.extract_text_from_pdf(file_bytes)
        parsed_data = resume_parser.parse_resume_content(extracted_text)
        
        # Save structured resume details to db
        db_resume = Resume(
            user_id=current_user.id,
            filename=file.filename,
            raw_text=extracted_text,
            skills=json.dumps(parsed_data.get("skills", [])),
            experience=json.dumps(parsed_data.get("experience", [])),
            education=json.dumps(parsed_data.get("education", []))
        )
        db.add(db_resume)
        db.commit()
        
        return {
            "text": extracted_text,
            "skills": parsed_data.get("skills", []),
            "experience": parsed_data.get("experience", []),
            "education": parsed_data.get("education", [])
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process resume: {str(e)}")

@router.post("/job-description/upload")
@router.post("/api/jd/match")
def upload_job_description(
    resume_text: str = Form(...),
    jd_text: str = Form(...),
    current_user: User = Depends(get_current_user)
):
    try:
        return jd_matcher.match_resume_to_jd(resume_text, jd_text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
