import io
import re
import json
import logging
from typing import Dict, Any
from pypdf import PdfReader
from app.llm.llm_provider import LLMProvider

logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
        return text
    except Exception as e:
        logger.error(f"Failed to extract PDF bytes: {e}")
        return f"Error extracting PDF: {str(e)}"

def parse_resume_content(resume_text: str) -> Dict[str, Any]:
    """
    Parses resume text using LLM, fallback to regex heuristics upon parser failure.
    """
    system_prompt = (
        "You are an expert ATS parser. Extract skills, projects, education, experience, and certifications. "
        "Return ONLY raw JSON matching this format:\n"
        "{\n"
        '  "skills": ["python", "react", "fastapi"],\n'
        '  "experience": ["Company Name - Role (Years)"],\n'
        '  "education": ["Degree Name, University"],\n'
        '  "projects": ["Project Details"],\n'
        '  "certifications": ["Cert details"]\n'
        "}"
    )
    user_prompt = f"Resume Content:\n{resume_text}"
    
    try:
        response = LLMProvider.generate_response(system_prompt, user_prompt)
        data = json.loads(response)
        if isinstance(data, dict):
            return {
                "skills": data.get("skills", []),
                "experience": data.get("experience", []),
                "education": data.get("education", []),
                "projects": data.get("projects", []),
                "certifications": data.get("certifications", [])
            }
    except Exception as e:
        logger.warning(f"RAG Resume parser failed: {e}. Running heuristics parsing.")
        
    # Heuristics parsing
    skills = []
    common_skills = ["python", "javascript", "react", "fastapi", "django", "node", "java", "spring", "c++", 
                     "docker", "kubernetes", "aws", "gcp", "azure", "sql", "postgresql", "sqlite", "mongodb",
                     "machine learning", "pytorch", "tensorflow", "ci/cd", "devops", "html", "css", "vue"]
    for s in common_skills:
        if re.search(r'\b' + re.escape(s) + r'\b', resume_text.lower()):
            skills.append(s.title())
            
    experience = []
    education = []
    for line in resume_text.split("\n"):
        line_clean = line.strip()
        if not line_clean:
            continue
        if any(kw in line_clean.lower() for kw in ["engineer", "developer", "analyst", "manager", "intern", "architect"]):
            experience.append(line_clean)
        elif any(kw in line_clean.lower() for kw in ["university", "college", "institute", "bs", "ms", "phd", "bachelor", "master"]):
            education.append(line_clean)
            
    return {
        "skills": skills[:15] if skills else ["Software Development"],
        "experience": experience[:5] if experience else ["Software Engineer"],
        "education": education[:3] if education else ["Degree Not Specified"],
        "projects": [],
        "certifications": []
    }
