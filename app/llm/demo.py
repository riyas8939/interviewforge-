import json
import logging
from app.llm.base import BaseLLMProvider

logger = logging.getLogger(__name__)

class DemoProvider(BaseLLMProvider):
    def generate(self, system_prompt: str, user_prompt: str, max_tokens: int = 2000) -> str:
        prompt_lower = user_prompt.lower()
        system_lower = system_prompt.lower()

        # 1. Question Generation
        if "generate" in prompt_lower or "question" in prompt_lower or "interviewer" in system_lower:
            agent = "Technical Interviewer"
            if "coding" in prompt_lower or "coding" in system_lower:
                agent = "Coding Interviewer"
            elif "reasoning" in prompt_lower or "reasoning" in system_lower:
                agent = "Reasoning Evaluator"
            elif "aptitude" in prompt_lower or "aptitude" in system_lower:
                agent = "Aptitude Evaluator"
            elif "behavioral" in prompt_lower or "behavioral" in system_lower:
                agent = "Behavioral Interviewer"
            elif "communication" in prompt_lower or "communication" in system_lower:
                agent = "Communication Evaluator"
            elif "hiring manager" in prompt_lower or "hiring manager" in system_lower:
                agent = "Hiring Manager"
            
            # Dynamic Company Mock database lookup helper
            try:
                import os
                import re
                company = "Startup"
                for c in ["Google", "Meta", "Microsoft", "Amazon", "Netflix", "OpenAI"]:
                    if c.lower() in system_lower:
                        company = c
                        break
                
                json_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "database", "company_questions.json")
                if os.path.exists(json_path):
                    with open(json_path, "r", encoding="utf-8") as f:
                        q_data = json.load(f)
                    
                    category = "Coding" if agent == "Coding Interviewer" else "Technical"
                    q_list = q_data.get(company, {}).get(category, [])
                    if q_list:
                        match = re.search(r'question #?(\d+)', prompt_lower)
                        q_num = int(match.group(1)) if match else 1
                        q_idx = (q_num - 1) % len(q_list)
                        selected_q = q_list[q_idx]
                        
                        return json.dumps({
                            "question_text": selected_q["question_text"],
                            "question_type": selected_q["question_type"],
                            "difficulty": selected_q["difficulty"],
                            "options": selected_q.get("options", []),
                            "correct_answer": selected_q["correct_answer"]
                        })
            except Exception as e:
                logger.error(f"Failed to load company mock questions: {e}")

            if agent == "Coding Interviewer":
                return json.dumps({
                    "question_text": "Write a function that takes an array of integers and returns the length of the longest consecutive elements sequence. The algorithm should run in O(n) time complexity.",
                    "question_type": "Coding",
                    "difficulty": "Medium",
                    "options": [],
                    "correct_answer": "Use a hash set to achieve O(n) lookups. Iterate through the array and start counting sequence lengths from elements that do not have a predecessor (num - 1) in the set."
                })
            
            if agent == "Behavioral Interviewer":
                return json.dumps({
                    "question_text": "Describe a time when you had to make a critical technical decision under tight deadlines with incomplete information. What was your process, and how did it turn out?",
                    "question_type": "Behavioral",
                    "difficulty": "Medium",
                    "options": [],
                    "correct_answer": ""
                })
                
            if agent == "Communication Evaluator":
                return json.dumps({
                    "question_text": "How do you explain complex technical concepts, such as architectural decisions or deep learning models, to non-technical stakeholders (e.g. clients or product managers)? Please describe your strategy.",
                    "question_type": "Short Answer",
                    "difficulty": "Medium",
                    "options": [],
                    "correct_answer": ""
                })
            
            if agent == "Reasoning Evaluator":
                return json.dumps({
                    "question_text": "If a group of 5 workers can build 5 tables in 5 days, how many days does it take 100 workers to build 100 tables?",
                    "question_type": "Short Answer",
                    "difficulty": "Easy",
                    "options": [],
                    "correct_answer": "It takes 5 days. The rate of work is 1 table per worker per 5 days."
                })
                
            if agent == "Aptitude Evaluator":
                return json.dumps({
                    "question_text": "What is the probability of getting a sum of 9 when rolling two fair six-sided dice simultaneously?",
                    "question_type": "Short Answer",
                    "difficulty": "Medium",
                    "options": [],
                    "correct_answer": "The sum of 9 can be achieved by: (3,6), (4,5), (5,4), (6,3) which is 4 outcomes. The total number of outcomes is 36. Probability is 4/36 = 1/9."
                })
            
            if agent == "Hiring Manager":
                return json.dumps({
                    "question_text": "If two key engineers on your team strongly disagree about a system architecture choice, how would you facilitate a resolution to keep the project on track?",
                    "question_type": "Scenario Based",
                    "difficulty": "Medium",
                    "options": [],
                    "correct_answer": ""
                })

            return json.dumps({
                "question_text": "Can you explain the difference between processes and threads, and outline how they share resources or communicate?",
                "question_type": "Short Answer",
                "difficulty": "Medium",
                "options": [],
                "correct_answer": "Processes have separate memory space, whereas threads of a process share memory. Inter-process communication is slower, while thread synchronization is faster but prone to race conditions."
            })

        # 2. Answer Evaluation
        if "evaluate" in prompt_lower or "score" in prompt_lower or "evaluation" in system_lower:
            return json.dumps({
                "score": 85.0,
                "correctness": 88.0,
                "communication": 82.0,
                "technical_depth": 85.0,
                "confidence": 80.0,
                "problem_solving": 90.0,
                "best_practices": 85.0,
                "strengths": "Clear conceptual understanding. Identified resource sharing differences correctly.",
                "weaknesses": "Could have gone deeper into inter-process communication mechanisms (e.g., pipes, sockets, shared memory).",
                "suggestions": "Be sure to mention IPC specific protocols and thread race conditions or locks when discussing threads.",
                "follow_up_question": ""
            })

        # 3. Resume Parse
        if "resume" in prompt_lower or "extract" in prompt_lower:
            return json.dumps({
                "skills": ["Python", "FastAPI", "React", "Docker", "SQL", "Machine Learning", "Git"],
                "experience": ["Software Engineer at TechCorp (2 years)", "Junior Developer at StartupInc (1 year)"],
                "education": ["BS in Computer Science, State University (2024)"]
            })

        # 4. Job Description Match
        if "job description" in prompt_lower or "matching" in prompt_lower:
            return json.dumps({
                "ats_match_percentage": 78.5,
                "missing_technologies": ["Kubernetes", "PostgreSQL", "AWS"],
                "priority_learning_areas": ["AWS cloud hosting services", "Docker orchestration with Kubernetes"],
                "suggested_questions": ["Explain how you would deploy a containerized FastAPI application on AWS ECS or EKS.", "How do you handle database migration conflicts in PostgreSQL?"]
            })

        # 5. Final Interview Evaluation / Report
        if "finalize" in prompt_lower or "report" in prompt_lower or "hiring" in system_lower:
            return json.dumps({
                "overall_score": 83.5,
                "technical_score": 85.0,
                "coding_score": 80.0,
                "communication_score": 88.0,
                "behavioral_score": 81.0,
                "hiring_decision": "Hire",
                "hiring_reasoning": "The candidate demonstrated solid software engineering principles, wrote optimal code for the coding challenge, and possessed good communication skills. Minor gaps in AWS/Kubernetes knowledge, but easily trainable.",
                "summary": "Excellent general backend performance with good react familiarity.",
                "strengths": "Strong problem-solving, structured code implementation, clear reasoning.",
                "weaknesses": "Could improve container orchestration and cloud design knowledge.",
                "learning_roadmap": {
                    "weak_topics": ["AWS Deployment", "Kubernetes", "PostgreSQL tuning"],
                    "roadmap": [
                        {"step": "AWS Cloud Practitioner & ECS", "resource": "AWS Academy, FreeCodeCamp", "practice_question": "Explain ECS tasks and services."},
                        {"step": "Kubernetes fundamentals", "resource": "Kubernetes.io docs & tutorials", "practice_question": "How do Pods communicate in a namespace?"}
                    ]
                }
            })

        return "Response generated successfully. Candidate demonstrated solid engineering practices."