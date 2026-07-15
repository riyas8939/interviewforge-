import json
import logging
from typing import Dict, Any
from app.llm.llm_provider import LLMProvider

logger = logging.getLogger(__name__)

def match_resume_to_jd(resume_text: str, jd_text: str) -> Dict[str, Any]:
    """
    Evaluates ATS score and extracts priority learning areas.
    """
    system_prompt = (
        "You are an expert recruitment ATS and skill analyzer.\n"
        "Compare the candidate's resume against the Job Description and analyze fit.\n"
        "Return ONLY raw JSON matching this format:\n"
        "{\n"
        '  "ats_match_percentage": 0.0 to 100.0,\n'
        '  "missing_technologies": ["tech1", "tech2"],\n'
        '  "priority_learning_areas": ["area1", "area2"],\n'
        '  "suggested_questions": ["question1", "question2"]\n'
        "}"
    )
    user_prompt = f"Resume:\n{resume_text}\n\nJob Description:\n{jd_text}"
    
    try:
        response = LLMProvider.generate_response(system_prompt, user_prompt)
        data = json.loads(response)
        if "ats_match_percentage" in data:
            return data
    except Exception as e:
        logger.warning(f"RAG JD matcher failed: {e}")
        
    # Fallback/Demo Response
    return {
        "ats_match_percentage": 70.0,
        "missing_technologies": ["Docker", "Kubernetes", "CI/CD"],
        "priority_learning_areas": ["Container deployment workflows", "Continuous integration pipelines"],
        "suggested_questions": [
            "Explain how you would configure a Docker container to host a FastAPI app.",
            "Describe the difference between continuous delivery and continuous deployment."
        ]
    }

def parse_jd_content(jd_text: str) -> Dict[str, Any]:
    """
    Extracts structured fields from job descriptions.
    """
    system_prompt = (
        "Extract required skills, preferred skills, experience level, and responsibilities.\n"
        "Return ONLY raw JSON:\n"
        "{\n"
        '  "required_skills": ["python", "aws"],\n'
        '  "preferred_skills": ["kubernetes"],\n'
        '  "experience_level": "Mid",\n'
        '  "responsibilities": ["design scalable backends"]\n'
        "}"
    )
    user_prompt = f"Job Description:\n{jd_text}"
    
    try:
        response = LLMProvider.generate_response(system_prompt, user_prompt)
        return json.loads(response)
    except Exception as e:
        logger.warning(f"Failed to parse JD content: {e}")
        return {
            "required_skills": [],
            "preferred_skills": [],
            "experience_level": "Mid",
            "responsibilities": []
        }
