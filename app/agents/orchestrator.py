import json
import logging
from typing import Dict, Any
from app.agents.interviewer import (
    TechnicalInterviewerAgent,
    CodingInterviewerAgent,
    BehavioralInterviewerAgent,
    ReasoningEvaluatorAgent,
    AptitudeEvaluatorAgent
)
from app.agents.evaluator import CommunicationEvaluatorAgent, HiringManagerAgent
from app.llm.llm_provider import LLMProvider
from app.llm.prompts import InterviewPrompts

logger = logging.getLogger(__name__)

class InterviewOrchestrator:
    @staticmethod
    def get_agent_for_order(order_num: int, total_questions: int) -> Any:
        """
        Dynamically selects the active agent based on the round order.
        """
        agents = [
            TechnicalInterviewerAgent(),
            ReasoningEvaluatorAgent(),
            AptitudeEvaluatorAgent(),
            CodingInterviewerAgent()
        ]
        # Map based on index
        idx = (order_num - 1) % len(agents)
        return agents[idx]

    @staticmethod
    def get_evaluator_agents() -> Dict[str, Any]:
        """
        Returns helper evaluator agents.
        """
        return {
            "communication": CommunicationEvaluatorAgent(),
            "hiring_manager": HiringManagerAgent()
        }

    @classmethod
    def generate_question(
        cls,
        role: str,
        company_style: str,
        experience: str,
        difficulty: str,
        language: str,
        order_num: int,
        total_questions: int,
        resume_context: str = None,
        jd_context: str = None
    ) -> Dict[str, Any]:
        agent = cls.get_agent_for_order(order_num, total_questions)
        
        # Build base prompt guidelines
        system_prompt = InterviewPrompts.get_system_prompt_for_agent(agent.name, company_style)
        
        # Build customized user prompt using agent guidelines context
        user_prompt = InterviewPrompts.get_question_generation_prompt(
            role=role,
            experience=experience,
            difficulty=difficulty,
            language=language,
            question_num=order_num,
            agent_type=agent.name,
            resume_context=resume_context,
            jd_context=jd_context
        )
        
        # Combine agent custom context into system prompt
        extended_system_prompt = f"{system_prompt}\nAgent Role Guidelines:\n{agent.generate_prompt_context({'role': role, 'difficulty': difficulty, 'language': language})}"
        
        try:
            response = LLMProvider.generate_response(extended_system_prompt, user_prompt)
            data = json.loads(response)
            
            # Sanity format defaults
            return {
                "question_text": data.get("question_text", "Explain your approach to database index design."),
                "question_type": data.get("question_type", "Short Answer"),
                "difficulty": data.get("difficulty", difficulty),
                "options": data.get("options", []),
                "correct_answer": data.get("correct_answer", ""),
                "interviewer_agent": agent.name
            }
        except Exception as e:
            logger.error(f"InterviewOrchestrator failed to parse generated question: {e}")
            # Dynamic fallback depending on active agent
            if isinstance(agent, CodingInterviewerAgent):
                return {
                    "question_text": f"Write a Python function to find the maximum sub-array sum using Kadane's Algorithm.",
                    "question_type": "Coding",
                    "difficulty": difficulty,
                    "options": [],
                    "correct_answer": "Initialize max_so_far and max_ending_here to 0, iterate over the list updating max_ending_here += x. Reset if negative.",
                    "interviewer_agent": agent.name
                }
            elif isinstance(agent, ReasoningEvaluatorAgent):
                return {
                    "question_text": "A father is 4 times as old as his son. In 20 years, he will be twice as old. What are their current ages?",
                    "question_type": "Short Answer",
                    "difficulty": difficulty,
                    "options": [],
                    "correct_answer": "Father is 40 and Son is 10. Let 4x + 20 = 2(x + 20). 2x = 20, x = 10.",
                    "interviewer_agent": agent.name
                }
            elif isinstance(agent, AptitudeEvaluatorAgent):
                return {
                    "question_text": "What is the probability of rolling a sum of 7 using two fair 6-sided dice?",
                    "question_type": "Short Answer",
                    "difficulty": difficulty,
                    "options": [],
                    "correct_answer": "The outcomes are (1,6),(2,5),(3,4),(4,3),(5,2),(6,1) which equals 6/36 = 1/6.",
                    "interviewer_agent": agent.name
                }
            else:
                return {
                    "question_text": f"Explain the differences between multiprocessing and multithreading in {language}.",
                    "question_type": "Short Answer",
                    "difficulty": difficulty,
                    "options": [],
                    "correct_answer": "Multiprocessing uses separate memory heaps for isolation, while multithreading shares process memory but faces context lock issues.",
                    "interviewer_agent": agent.name
                }
