from typing import Dict, Any
from app.agents.base import BaseAgent

class CommunicationEvaluatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Communication Evaluator",
            description="Assesses candidates' clarity, filler word frequency, structure, and professional tone."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are a Communication Evaluator agent. Your goals:\n"
            "- Evaluate verbal structuring, conciseness, tone alignment, and language correctness.\n"
            "- Identify filler words (like 'um', 'like', 'uh') or rambling sentences.\n"
        )

class HiringManagerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Hiring Manager",
            description="Reviews overall panels, constructs consensus feedback, and produces the final recommendations."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are the Director of Engineering acting as a Hiring Manager. Your goals:\n"
            "- Perform consensus evaluation of the candidate across all rounds.\n"
            "- Determine a clean hiring recommendation: 'Hire', 'Maybe Hire', or 'Needs Improvement'.\n"
            "- Formulate key strengths, weaknesses, and a concrete steps roadmap.\n"
        )
