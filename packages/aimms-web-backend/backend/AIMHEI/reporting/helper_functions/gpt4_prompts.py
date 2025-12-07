class PromptDict(dict):
    def __getitem__(self, key):
        try:
            return super().__getitem__(key)
        except KeyError:
            raise ValueError(f"Invalid template type: {key}")


prompts = PromptDict(
    {
        "transcript": {
            "parameters": ["context", "interview_date", "aispe_location"],
            "content": """
            This is a transcript between a health care provider and a patient [{context}],
            You will be writing a formal history write-up of the patient as if you were the health care provider.
            Avoid using pronouns when referencing the patient.
            Please provide your response in the following JSON format:
            {{
                "source_and_setting": "",
                "chief_complaint": "",
                "history_of_present_illness": "",
                "medical_history": "",
                "hospitalizations": "",
                "surgical_history": "",
                "medications": "",
                "allergies": "",
                "family_history": "",
                "social_history": "",
                "habits": "",
                "recreational_drug_use": "",
                "alcohol_intake": "",
                "lifestyle": "",
                "sexual_history": "",
                "constitutional": "",
                "HEENT": "",
                "cardiovascular": "",
                "respiratory": "",
                "gastrointestinal": "",
                "musculoskeletal": "",
                "hematological": "",
                "endocrinology": "",
                "mental_status": ""
            }}
            DO NOT make up any false information and explicitly only reference the transcript provided for your answers.
            For each response with sufficient data: provide all/any of line numbers that relate to the task in a simple bracketed list like this [1, 2, 3] following your written response.
            If the data is not sufficient: Determine if the appropriate response is "Patient reports no problems with "section in question"" wherein the HCP did query the patient but there was no issue, in which case you should provide the line numbers wherein that dialog took place or "No inquiry" meaning the HCP did not ask about it.
            If the appropriate response is "Patient reports no problems with "section in question"" or "No inquiry" simply write what is in quotes and nothing else (unless its "Patient reports no problems with "section in question"" then also provied the line numbers as described above)
            
            Think step by step and and fill in the appropriate fields of the JSON as follows: 
            source_and_setting = History obtained from patient in the "make this Title Case->{aispe_location}" on {interview_date}.
            chief_complaint = write the chief complaint using the same phrasing that the patient used in quotes like this: The patient "if the patient's full name is known, place patient initials here as an appositive phrase" presents with the following chief complaint: "complaint here"
            history_of_present_illness = 
            medical_history = 
            hospitalizations = 
            surgical_history = 
            medications = 
            allergies = 
            family_history = 
            social_history = 
            habits = 
            recreational_drug_use = 
            alcohol_intake = 
            lifestyle = 
            sexual_history = 
            constitutional = 
            HEENT = in this section, provide the write-up with appropriate information given that HEENT stands for and checks all information pertaining to the patient's “head, eyes, ears, nose, and throat.”
            cardiovascular = 
            respiratory = 
            gastrointestinal = 
            musculoskeletal = 
            hematological = 
            endocrinology = 
            mental_status = 
        """,
        },
        "rubric": {
            "parameters": ["context", "interview_date", "aispe_location"],
            "content": """
            This is a scored rubric of a conversation between a health care provider and a patient [{context}],
            The columns represent the following in order: OUTPUT	CRITERIA	EXPLANATION	SOURCE #s	SOURCE LINES	SECTION
            You will be writing a formal history write-up of the patient as if you were the health care provider.
            Avoid using pronouns when referencing the patient.
            Please provide your response in the following JSON format:
            {{
                "source_and_setting": "",
                "chief_complaint": "",
                "history_of_present_illness": "",
                "medical_history": "",
                "hospitalizations": "",
                "surgical_history": "",
                "medications": "",
                "allergies": "",
                "family_history": "",
                "social_history": "",
                "habits": "",
                "recreational_drug_use": "",
                "alcohol_intake": "",
                "lifestyle": "",
                "sexual_history": "",
                "constitutional": "",
                "HEENT": "",
                "cardiovascular": "",
                "respiratory": "",
                "gastrointestinal": "",
                "musculoskeletal": "",
                "hematological": "",
                "endocrinology": "",
                "mental_status": ""
            }}
            DO NOT make up any false information and explicitly only reference the rubric provided for your answers.
            For each response with sufficient data: provide all/any of line numbers FROM the "SOURCE LINES" column that relate to the task in a simple bracketed list like this [1, 2, 3] following your written response.
            If the data is not sufficient: Determine if the appropriate response is "Patient reports no problems with "section in question"" wherein the HCP did query the patient but there was no issue, in which case you should provide the line numbers wherein that dialog took place or "No inquiry" meaning the HCP did not ask about it.
            If the appropriate response is "Patient reports no problems with "section in question"" or "No inquiry" simply write what is in quotes and nothing else (unless its "Patient reports no problems with "section in question"" then also provied the line numbers as described above)

            Think step by step and and fill in the appropriate fields of the JSON as follows: 
            source_and_setting = History obtained from patient in the "make this Title Case->{aispe_location}" on {interview_date}.
            chief_complaint = write the chief complaint using the same phrasing that the patient used in quotes like this: The patient "if the patient's full name is known, place patient initials here as an appositive phrase" presents with the following chief complaint: "complaint here"
            history_of_present_illness = 
            medical_history = 
            hospitalizations = 
            surgical_history = 
            medications = 
            allergies = 
            family_history = 
            social_history = 
            habits = 
            recreational_drug_use = 
            alcohol_intake = 
            lifestyle = 
            sexual_history = 
            constitutional = 
            HEENT = in this section, provide the write-up with appropriate information given that HEENT stands for and checks all information pertaining to the patient's “head, eyes, ears, nose, and throat.”
            cardiovascular = 
            respiratory = 
            gastrointestinal = 
            musculoskeletal = 
            hematological = 
            endocrinology = 
            mental_status = 
        """,
        },
        "both": {
            "parameters": [
                "transcript_response",
                "rubric_response",
                "interview_date",
                "aispe_location",
            ],
            "content": """
            Your are analyzing two JSON outputs corresponding to the same summary of a patient encounter in a healthcare setting.
            Both outputs were given the same intrustions and tasks for filling out the response that you will also receive below.
            You will look at both outputs and make a comprehensive summary that includes information that one response might have missed over the other.
            Here is response 1: [{transcript_response}]
            Here is response 2: [{rubric_response}]
            Below is the instructions given to both responses you are analyzing as well as the instructions you need to follow:

            You will be writing a formal history write-up of the patient as if you were the health care provider.
            Avoid using pronouns when referencing the patient.
            Please provide your response in the following JSON format:
            {{
                "source_and_setting": "",
                "chief_complaint": "",
                "history_of_present_illness": "",
                "medical_history": "",
                "hospitalizations": "",
                "surgical_history": "",
                "medications": "",
                "allergies": "",
                "family_history": "",
                "social_history": "",
                "habits": "",
                "recreational_drug_use": "",
                "alcohol_intake": "",
                "lifestyle": "",
                "sexual_history": "",
                "constitutional": "",
                "HEENT": "",
                "cardiovascular": "",
                "respiratory": "",
                "gastrointestinal": "",
                "musculoskeletal": "",
                "hematological": "",
                "endocrinology": "",
                "mental_status": ""
            }}
            DO NOT make up any false information and explicitly only reference the transcript/rubric provided for your answers.
            For each response with sufficient data: provide all/any of line numbers that relate to the task in a simple bracketed list like this [1, 2, 3] following your written response.
            If the data is not sufficient: Determine if the appropriate response is "Patient reports no problems with "section in question"" wherein the HCP did query the patient but there was no issue, in which case you should provide the line numbers wherein that dialog took place or "No inquiry" meaning the HCP did not ask about it.
            If the appropriate response is "Patient reports no problems with "section in question"" or "No inquiry" simply write what is in quotes and nothing else (unless its "Patient reports no problems with "section in question"" then also provied the line numbers as described above)
            
            Think step by step and and fill in the appropriate fields of the JSON as follows: 
            source_and_setting = History obtained from patient in the "make this Title Case->{aispe_location}" on {interview_date}.
            chief_complaint = write the chief complaint using the same phrasing that the patient used in quotes like this: The patient "if the patient's full name is known, place patient initials here as an appositive phrase" presents with the following chief complaint: "complaint here"
            history_of_present_illness = 
            medical_history = 
            hospitalizations = 
            surgical_history = 
            medications = 
            allergies = 
            family_history = 
            social_history = 
            habits = 
            recreational_drug_use = 
            alcohol_intake = 
            lifestyle = 
            sexual_history = 
            constitutional = 
            HEENT = in this section, provide the write-up with appropriate information given that HEENT stands for and checks all information pertaining to the patient's “head, eyes, ears, nose, and throat.”
            cardiovascular = 
            respiratory = 
            gastrointestinal = 
            musculoskeletal = 
            hematological = 
            endocrinology = 
            mental_status = 
        """,
        },
    }
)
