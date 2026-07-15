class InterviewPrompts:
    @staticmethod
    def get_system_prompt_for_agent(agent_type: str, company_style: str) -> str:
        agent_styles = {
            "Technical Interviewer": (
                "You are an expert Technical Interviewer. Your goal is to assess the candidate's core engineering theories, "
                "data structures, system design capabilities, and framework knowledge. Focus on depth and correctness."
            ),
            "Coding Interviewer": (
                "You are a Coding Interviewer. You evaluate code implementation skills. You generate code puzzles or "
                "real-world implementation challenges, requesting code to solve a specific problem."
            ),
            "Behavioral Interviewer": (
                "You are a Behavioral Interviewer. You focus on situational questions using the STAR framework "
                "(Situation, Task, Action, Result) to evaluate collaboration, conflicts, leadership, and adaptability."
            ),
            "Communication Evaluator": (
                "You are a Communication Evaluator. Your goal is to assess candidate verbal expressions, vocabulary correctness, "
                "comprehensibility, filler word frequencies, and structured response styles."
            ),
            "Hiring Manager": (
                "You are the Hiring Manager. You review overall candidate capabilities, culture alignment, "
                "long-term potential, salary expectation handling, and strategic vision."
            ),
            "Reasoning Evaluator": (
                "You are a Reasoning Evaluator. Your goal is to evaluate the candidate's logical deduction, pattern recognition, "
                "critical thinking, and logical puzzle-solving capabilities under pressure."
            ),
            "Aptitude Evaluator": (
                "You are an Aptitude Evaluator. Your goal is to assess quantitative, mathematical, statistical, "
                "and analytical reasoning skills with numerical or probability-based problem prompts."
            )
        }
        
        company_behaviors = {
            "Google": "You demand high algorithmic efficiency (O(n) complex structures), rigorous mathematical precision, and edge-case handling.",
            "Amazon": "You heavily emphasize Amazon's Leadership Principles, scaling, high availability, customer obsession, and metrics-driven decisions.",
            "Microsoft": "You value enterprise patterns, robust testing, cross-compatibility, security, and structured corporate methodologies.",
            "Meta": "You focus on speed, quick iterations, scalability at billions of users, system modularity, and pragmatic problem solving.",
            "Netflix": "You prioritize extreme autonomy, density of talent, scalability, direct communication, and performance/system reliability.",
            "OpenAI": "You focus on AI research foundations, clean data engineering, scale, model training/inference limits, and ethical safeguards.",
            "Startup": "You value rapid prototyping, wearing multiple hats, raw execution speed, full-stack capabilities, and resourcefulness."
        }
        
        agent_prompt = agent_styles.get(agent_type, agent_styles["Technical Interviewer"])
        company_prompt = company_behaviors.get(company_style, company_behaviors["Startup"])
        
        return (
            f"{agent_prompt}\n"
            f"Style: {company_prompt}\n"
            "You MUST return all question specifications in raw JSON format with fields: "
            '{"question_text": "...", "question_type": "...", "difficulty": "...", "options": [], "correct_answer": "...", "vague_hint": "...", "approach_hint": "...", "detailed_explanation": "..."}. '
            "Do NOT include any extra conversational wrapper texts. Return ONLY valid JSON."
        )

    @staticmethod
    def get_question_generation_prompt(
        role: str, experience: str, difficulty: str, language: str,
        question_num: int, agent_type: str, resume_context: str = None, jd_context: str = None,
        previous_questions: str = None
    ) -> str:
        prompt = (
            f"Generate a unique interview question for a {role} role at {experience} experience level.\n"
            f"Target Question Difficulty: {difficulty}\n"
            f"Primary Language/Stack: {language}\n"
            f"This is Question #{question_num} in the sequence.\n"
            f"Interviewer Section/Agent: {agent_type}\n"
        )
        if resume_context:
            prompt += (
                f"Incorporate details from the candidate's resume/skills/experience: {resume_context}\n"
                "CRITICAL: If the resume contains projects, achievements, or tech stacks used, you MUST formulate "
                "specific questions asking about those projects (e.g. why they chose a specific technology, how they solved "
                "a particular scaling bottleneck in one of their listed projects, or to explain the architecture of a project on their resume).\n"
            )
        if jd_context:
            prompt += f"Tailor the question to align with this Job Description: {jd_context}\n"
            
        if previous_questions:
            prompt += f"\nCRITICAL: Do NOT ask any of the following questions, as they have already been asked in this session:\n{previous_questions}\n"
            
        # Force Multiple Choice question format for all agent types
        target_types = "Multiple Choice"
        if agent_type == "Technical Interviewer":
            focus = "core engineering knowledge, theoretical concepts, stack specifics, and system design."
        elif agent_type == "Reasoning Evaluator":
            focus = "logical reasoning, analytical deduction, brain teasers, and problem-solving patterns."
        elif agent_type == "Aptitude Evaluator":
            focus = "mathematical ability, computational speed, statistics, and quantitative aptitude."
        elif agent_type == "Coding Interviewer":
            focus = "writing clean code, optimizing time/space complexity, data structure selection, and programmatic implementation."
        else:
            focus = "general professional engineering fit."

        prompt += (
            f"Generate a UNIQUE and NON-REPETITIVE question. Since you are acting as a '{agent_type}', you MUST formulate the question strictly as a '{target_types}' question.\n"
            f"Focus on: {focus}\n\n"
            "Rules:\n"
            "  1. The question MUST be formatted as a Multiple Choice question. You must populate the 'options' array with exactly 4 distinct option strings (for Options A, B, C, and D).\n"
            "  2. Leave no options empty. Ensure the options are clearly formatted, distinct, and directly related to the question.\n"
            "  3. Always populate the 'correct_answer' field with the correct option letter (A, B, C, or D) and a detailed model answer explanation.\n"
            "  4. Set 'difficulty' exactly to one of: Easy, Medium, Hard.\n"
            "  5. Set 'question_type' strictly to 'Multiple Choice'.\n"
            "  6. Always populate 'vague_hint' with a light hint pointing to the concept (do not reveal the answer).\n"
            "  7. Always populate 'approach_hint' with a hint about the approach or methodology.\n"
            "  8. Always populate 'detailed_explanation' with a comprehensive educational breakdown of the core concepts."
        )
        return prompt

    @staticmethod
    def get_evaluation_prompt(question: str, question_type: str, expected_answer: str, candidate_answer: str, history: str = "") -> str:
        return (
            "You are a highly critical, senior technical interviewer. Evaluate the candidate's response to the interview question below strictly and realistically.\n\n"
            f"Question: {question}\n"
            f"Question Type: {question_type}\n"
            f"Expected Answer: {expected_answer}\n"
            f"Candidate's Answer: {candidate_answer}\n"
            f"Previous Conversation History (context): {history}\n\n"
            "Scoring Guidelines (Scale 0.0 to 10.0):\n"
            "  - 9.0 to 10.0 (Outstanding): Perfect, highly comprehensive, addresses edge cases, clean terminology, excellent structure.\n"
            "  - 7.0 to 8.9 (Good): Mostly correct, covers key points, minor details missing, good communication.\n"
            "  - 5.0 to 6.9 (Average): Vague, generic, misses major expected concepts, or has weak explanation. Barely passing.\n"
            "  - 1.0 to 4.9 (Poor): Extremely brief (e.g. 1-2 sentences), contains incorrect facts, lacks depth, or is very confused.\n"
            "  - 0.0: Unrelated response, 'I don't know', or empty answer.\n\n"
            "Strictness Rules:\n"
            "  1. Be highly critical. Do not give default 8+ scores for basic or surface-level answers.\n"
            "  2. Deduct points heavily if the answer lacks specific engineering concepts mentioned in the Expected Answer.\n"
            "  3. Deduct points if the answer is too short or doesn't explain the 'why'.\n"
            "  4. RANDOM TYPING / MASHING / JUNK INPUT RULE: If the candidate's answer is a random/non-sensical string, generic mashing (e.g. 'asdf', 'dfghjk', 'x'), a single word that doesn't answer the question, or has zero contextual relevance to the question, you MUST grade ALL scores (overall_score, technical_score, etc.) strictly as 0.0 or 1.0. The overall_feedback must call out the candidate for providing random typing.\n\n"
            "Analyze correctness, communication quality, technical depth, confidence, problem solving, grammar, pacing, and professionalism.\n"
            "Determine the best structural framework to recommend (e.g. STAR, PREP, Technical Explanation, Step-by-step).\n"
            "Return ONLY a raw JSON object matching the exact schema below. Do NOT include Markdown blocks, ```json, or explanations.\n"
            "{\n"
            '  "overall_score": 8.8,\n'
            '  "overall_feedback": "A short 1-2 sentence overall impression.",\n'
            '  "technical_score": 9.1,\n'
            '  "communication_score": 8.5,\n'
            '  "confidence_score": 8.0,\n'
            '  "grammar_score": 8.4,\n'
            '  "professionalism_score": 9.2,\n'
            '  "pacing_score": 7.8,\n'
            '  "strengths": ["Clear communication", "Good technical knowledge"],\n'
            '  "weaknesses": ["Missed edge cases"],\n'
            '  "missing_points": ["Did not mention scalability"],\n'
            '  "priority_improvements": ["Focus on adding measurable results"],\n'
            '  "answer_pacing_feedback": "Your answer was a bit lengthy and included unnecessary background.",\n'
            '  "recommended_framework": "STAR",\n'
            '  "ideal_answer_structure": {"Situation": "...", "Task": "...", "Action": "...", "Result": "..."},\n'
            '  "ideal_answer_example": "A fully written out excellent answer.",\n'
            '  "tips": ["Speak slower", "Quantify metrics"],\n'
            '  "follow_up_question": "Generate an intelligent follow-up question digging deeper.",\n'
            '  "estimated_time_seconds": 75,\n'
            '  "ideal_word_count": {"min": 150, "max": 200},\n'
            '  "interviewer_impression": {"rating": "Likely Shortlisted", "reason": "Strong performance."}\n'
            "}\n"
            "All scores must be between 0.0 and 10.0.\n"
            "Return RAW JSON only."
        )

    @staticmethod
    def get_final_recommendation_prompt(interview_details: str, QA_history: str) -> str:
        return (
            "You are the final Hiring Manager reviewing the feedback from all previous round agents.\n"
            f"Interview Metadata: {interview_details}\n"
            f"Q&A History: {QA_history}\n\n"
            "Aggregate the scores and recommendations to output a final summary.\n"
            "Return a raw JSON object with the following fields:\n"
            "{\n"
            '  "overall_score": 0.0 to 100.0,\n'
            '  "technical_score": 0.0 to 100.0,\n'
            '  "coding_score": 0.0 to 100.0,\n'
            '  "communication_score": 0.0 to 100.0,\n'
            '  "behavioral_score": 0.0 to 100.0,\n'
            '  "hiring_decision": "Hire" or "Maybe Hire" or "Needs Improvement",\n'
            '  "hiring_reasoning": "Detailed explanation of why this hiring recommendation was made.",\n'
            '  "summary": "General overview of interview performance.",\n'
            '  "strengths": "Detailed strengths list.",\n'
            '  "weaknesses": "Detailed weaknesses list.",\n'
            '  "learning_roadmap": {\n'
            '     "weak_topics": ["topic1", "topic2"],\n'
            '     "roadmap": [\n'
            '        {"step": "Step 1 name", "resource": "Learning Resource link/name", "practice_question": "Interview question to practice"},\n'
            '        {"step": "Step 2 name", "resource": "Learning Resource link/name", "practice_question": "Interview question to practice"}\n'
            '     ]\n'
            '  }\n'
            "}\n"
            "Do NOT include any extra conversational wrapper text. Return ONLY valid JSON."
        )
