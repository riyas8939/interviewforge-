from typing import Dict, Any
from app.agents.base import BaseAgent

class TechnicalInterviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Technical Interviewer",
            description="Assesses core engineering theories, data structures, system design, and framework knowledge."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are a Senior Principal Engineer acting as a Technical Interviewer agent. Your goals:\n"
            "- Ask a challenging theoretical or system architectural question.\n"
            "- Focus on time/space tradeoffs, data layouts, API boundaries, or concurrency issues.\n"
            f"- Align context with role '{session_meta.get('role')}' and difficulty '{session_meta.get('difficulty')}'.\n"
        )

class CodingInterviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Coding Interviewer",
            description="Evaluates algorithmic code implementation, logic patterns, and programming syntax."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are a Coding Interviewer agent. Your goals:\n"
            f"- Ask an algorithmic programming challenge to solve in language '{session_meta.get('language', 'Python')}'.\n"
            "- Ask the candidate to write a function or optimize an existing function.\n"
            "- Enforce clean code and correct syntax requirements.\n"
        )

class BehavioralInterviewerAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Behavioral Interviewer",
            description="Focuses on teamwork, conflicts, leadership, adaptability, and situational engineering problems."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are a Behavioral Interviewer agent. Your goals:\n"
            "- Focus on situational culture-fit questions utilizing the STAR (Situation, Task, Action, Result) methodology.\n"
            "- Check conflict resolution skills, collaboration history, and engineering ownership parameters.\n"
        )

class ReasoningEvaluatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Reasoning Evaluator",
            description="Evaluates the candidate's logical deduction, pattern recognition, and critical thinking puzzles."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are a Reasoning Evaluator agent. Your goals:\n"
            "- Present a logical puzzle or pattern reasoning problem.\n"
            "- Evaluate structural problem solving approach, deduction steps, and analytical clarity.\n"
        )

class AptitudeEvaluatorAgent(BaseAgent):
    def __init__(self):
        super().__init__(
            name="Aptitude Evaluator",
            description="Assesses mathematical, numerical, statistical, and probability-based aptitude problems."
        )

    def generate_prompt_context(self, session_meta: Dict[str, Any], context: str = "") -> str:
        return (
            "You are an Aptitude Evaluator agent. Your goals:\n"
            "- Present a math or probability calculation challenge.\n"
            "- Focus on quantitative aptitude, data calculation correctness, and speed estimates.\n"
        )
