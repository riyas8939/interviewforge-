import json
import uuid
import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.database.models import Interview, Question, Answer, Resume, JobDescription
from app.schemas.interview import InterviewStart
from app.llm.llm_provider import LLMProvider
from app.llm.prompts import InterviewPrompts
from app.services.rag_service import rag_system

def determine_agent_for_order(order_num: int, total_questions: int) -> str:
    # Sequenced agent rounds: Technical, Reasoning, Aptitude, Coding
    agents = [
        "Technical Interviewer",
        "Reasoning Evaluator",
        "Aptitude Evaluator",
        "Coding Interviewer"
    ]
    # Map index based on order
    idx = (order_num - 1) % len(agents)
    return agents[idx]

def create_new_interview(db: Session, user_id: int, setup: InterviewStart) -> Interview:
    interview_id = str(uuid.uuid4())
    db_interview = Interview(
        id=interview_id,
        user_id=user_id,
        role=setup.role,
        company_style=setup.company_style,
        experience=setup.experience,
        difficulty=setup.difficulty,
        programming_language=setup.programming_language,
        num_questions=setup.num_questions,
        is_training_mode=setup.is_training_mode,
        status="STARTED"
    )
    
    # Store Resume/JD text in RAG memory for this session
    rag_system.clear()
    if setup.resume_text:
        rag_system.add_document(setup.resume_text, "resume")
    if setup.jd_text:
        rag_system.add_document(setup.jd_text, "job_description")
        
        # Persist Job Description to DB so it survives restarts
        db_jd = JobDescription(
            interview_id=interview_id,
            raw_text=setup.jd_text
        )
        db.add(db_jd)
        
    db.add(db_interview)
    db.commit()
    db.refresh(db_interview)
    return db_interview

def parse_llm_json(response: str) -> dict:
    import re
    
    def clean_json_str(s: str) -> str:
        s = s.strip()
        if s.startswith("```"):
            s = re.sub(r'^```[a-zA-Z]*\n', '', s)
            s = re.sub(r'\n```$', '', s)
        s = s.strip()
        # Replace triple quotes
        s = s.replace('"""', '"')
        # Remove string concatenation: e.g. "foo" + \n "bar" -> "foobar"
        s = re.sub(r'"\s*\+\s*(?:\r?\n\s*)?"', '', s)
        return s

    response_str = clean_json_str(response)
    
    # Try raw parsing first
    try:
        return json.loads(response_str, strict=False)
    except Exception:
        pass
        
    # Extract from markdown block if present
    for marker in ["```json", "```JSON", "```"]:
        if marker in response_str:
            parts = response_str.split(marker)
            for part in parts[1:]:
                subpart = part.split("```")[0].strip()
                subpart = clean_json_str(subpart)
                try:
                    return json.loads(subpart, strict=False)
                except Exception:
                    pass
                    
    # Find outer brackets
    start = response_str.find("{")
    end = response_str.rfind("}")
    if start != -1 and end != -1 and end > start:
        subpart = response_str[start:end+1]
        subpart = clean_json_str(subpart)
        try:
            return json.loads(subpart, strict=False)
        except Exception:
            pass
            
    # Regex fallback extraction
    data = {}
    q_match = re.search(r'"question_text"\s*:\s*"([^"]+)"', response_str)
    if q_match:
        data["question_text"] = q_match.group(1)
    else:
        # Try single quotes
        q_match = re.search(r"'question_text'\s*:\s*'([^']+)'", response_str)
        if q_match:
            data["question_text"] = q_match.group(1)
            
    t_match = re.search(r'"question_type"\s*:\s*"([^"]+)"', response_str)
    if t_match:
        data["question_type"] = t_match.group(1)
        
    d_match = re.search(r'"difficulty"\s*:\s*"([^"]+)"', response_str)
    if d_match:
        data["difficulty"] = d_match.group(1)
        
    c_match = re.search(r'"correct_answer"\s*:\s*"([^"]+)"', response_str)
    if c_match:
        data["correct_answer"] = c_match.group(1)
        
    v_match = re.search(r'"vague_hint"\s*:\s*"([^"]+)"', response_str)
    if v_match:
        data["vague_hint"] = v_match.group(1)
        
    a_match = re.search(r'"approach_hint"\s*:\s*"([^"]+)"', response_str)
    if a_match:
        data["approach_hint"] = a_match.group(1)
        
    e_match = re.search(r'"detailed_explanation"\s*:\s*"([^"]+)"', response_str)
    if e_match:
        data["detailed_explanation"] = e_match.group(1)
        
    if "question_text" in data:
        return data
        
    raise ValueError("Failed to extract JSON fields from LLM response")

def generate_question_for_interview(db: Session, interview_id: str, order_num: int) -> Question:
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError("Interview not found")
        
    # Re-populate RAG memory if it was cleared by a server restart
    if not rag_system.documents:
        latest_resume = db.query(Resume).filter(Resume.user_id == interview.user_id).order_by(Resume.created_at.desc()).first()
        if latest_resume:
            rag_system.add_document(latest_resume.raw_text, "resume")
            
        jd = db.query(JobDescription).filter(JobDescription.interview_id == interview_id).first()
        if jd:
            rag_system.add_document(jd.raw_text, "job_description")

    agent = determine_agent_for_order(order_num, interview.num_questions)
    
    # RAG search for context (fetch up to 5 results to capture both resume and JD)
    search_results = rag_system.search(f"{interview.role} {agent}", top_k=5)
    
    resume_chunks = [res[0] for res in search_results if res[2] == "resume"]
    jd_chunks = [res[0] for res in search_results if res[2] == "job_description"]
    
    resume_context = "\n".join(resume_chunks) if resume_chunks else None
    jd_context = "\n".join(jd_chunks) if jd_chunks else None
        
    # Fetch previous questions globally across all user interviews to prevent repetition
    previous_questions_list = (
        db.query(Question)
        .join(Interview, Question.interview_id == Interview.id)
        .filter(Interview.user_id == interview.user_id)
        .order_by(Interview.created_at.desc(), Question.order_num.desc())
        .limit(20)
        .all()
    )
    previous_questions_text = "\n".join([f"- {q.question_text}" for q in previous_questions_list]) if previous_questions_list else None
        
    system_prompt = InterviewPrompts.get_system_prompt_for_agent(agent, interview.company_style)
    user_prompt = InterviewPrompts.get_question_generation_prompt(
        role=interview.role,
        experience=interview.experience,
        difficulty=interview.difficulty,
        language=interview.programming_language,
        question_num=order_num,
        agent_type=agent,
        resume_context=resume_context,
        jd_context=jd_context,
        previous_questions=previous_questions_text
    )
    
    response = LLMProvider.generate_response(system_prompt, user_prompt)
    
    # Parse question fields
    try:
        data = parse_llm_json(response)
        question_text = data.get("question_text", "Explain your understanding of the target stack.")
        question_type = data.get("question_type", "Short Answer")
        q_difficulty = data.get("difficulty", interview.difficulty)
        options = json.dumps(data.get("options", []))
        
        pack = {
            "correct_answer": data.get("correct_answer", ""),
            "vague_hint": data.get("vague_hint", ""),
            "approach_hint": data.get("approach_hint", ""),
            "detailed_explanation": data.get("detailed_explanation", "")
        }
        correct_answer = json.dumps(pack)
    except Exception as e:
        import traceback
        print(f"[ERROR] JSON parsing failed: {e}. Raw response: {response}")
        traceback.print_exc()
        # Fallback question structure
        question_text = f"Describe key principles of {interview.role} you have applied in your previous work."
        question_type = "Short Answer"
        q_difficulty = interview.difficulty
        options = json.dumps([])
        correct_answer = json.dumps({
            "correct_answer": "No answer available",
            "vague_hint": "Focus on your real-world experience.",
            "approach_hint": "Describe projects and responsibilities.",
            "detailed_explanation": "Explain your backend background and specific technologies."
        })
        
    db_question = Question(
        id=str(uuid.uuid4()),
        interview_id=interview_id,
        interviewer_agent=agent,
        question_text=question_text,
        question_type=question_type,
        difficulty=q_difficulty,
        options=options,
        correct_answer=correct_answer,
        order_num=order_num
    )
    db.add(db_question)
    db.commit()
    db.refresh(db_question)
    return db_question

def evaluate_answer_and_update(db: Session, question_id: str, answer_text: str) -> Dict[str, Any]:
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise ValueError("Question not found")
        
    interview = db.query(Interview).filter(Interview.id == question.interview_id).first()
    
    # Compute basic answer metrics
    words = answer_text.strip().split()
    actual_word_count = len(words)
    actual_estimated_time = int(round(actual_word_count / 130.0 * 60)) # 130 wpm
    filler_words = ["um", "uh", "like", "you know", "basically", "actually"]
    lower_text = answer_text.lower()
    filler_word_count = sum(lower_text.count(fw) for fw in filler_words)

    # Local validation rule for random typing/junk inputs
    is_junk = False
    clean_ans = answer_text.strip().lower()
    if actual_word_count <= 2:
        is_junk = True
    # Catch typical keyboard mashing or single characters
    elif len(clean_ans) < 8 or any(m in clean_ans for m in ["asdf", "qwer", "zxcv", "jkl;", "sdfg"]):
        is_junk = True
        
    if is_junk:
        db_answer = Answer(
            id=str(uuid.uuid4()),
            question_id=question_id,
            answer_text=answer_text,
            score=0.0,
            correctness=0.0,
            communication=0.0,
            technical_depth=0.0,
            confidence=0.0,
            problem_solving=0.0,
            best_practices=0.0,
            professionalism_score=0.0,
            grammar_score=0.0,
            pacing_score=0.0,
            overall_feedback="Evaluation rejected: The response was too short, empty, or contained random keyboard mashing/unrelated text. Please provide a meaningful answer to the question asked.",
            strengths=[],
            weaknesses=["Did not provide a meaningful answer."],
            missing_points=["Missing entire response content."],
            priority_improvements=["Write a comprehensive response addressing the question."],
            tips=["Avoid keyboard mashing.", "Provide technical details."],
            answer_pacing_feedback="N/A",
            recommended_framework="Technical Explanation",
            ideal_answer_structure={},
            ideal_answer_example="",
            estimated_time_seconds=60,
            actual_word_count=actual_word_count,
            actual_estimated_time=actual_estimated_time,
            filler_word_count=filler_word_count,
            ideal_word_count={"min": 100, "max": 150},
            interviewer_impression={"rating": "Rejected", "reason": "Random typing detected."},
            suggestions="Please rewrite your answer completely.",
            follow_up_question=""
        )
        db.add(db_answer)
        db.commit()
        return db_answer

    # Fetch Q&A history for context
    history_str = ""
    past_questions = db.query(Question).filter(Question.interview_id == interview.id).order_by(Question.order_num).all()
    for pq in past_questions:
        if pq.candidate_answer and pq.id != question_id:
            history_str += f"Q: {pq.question_text}\nA: {pq.candidate_answer.answer_text}\n"

    # Extract expected answer from packed JSON if present
    expected_ans = question.correct_answer
    try:
        ans_data = json.loads(question.correct_answer)
        if isinstance(ans_data, dict) and "correct_answer" in ans_data:
            expected_ans = ans_data["correct_answer"]
    except Exception:
        pass

    system_prompt = (
        "You are an expert AI interviewer evaluator. Score the answer strictly and constructively. "
        "Return ONLY raw JSON matching the required format."
    )
    user_prompt = InterviewPrompts.get_evaluation_prompt(
        question=question.question_text,
        question_type=question.question_type,
        expected_answer=expected_ans,
        candidate_answer=answer_text,
        history=history_str
    )
    
    response = LLMProvider.generate_response(system_prompt, user_prompt)
    
    # Strip accidental markdown
    clean_response = response.strip()
    if clean_response.startswith("```json"):
        clean_response = clean_response[7:]
    if clean_response.startswith("```"):
        clean_response = clean_response[3:]
    if clean_response.endswith("```"):
        clean_response = clean_response[:-3]
    clean_response = clean_response.strip()
    
    def clamp(val: float) -> float:
        try:
            return max(0.0, min(float(val), 10.0))
        except (ValueError, TypeError):
            return 0.0

    try:
        data = json.loads(clean_response, strict=False)
        overall_score = clamp(data.get("overall_score", 7.0))
        technical_score = clamp(data.get("technical_score", 7.0))
        communication_score = clamp(data.get("communication_score", 7.0))
        confidence_score = clamp(data.get("confidence_score", 7.0))
        grammar_score = clamp(data.get("grammar_score", 7.0))
        professionalism_score = clamp(data.get("professionalism_score", 7.0))
        pacing_score = clamp(data.get("pacing_score", 7.0))
        
        overall_feedback = data.get("overall_feedback", "")
        strengths = data.get("strengths", [])
        weaknesses = data.get("weaknesses", [])
        missing_points = data.get("missing_points", [])
        priority_improvements = data.get("priority_improvements", [])
        answer_pacing_feedback = data.get("answer_pacing_feedback", "")
        recommended_framework = data.get("recommended_framework", "Technical Explanation")
        ideal_answer_structure = data.get("ideal_answer_structure", {})
        ideal_answer_example = data.get("ideal_answer_example", "")
        tips = data.get("tips", [])
        follow_up = data.get("follow_up_question", "")
        estimated_time_seconds = int(data.get("estimated_time_seconds", 60))
        ideal_word_count = data.get("ideal_word_count", {"min": 100, "max": 150})
        interviewer_impression = data.get("interviewer_impression", {"rating": "Average", "reason": ""})

        # Repair nested structures from small model hallucinations (e.g. Gemma)
        if isinstance(ideal_answer_structure, dict):
            for k in ["tips", "estimated_time_seconds", "ideal_word_count", "interviewer_impression", "ideal_answer_example", "follow_up_question"]:
                if k in ideal_answer_structure:
                    if k == "tips":
                        tips = ideal_answer_structure.pop("tips")
                    elif k == "estimated_time_seconds":
                        try:
                            estimated_time_seconds = int(ideal_answer_structure.pop("estimated_time_seconds"))
                        except (ValueError, TypeError):
                            pass
                    elif k == "ideal_word_count":
                        ideal_word_count = ideal_answer_structure.pop("ideal_word_count")
                    elif k == "interviewer_impression":
                        interviewer_impression = ideal_answer_structure.pop("interviewer_impression")
                    elif k == "ideal_answer_example":
                        ideal_answer_example = ideal_answer_structure.pop("ideal_answer_example")
                    elif k == "follow_up_question":
                        follow_up = ideal_answer_structure.pop("follow_up_question")

            # Clean and sanitize ideal_answer_structure to be Dict[str, str]
            sanitized_structure = {}
            for k, v in ideal_answer_structure.items():
                if isinstance(v, (str, int, float, bool)):
                    sanitized_structure[str(k)] = str(v)
                else:
                    sanitized_structure[str(k)] = json.dumps(v)
            ideal_answer_structure = sanitized_structure
        else:
            ideal_answer_structure = {}

        # Sanitize interviewer_impression
        if isinstance(interviewer_impression, dict):
            interviewer_impression = {str(k): str(v) for k, v in interviewer_impression.items()}
        else:
            interviewer_impression = {"rating": "Average", "reason": "No impression generated."}

        # Sanitize ideal_word_count
        if isinstance(ideal_word_count, dict):
            sanitized_word_count = {}
            for k, v in ideal_word_count.items():
                try:
                    sanitized_word_count[str(k)] = int(v)
                except (ValueError, TypeError):
                    sanitized_word_count[str(k)] = 100
            ideal_word_count = sanitized_word_count
        else:
            ideal_word_count = {"min": 100, "max": 150}

        # Force strengths / weaknesses / missing_points / priority_improvements / tips to be List[str]
        if not isinstance(strengths, list): strengths = [str(strengths)]
        else: strengths = [str(x) for x in strengths]
        if not isinstance(weaknesses, list): weaknesses = [str(weaknesses)]
        else: weaknesses = [str(x) for x in weaknesses]
        if not isinstance(missing_points, list): missing_points = [str(missing_points)]
        else: missing_points = [str(x) for x in missing_points]
        if not isinstance(priority_improvements, list): priority_improvements = [str(priority_improvements)]
        else: priority_improvements = [str(x) for x in priority_improvements]
        if not isinstance(tips, list): tips = [str(tips)]
        else: tips = [str(x) for x in tips]
        
    except Exception as e:
        print(f"Error parsing LLM response: {e}")
        # Fallback evaluation
        overall_score = 7.5
        technical_score = 7.5
        communication_score = 7.5
        confidence_score = 7.5
        grammar_score = 7.5
        professionalism_score = 7.5
        pacing_score = 7.5
        overall_feedback = "Successfully addressed the question, but parsing detailed feedback failed."
        strengths = ["Attempted answer"]
        weaknesses = ["Needs more detail"]
        missing_points = []
        priority_improvements = []
        answer_pacing_feedback = ""
        recommended_framework = "STAR"
        ideal_answer_structure = {}
        ideal_answer_example = ""
        tips = []
        follow_up = ""
        estimated_time_seconds = 60
        ideal_word_count = {"min": 100, "max": 150}
        interviewer_impression = {"rating": "Average", "reason": "Fallback generated."}
        
    # Deterministic MCQ checking block to override flat LLM scores
    if question.question_type == "Multiple Choice":
        import re
        expected_letter = None
        # Try extracting from expected_ans string
        match_exp = re.match(r'^\s*([A-D])\b', expected_ans.strip().upper())
        if match_exp:
            expected_letter = match_exp.group(1)
        else:
            # Substring scan
            for letter in ["A", "B", "C", "D"]:
                if f"OPTION {letter}" in expected_ans.upper() or expected_ans.strip().upper().startswith(letter) or f"ANSWER IS {letter}" in expected_ans.upper():
                    expected_letter = letter
                    break
        
        candidate_letter = None
        match_cand = re.match(r'^\s*([A-D])\b', answer_text.strip().upper())
        if match_cand:
            candidate_letter = match_cand.group(1)
            
        if expected_letter:
            is_correct = (candidate_letter == expected_letter)
            if is_correct:
                overall_score = 10.0
                technical_score = 10.0
                communication_score = 10.0
                confidence_score = 10.0
                grammar_score = 10.0
                professionalism_score = 10.0
                pacing_score = 10.0
                overall_feedback = f"Excellent! Your choice of Option {candidate_letter} is correct. {overall_feedback}"
                if "Correct option selected" not in strengths:
                    strengths.insert(0, f"Correct option selected ({candidate_letter})")
            else:
                overall_score = 1.0
                technical_score = 1.0
                communication_score = 5.0
                confidence_score = 4.0
                grammar_score = 10.0
                professionalism_score = 10.0
                pacing_score = 10.0
                overall_feedback = f"Incorrect. You selected Option {candidate_letter or 'unknown'}, but the correct option was Option {expected_letter}."
                if "Incorrect option selected" not in weaknesses:
                    weaknesses.insert(0, f"Incorrect option selected ({candidate_letter or 'None'} instead of {expected_letter})")
                missing_points.append(f"Expected Option {expected_letter}.")
                priority_improvements.append(f"Review core concepts relating to Option {expected_letter}.")

    db_answer = Answer(
        id=str(uuid.uuid4()),
        question_id=question_id,
        answer_text=answer_text,
        score=overall_score, # Legacy field, maps to overall
        correctness=technical_score, # Legacy mapping
        communication=communication_score,
        technical_depth=technical_score,
        confidence=confidence_score,
        problem_solving=technical_score, # Legacy mapping
        best_practices=technical_score, # Legacy mapping
        professionalism_score=professionalism_score,
        grammar_score=grammar_score,
        pacing_score=pacing_score,
        overall_feedback=overall_feedback,
        strengths=strengths,
        weaknesses=weaknesses,
        missing_points=missing_points,
        priority_improvements=priority_improvements,
        tips=tips,
        answer_pacing_feedback=answer_pacing_feedback,
        recommended_framework=recommended_framework,
        ideal_answer_structure=ideal_answer_structure,
        ideal_answer_example=ideal_answer_example,
        estimated_time_seconds=estimated_time_seconds,
        actual_word_count=actual_word_count,
        actual_estimated_time=actual_estimated_time,
        filler_word_count=filler_word_count,
        ideal_word_count=ideal_word_count,
        interviewer_impression=interviewer_impression,
        suggestions="See tips.",
        follow_up_question=follow_up
    )
    db.add(db_answer)
    db.commit()
    
    # Adaptive Difficulty logic (scaled to 0-10)
    current_difficulty = interview.difficulty
    if overall_score >= 8.0:
        if current_difficulty == "Easy":
            interview.difficulty = "Medium"
        elif current_difficulty == "Medium":
            interview.difficulty = "Hard"
    elif overall_score < 5.0:
        if current_difficulty == "Hard":
            interview.difficulty = "Medium"
        elif current_difficulty == "Medium":
            interview.difficulty = "Easy"
            
    db.commit()
    return db_answer

def finalize_interview_report(db: Session, interview_id: str) -> Interview:
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise ValueError("Interview not found")
        
    # Get all Q&A for final recommendation prompt
    history_str = ""
    scores_sum = 0.0
    tech_sum = 0.0
    coding_sum = 0.0
    comm_sum = 0.0
    behav_sum = 0.0
    
    q_count = 0
    coding_count = 0
    
    questions = db.query(Question).filter(Question.interview_id == interview_id).all()
    for q in questions:
        q_history = f"Agent: {q.interviewer_agent}\nQ: {q.question_text}\n"
        if q.candidate_answer:
            ans = q.candidate_answer
            q_history += f"A: {ans.answer_text}\nScore: {ans.score}\nFeedback: {ans.suggestions}\n"
            scores_sum += ans.score
            
            # Map round-specific metrics
            if q.interviewer_agent == "Technical Interviewer":
                tech_sum += ans.technical_depth
            elif q.interviewer_agent == "Coding Interviewer":
                coding_sum += ans.problem_solving
                coding_count += 1
            elif q.interviewer_agent == "Behavioral Interviewer":
                behav_sum += ans.correctness
            elif q.interviewer_agent == "Communication Evaluator":
                comm_sum += ans.communication
                
            q_count += 1
        elif q.coding_solution:
            sub = q.coding_solution
            # Estimate score for coding submission if it exists
            c_score = (sub.test_cases_passed / sub.test_cases_total * 100.0) if sub.test_cases_total > 0 else 70.0
            q_history += f"Code Submission:\n{sub.code}\nCases: {sub.test_cases_passed}/{sub.test_cases_total}\n"
            scores_sum += c_score
            coding_sum += c_score
            coding_count += 1
            q_count += 1
            
        history_str += q_history + "\n"

    metadata_str = f"Role: {interview.role}, Experience: {interview.experience}, Company: {interview.company_style}"
    
    system_prompt = (
        "You are the senior Hiring Manager summarizing the multi-agent interview panel findings. "
        "Analyze the aggregate history and make a clear hiring recommendation. Return raw JSON."
    )
    user_prompt = InterviewPrompts.get_final_recommendation_prompt(metadata_str, history_str)
    
    response = LLMProvider.generate_response(system_prompt, user_prompt)
    
    try:
        data = json.loads(response, strict=False)
        interview.overall_score = data.get("overall_score", (scores_sum / q_count) if q_count > 0 else 75.0)
        interview.technical_score = data.get("technical_score", (tech_sum / q_count) if q_count > 0 else 75.0)
        interview.coding_score = data.get("coding_score", coding_sum if coding_count > 0 else 75.0)
        interview.communication_score = data.get("communication_score", (comm_sum / q_count) if q_count > 0 else 75.0)
        interview.behavioral_score = data.get("behavioral_score", (behav_sum / q_count) if q_count > 0 else 75.0)
        interview.hiring_decision = data.get("hiring_decision", "Maybe Hire")
        interview.hiring_reasoning = data.get("hiring_reasoning", "Decent performance, needs some improvement.")
        interview.summary = data.get("summary", "Complete interview simulator review.")
        interview.strengths = data.get("strengths", "Solid foundational software capabilities.")
        interview.weaknesses = data.get("weaknesses", "Could expand on architectural scaling designs.")
        interview.learning_roadmap = json.dumps(data.get("learning_roadmap", {}))
    except Exception:
        # Fallback Finalization
        avg_score = (scores_sum / q_count) if q_count > 0 else 75.0
        interview.overall_score = avg_score
        interview.technical_score = avg_score
        interview.coding_score = avg_score
        interview.communication_score = avg_score
        interview.behavioral_score = avg_score
        interview.hiring_decision = "Hire" if avg_score >= 80 else ("Maybe Hire" if avg_score >= 60 else "Needs Improvement")
        interview.hiring_reasoning = "Final evaluation based on overall averages across the agent panel."
        interview.summary = "Evaluation compiled using individual question scores."
        interview.strengths = "Good average scoring across coding and tech rounds."
        interview.weaknesses = "Areas in system design and behavioral answers could be improved."
        interview.learning_roadmap = json.dumps({
            "weak_topics": ["Coding optimization", "System Design"],
            "roadmap": [
                {"step": "Practice LeetCode medium questions", "resource": "LeetCode, HackerRank", "practice_question": "Two Sum, Longest Consecutive Sequence"},
                {"step": "Study System Design Fundamentals", "resource": "System Design Primer (GitHub)", "practice_question": "Design a URL Shortener"}
            ]
        })
        
    interview.status = "COMPLETED"
    db.commit()
    db.refresh(interview)
    return interview
