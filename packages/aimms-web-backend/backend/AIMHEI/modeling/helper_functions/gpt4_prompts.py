class PromptDict(dict):
    def __getitem__(self, key):
        try:
            return super().__getitem__(key)
        except KeyError:
            raise ValueError(f"Invalid template type: {key}")


prompts = PromptDict(
    {
        "yes_no": {
            "parameters": ["context", "criteria"],
            "content": """
                Within this section of transcript [{context}],
                HCP stands for Health Care Provider.
                Does the interviewer complete the following task: [{criteria}]?
                Please provide your response in the following JSON format:
                {{
                    "think_step_by_step": "thinking process",
                    "explanation": "Your explanation here",
                    "answer": "YES" or "NO"
                    "line_numbers": [list of integers]
                }}
                Think step by step and explain your reasoning in the 'explanation' field. 
                After you finish explaining, indicate whether the task was completed with a "YES" or "NO" in the 'answer' field.
                Each question/criteria that could be applicable to the patient should be asked, if the HCP fails to do so, mark it as "NO".
                If a question/criteria is not applicable to the patient, the answer should be marked as "YES".
                Include a list of integers representing the line number(s) where the task is completed or relevant information is found.
            """,
        },
        "yes_no_reference_answer": {
            "parameters": ["context", "criteria", "reference_answer"],
            "content": """
                Within this section of transcript [{context}],
                HCP stands for Health Care Provider.
                Does the interviewer complete the following task: [{criteria}]?
                Assume that this answer generated for the previous task is correct: [{reference_answer}]
                NEVER contradict the answer to the previous task.
                Please provide your response in the following JSON format:
                {{
                    "think_step_by_step": "thinking process",
                    "explanation": "Your explanation here",
                    "answer": "YES" or "NO"
                    "line_numbers": [list of integers]
                }}
                Think step by step and explain your reasoning in the 'explanation' field. 
                If you used the reference answer, explain how in the 'explanation' field.
                After you finish explaining, indicate whether the task was completed with a "YES" or "NO" in the 'answer' field.
                Each question/criteria that could be applicable to the patient should be asked, if the HCP fails to do so, mark it as "NO".
                If a question/criteria is not applicable to the patient, the answer should be marked as "YES".
                Include a list of integers representing the line number(s) where the task is completed or relevant information is found.
            """,
        },
        "med_terms": {
            "parameters": ["term", "actual_definition", "context"],
            "content": """
                The following medical term: [{term}] has this definition: [{actual_definition}]
                Is the medical term: [{term}] explained (at least one time) as though talking to someone who has no medical knowledge in this context: [{context}]
                Prentend as though the patient has the knowledge of a 7th grader when determining if the medical term in question was adequately enough explained.
                Please provide your response in the following JSON format:
                {{
                    "think_step_by_step": "thinking process",
                    "explanation": "Your explanation here",
                    "answer": "YES" or "NO"
                }}
                Think step by step and explain your reasoning in the 'explanation' field. 
                After you finish explaining, indicate whether the task was completed with a "YES" or "NO" in the 'answer' field.
                If the medical term in question is a word that has multiple definitions and is used to mean something other than the this definition: [{actual_definition}],
                mark the answer as "YES" but in your explanation explain that the term has an alternative meaning and was used in that context instead.
            """,
        },
        "politeness": {
            "parameters": ["context"],
            "content": """
                Act like a doctor who is coaching new medical students on using politeness during patient interviews.
                This is a transcript from one of your student's that needs coaching: [{context}],
                HCP stands for Health Care Provider. Student lines start with "D"
                If you can, find areas where you can coach the student doctor (lines starting with "D") on becoming more polite.
                Please provide your response in the following JSON format:
                {{
                    "think_step_by_step": "thinking process",
                    "polite_examples": [list integers representing polite lines from transcript],
                    "coaching_tips": "written summary of coaching tips"
                }}
                Think step by step in the "think_step_by_step" field.
                Find and remember all areas from the transcript in which the student was polite (find a MINIMUM of 10 examples).
                Of these polite examples, provide the line numbers for exactly 10 instances wherein the student exhibited the MOST politeness.
                Place the most polite line numbers in the "polite_examples" field.
                In the "coaching_tips" field, when giving feedback, if/when you reference lines directly, use only lines that you noted in the "polite_examples".
                Otherwise, you can provide generalized/overall feedback as necessary to improve the student performance.
            """,
        },
        "politeness_scoring": {
            "parameters": ["sentence"],
            "content": """
                Act like a doctor who is coaching new medical students on using politeness during patient interviews.
                This is a line in a transcript from one of your student's that needs coaching: [{sentence}],
                Please provide your response in the following JSON format:
                {{
                    "best_version": "",
                    "worst_version": "",
                }}
                Think step by step. 
                In the "best_version" field, make sure the field is called "best_version", generate the most polite version of the sentence in question while keeping the same overall meaning.
                In the "worst_version" field, make sure the field is called "worst_version",generate the least polite version of the sentence in question while keeping the same overall meaning.
            """,
        },
        "empathy": {
            "parameters": ["context"],
            "content": """
                Act like a doctor who is coaching new medical students on using empathy during patient interviews.
                This is a transcript from one of your student's that needs coaching: [{context}],
                HCP stands for Health Care Provider. Student lines start with "D"
                If you can, find areas where you can coach the student doctor (lines starting with "D") on becoming more empathetic.
                Please provide your response in the following JSON format:
                {{
                    "think_step_by_step": "thinking process",
                    "empathetic_examples": [list integers representing empathetic lines from transcript],
                    "coaching_tips": "written summary of coaching tips"
                }}
                Think step by step in the "think_step_by_step" field.
                Find and remember all areas from the transcript in which the student was empathetic.
                Provide the line numbers for ALL instances where the student exhibited empathy.
                If there are no empathetic examples, return an empty list.
                Place the empathetic line numbers in the "empathetic_examples" field.
                In the "coaching_tips" field, when giving feedback, if/when you reference lines directly, use only lines that you noted in the "empathetic_examples".
                Otherwise, you can provide generalized/overall feedback as necessary to improve the student performance.
            """,
        },
        "empathy_scoring": {
            "parameters": ["sentence"],
            "content": """
                Act like a doctor who is coaching new medical students on using empathy during patient interviews.
                This is a line in a transcript from one of your student's that needs coaching: [{sentence}],
                Please provide your response in the following JSON format:
                {{
                    "best_version": "",
                    "worst_version": "",
                }}
                Think step by step. 
                In the "best_version" field, make sure the field is called "best_version", generate the most polite version of the sentence in question while keeping the same overall meaning.
                In the "worst_version" field, make sure the field is called "worst_version",generate the least polite version of the sentence in question while keeping the same overall meaning.
            """,
        },
    }
)
