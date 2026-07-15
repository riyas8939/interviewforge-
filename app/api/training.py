"""
Training Mode API Router
Provides hint, answer reveal, topic explanations, and progress tracking for training sessions.
"""
import json
import logging
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database.models import Interview, Question, Answer
from app.schemas.interview import TrainingHintOut, TrainingProgressOut
from app.api.auth import get_current_user
from app.llm.llm_provider import LLMProvider

router = APIRouter()
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helper: categorize agent type to a readable category label
# ---------------------------------------------------------------------------
AGENT_TO_CATEGORY = {
    "Technical Interviewer": "Technical",
    "Reasoning Evaluator":   "Reasoning",
    "Aptitude Evaluator":    "Aptitude",
    "Coding Interviewer":    "Coding",
    "Behavioral Interviewer":"Behavioral",
    "Communication Evaluator":"Communication",
    "Hiring Manager":        "Overall",
}

TOPIC_RESOURCES = {
    "Technical": [
        {"title": "Data Structures & Algorithms – GeeksForGeeks", "url": "https://www.geeksforgeeks.org/data-structures/"},
        {"title": "System Design Primer – GitHub", "url": "https://github.com/donnemartin/system-design-primer"},
    ],
    "Coding": [
        {"title": "LeetCode Top Interview Questions", "url": "https://leetcode.com/problem-list/top-interview-questions/"},
        {"title": "NeetCode 150 Roadmap", "url": "https://neetcode.io/roadmap"},
    ],
    "Reasoning": [
        {"title": "Logical Reasoning Practice – IndiaBIX", "url": "https://www.indiabix.com/logical-reasoning/questions-and-answers/"},
        {"title": "Puzzle Practice – BrainDen", "url": "https://brainden.com/logic-puzzles.htm"},
    ],
    "Aptitude": [
        {"title": "Quantitative Aptitude – IndiaBIX", "url": "https://www.indiabix.com/aptitude/questions-and-answers/"},
        {"title": "Aptitude Preparation – PrepInsta", "url": "https://prepinsta.com/aptitude/"},
    ],
    "Behavioral": [
        {"title": "STAR Method Guide – The Balance Careers", "url": "https://www.thebalancemoney.com/what-is-the-star-interview-response-technique-2061629"},
        {"title": "Behavioral Interview Questions – Indeed", "url": "https://www.indeed.com/career-advice/interviewing/behavioral-interview-questions"},
    ],
    "Communication": [
        {"title": "Technical Communication Tips – Coursera", "url": "https://www.coursera.org/courses?query=technical%20communication"},
        {"title": "Structuring Answers – Toastmasters", "url": "https://www.toastmasters.org/"},
    ],
}

# ---------------------------------------------------------------------------
# GET /training/{interview_id}/hint/{question_id}?level=1|2|3
# ---------------------------------------------------------------------------
@router.get("/training/{interview_id}/hint/{question_id}", response_model=TrainingHintOut)
def get_hint(
    interview_id: str,
    question_id: str,
    level: int = 1,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview or not interview.is_training_mode:
        raise HTTPException(status_code=403, detail="Training mode not enabled for this session.")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    category = AGENT_TO_CATEGORY.get(question.interviewer_agent, "Technical")
    resources = TOPIC_RESOURCES.get(category, [])

    # Check cached hints first!
    try:
        ans_data = json.loads(question.correct_answer)
        if isinstance(ans_data, dict) and "vague_hint" in ans_data:
            vague = ans_data.get("vague_hint", "")
            approach = ans_data.get("approach_hint", "")
            correct = ans_data.get("correct_answer", "")
            explanation = ans_data.get("detailed_explanation", "")
            
            if level == 1:
                return TrainingHintOut(
                    hint_level=1,
                    hint_text=vague or "Think about the core concepts of this problem.",
                    correct_answer=None,
                    explanation=None,
                    resources=[{"title": r["title"], "url": r["url"]} for r in resources],
                )
            elif level == 2:
                return TrainingHintOut(
                    hint_level=2,
                    hint_text=approach or "Consider the standard methodology or algorithmic structure.",
                    correct_answer=None,
                    explanation=explanation or None,
                    resources=[{"title": r["title"], "url": r["url"]} for r in resources],
                )
            else:
                return TrainingHintOut(
                    hint_level=3,
                    hint_text="Full answer revealed.",
                    correct_answer=correct or None,
                    explanation=explanation or None,
                    resources=[{"title": r["title"], "url": r["url"]} for r in resources],
                )
    except Exception:
        pass

    system_prompt = (
        "You are an expert interview coach in training mode. "
        "Your goal is to guide the student without giving everything away immediately. "
        "Provide graduated hints based on the hint_level requested. "
        "Return ONLY valid JSON with keys: hint_text, explanation, correct_answer."
    )

    if level == 1:
        user_prompt = (
            f"Question: {question.question_text}\n"
            f"Provide a VAGUE hint (hint_level 1) — just point toward the concept, do NOT reveal the answer. "
            "Return JSON: {\"hint_text\": \"...\", \"explanation\": \"\", \"correct_answer\": \"\"}"
        )
    elif level == 2:
        user_prompt = (
            f"Question: {question.question_text}\n"
            f"Provide a MEDIUM hint (hint_level 2) — reveal the approach or method, not the full answer. "
            "Return JSON: {\"hint_text\": \"...\", \"explanation\": \"brief explanation\", \"correct_answer\": \"\"}"
        )
    else:
        user_prompt = (
            f"Question: {question.question_text}\n"
            f"Reveal the FULL correct answer with a clear explanation (hint_level 3). "
            "Return JSON: {\"hint_text\": \"Full answer revealed.\", \"explanation\": \"detailed explanation\", \"correct_answer\": \"full answer text\"}"
        )

    try:
        raw = LLMProvider.generate_response(system_prompt, user_prompt)
        data = json.loads(raw)
    except Exception:
        # Demo fallback
        if level == 1:
            data = {
                "hint_text": f"Think about what '{question.question_text.split()[0]}' fundamentally involves.",
                "explanation": "",
                "correct_answer": "",
            }
        elif level == 2:
            data = {
                "hint_text": "Consider the core algorithmic approach or system pattern that applies here.",
                "explanation": "Break the problem into smaller parts and identify the data structures involved.",
                "correct_answer": "",
            }
        else:
            data = {
                "hint_text": "Full answer revealed.",
                "explanation": "Refer to the correct_answer field for the detailed solution.",
                "correct_answer": question.correct_answer or "No stored answer — review the topic resources below.",
            }

    return TrainingHintOut(
        hint_level=level,
        hint_text=data.get("hint_text", ""),
        correct_answer=data.get("correct_answer") or None,
        explanation=data.get("explanation") or None,
        resources=[{"title": r["title"], "url": r["url"]} for r in resources],
    )


# ---------------------------------------------------------------------------
# GET /training/{interview_id}/progress
# ---------------------------------------------------------------------------
@router.get("/training/{interview_id}/progress", response_model=TrainingProgressOut)
def get_progress(
    interview_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found.")

    questions = db.query(Question).filter(Question.interview_id == interview_id).all()
    question_ids = [q.id for q in questions]
    answers = db.query(Answer).filter(Answer.question_id.in_(question_ids)).all() if question_ids else []

    answered_ids = {a.question_id for a in answers}
    answered     = len(answered_ids)
    total        = interview.num_questions

    # Build per-category score map
    score_map: dict[str, list[float]] = {}
    for ans in answers:
        q = next((q for q in questions if q.id == ans.question_id), None)
        if not q:
            continue
        cat = AGENT_TO_CATEGORY.get(q.interviewer_agent, "Technical")
        score_map.setdefault(cat, []).append(ans.score or 0.0)

    score_by_category = {cat: round(sum(v) / len(v), 1) for cat, v in score_map.items()}

    threshold = 70.0
    weak_areas   = [c for c, s in score_by_category.items() if s < threshold]
    strong_areas = [c for c, s in score_by_category.items() if s >= threshold]

    # Recommend topics for weak areas
    recommended: list[str] = []
    for area in weak_areas:
        for r in TOPIC_RESOURCES.get(area, []):
            recommended.append(r["title"])

    correct = sum(1 for ans in answers if (ans.score or 0) >= threshold)
    completion_pct = round((answered / total) * 100, 1) if total else 0.0

    return TrainingProgressOut(
        total_questions=total,
        answered=answered,
        correct=correct,
        score_by_category=score_by_category,
        weak_areas=weak_areas,
        strong_areas=strong_areas,
        recommended_topics=recommended,
        completion_pct=completion_pct,
    )


# ---------------------------------------------------------------------------
# GET /training/{interview_id}/explanation/{question_id}
# Full concept explanation for a topic — educational deep dive
# ---------------------------------------------------------------------------
@router.get("/training/{interview_id}/explanation/{question_id}")
def get_explanation(
    interview_id: str,
    question_id: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    interview = db.query(Interview).filter(
        Interview.id == interview_id,
        Interview.user_id == current_user.id
    ).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Session not found.")

    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found.")

    category = AGENT_TO_CATEGORY.get(question.interviewer_agent, "Technical")
    resources = TOPIC_RESOURCES.get(category, [])

    # Check cached explanation first!
    try:
        ans_data = json.loads(question.correct_answer)
        if isinstance(ans_data, dict) and "detailed_explanation" in ans_data and ans_data["detailed_explanation"]:
            return {
                "topic": f"{category} Concept Deep-dive",
                "concept_overview": ans_data["detailed_explanation"],
                "key_points": [
                    "Understand the core engineering trade-offs.",
                    "Identify key bottlenecks or resource constraints."
                ],
                "example": "Refer to the model answer in the Reveal Answer panel.",
                "common_mistakes": [
                    "Not verifying edge cases.",
                    "Ignoring performance implications."
                ],
                "interview_tip": "Communicate your thought process clearly before coding.",
                "resources": resources
            }
    except Exception:
        pass

    system_prompt = (
        "You are an expert technical educator. "
        "Given an interview question, produce a rich, structured educational explanation. "
        "Return ONLY valid JSON with keys: topic, concept_overview, key_points (list of strings), "
        "example, common_mistakes (list of strings), interview_tip."
    )
    user_prompt = (
        f"Role: {interview.role}\n"
        f"Question: {question.question_text}\n"
        f"Category: {category}\n"
        "Produce the educational breakdown."
    )

    try:
        raw = LLMProvider.generate_response(system_prompt, user_prompt, max_tokens=1000)
        data = json.loads(raw)
    except Exception:
        data = {
            "topic": f"{category} Concepts",
            "concept_overview": (
                f"This question tests your understanding of {category.lower()} fundamentals "
                f"relevant to the {interview.role} role."
            ),
            "key_points": [
                "Understand the core concept before diving into implementation.",
                "Think aloud during the interview to show your reasoning.",
                "Always consider edge cases and trade-offs.",
            ],
            "example": "Review reference implementations and compare multiple approaches.",
            "common_mistakes": [
                "Jumping to code without clarifying requirements.",
                "Ignoring time/space complexity analysis.",
                "Forgetting to handle edge cases.",
            ],
            "interview_tip": (
                "Structure your answer: define the problem → state your approach → "
                "walk through complexity → code → test with examples."
            ),
        }

    resources = TOPIC_RESOURCES.get(category, [])
    data["resources"] = resources
    return data
