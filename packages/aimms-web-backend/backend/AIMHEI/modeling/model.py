import datetime
import json
import asyncio
from statistics import mean, stdev
from .helper_functions import gpt4, cos_sim_scoring
import platform
from pathlib import Path
import os


class Model:

    def __init__(
        self,
        prepared_obj: object,
        model: str = None,
        criteria_path: str = str(Path("data/scoring_criteria.json")),
        custom_criteria_dict: dict = None,
        verbose: bool = False,
    ):
        if "Windows" not in platform.system():
            criteria_path = criteria_path.replace("\\", "/")

        self.verbose = verbose
        self.prepared_obj = prepared_obj
        self.file_name = prepared_obj.file_name
        self.transcript = prepared_obj.transcript
        self.med_terms = prepared_obj.prepared_med_terms
        # Use the model parameter if provided, otherwise fall back to environment variable or default
        self.ai_model = model or os.getenv("OPENAI_MODEL", "gpt-4o")
        self.criteria_path = criteria_path
        os.environ["OPENAI_MODEL"] = self.ai_model  # Set for helper functions

        # Use custom criteria if provided, otherwise load from file
        if custom_criteria_dict:
            self.criteria_dict = custom_criteria_dict
        else:
            self.criteria_dict = Model.open_json(criteria_path)

    async def run(self):
        await self.fill_dict_values()
        # self.create_json(f'data/initial.json')
        self.scoring(self.criteria_dict)
        # self.create_json()  # create stored json of scoring outputs for testing

    # def create_json(self, file_path: str = None, json_data: dict = None) -> json:
    #     """
    #     json_data [default = self.criteria_dict]
    #     """
    #     if file_path is None:
    #         formatted_time = datetime.datetime.now().strftime("%b_%d-%I_%M%p").lower()
    #         file_path = f"data/outputs/{self.file_name}-{formatted_time}.json"
    #     if json_data is None:
    #         json_data = self.criteria_dict

    #     file_path = file_path.replace("data/outputs/", "")
    #     with open(file_path, "w") as json_file:
    #         json.dump(json_data, json_file, indent=4)

    def open_json(criteria_path: str) -> dict:
        with open(criteria_path, "r") as file:
            return json.load(file)

    async def fill_dict_values(self) -> dict:
        """
        Takes a dictionary with questions in key and an empty values.\n
        Fills that [criteria_dict] with answers to each key in each value\n
        criteria_dict [default = self.criteria_dict]
        """
        try:
            await self.information_scoring()
        except:
            print(
                f"INFORMATION SCORING:\t\t\t\tTotal Computations = {0}\t\t\tyes/no = {0} | reference = {0}"
            )
        try:
            await self.skill_scoring()
        except Exception as e: # Catch specific Exception and log it
            print(f"ERROR during skill_scoring: {e}") # Log the error
            import traceback
            traceback.print_exc() # Print the full traceback for details
            pass # Keep pass for now, but logging is added

    async def information_scoring(self):
        yes_no_questions = [
            (section, question)
            for section, criteria in self.criteria_dict["Information Section"].items()
            for question, answer in criteria.items()
            if not answer
        ]
        reference_questions = [
            (section, question, answer[11:])
            for section, criteria in self.criteria_dict["Information Section"].items()
            for question, answer in criteria.items()
            if answer
        ]

        # Process yes_no_questions first
        yes_no_tasks = [
            gpt4.generate_response_async(
                "yes_no",
                context=self.transcript,
                criteria=question,
                verbose=self.verbose,
            )
            for section, question in yes_no_questions
        ]

        yes_no_responses = await asyncio.gather(*yes_no_tasks)

        for response, (section, question) in zip(yes_no_responses, yes_no_questions):
            self.criteria_dict["Information Section"][section][question] = response

        # Then, process reference_questions
        reference_tasks = [
            gpt4.generate_response_async(
                "yes_no_reference_answer",
                context=self.transcript,
                criteria=question,
                reference_answer=self.criteria_dict["Information Section"][section][
                    reference_question
                ],
                verbose=self.verbose,
            )
            for section, question, reference_question in reference_questions
        ]
        reference_responses = await asyncio.gather(*reference_tasks)

        for response, (section, question, _) in zip(
            reference_responses, reference_questions
        ):
            self.criteria_dict["Information Section"][section][question] = response

    async def skill_scoring(self):
        yes_no_questions = [
            criteria
            for criteria, answer in self.criteria_dict["Skill Section"].items()
            if not answer and "?" in criteria
        ]
        reference_questions = [
            criteria
            for criteria, answer in self.criteria_dict["Skill Section"].items()
            if answer
        ]

        # Process yes_no_questions first
        yes_no_tasks = [
            gpt4.generate_response_async(
                "yes_no",
                context=self.transcript,
                criteria=question,
                verbose=self.verbose,
            )
            for section, question in yes_no_questions
        ]
        yes_no_responses = await asyncio.gather(*yes_no_tasks)

        for response, (section, question) in zip(yes_no_responses, yes_no_questions):
            self.criteria_dict["Skill Section"][section][question] = response

        # Then, process reference_questions
        reference_tasks = [
            gpt4.generate_response_async(
                "yes_no_reference_answer",
                context=self.transcript,
                criteria=question,
                reference_answer=self.criteria_dict["Skill Section"][section][
                    reference_question
                ],
                verbose=self.verbose,
            )
            for section, question, reference_question in reference_questions
        ]
        reference_responses = await asyncio.gather(*reference_tasks)

        for response, (section, question, _) in zip(
            reference_responses, reference_questions
        ):
            self.criteria_dict["Skill Section"][section][question] = response

        for key in self.criteria_dict["Skill Section"]:
            if key == "Medical Terminology Scoring":
                self.criteria_dict["Skill Section"][key] = await self.med_term_scoring()
            elif key == "Politeness Scoring":
                await self.politeness_scoring(self.criteria_dict["Skill Section"], key)
            elif key == "Empathy Scoring":
                await self.empathy_scoring(self.criteria_dict["Skill Section"], key)
            else:
                pass

    async def med_term_scoring(self) -> dict:
        output_dict = {}
        terms_found, possible_definitions = self.med_terms
        tasks = []

        # Creating a task for each term without awaiting immediately
        for med_term_info in terms_found:
            term, actual_definition, line_num, line, context = med_term_info
            task = (
                term,
                line_num,
                line,
                context,
                gpt4.generate_response_async(
                    "med_terms",
                    term=term,
                    actual_definition=actual_definition,
                    context=context,
                    verbose=self.verbose,
                ),
            )
            tasks.append(task)

        # Awaiting all tasks concurrently and collecting results
        results = await asyncio.gather(*(t[4] for t in tasks))

        # Correctly processing the results
        for (term, line_num, line, context), result in zip(
            [(t[0], t[1], t[2], t[3]) for t in tasks], results
        ):
            output_dict[term] = result
            output_dict[term]["line_num"] = line_num
            output_dict[term]["line"] = line
            output_dict[term]["context"] = context

        return output_dict

    async def politeness_scoring(self, criteria_dict, key):
        # Initial request to get politeness examples
        criteria_dict[key] = await gpt4.generate_response_async(
            "politeness", context=self.transcript, verbose=self.verbose
        )
        polite_lines = self.get_line_from_nums(
            criteria_dict[key]["polite_examples"], self.transcript
        )
        criteria_dict[key]["scoring_details"] = {}

        tasks = []
        # Create tasks for each polite sentence to get scoring details
        for sentence in polite_lines:
            task = gpt4.generate_response_async(
                "politeness_scoring", sentence=sentence, verbose=self.verbose
            )
            tasks.append(task)

        # Await all tasks concurrently
        results = await asyncio.gather(*tasks)

        # Process results to populate scoring_details
        for count, (sentence, result) in enumerate(zip(polite_lines, results), 1):
            item_one = {"original": sentence}
            item_two_three = result.copy()

            # Assuming result has at least two keys to rename
            keys = list(item_two_three.keys())
            if len(keys) >= 2:
                first_key, second_key = keys[:2]
                # Rename and assign the values to new keys
                item_two_three["best_version"] = item_two_three.pop(first_key)
                item_two_three["worst_version"] = item_two_three.pop(second_key)
            else:
                # Default assignment if not enough keys are present
                item_two_three["best_version"] = item_two_three["worst_version"] = None

            # Merge and assign to criteria_dict
            polite_example_num = criteria_dict[key]["polite_examples"][
                count - 1
            ]  # Adjusted index to match enumerate starting at 1
            criteria_dict[key]["scoring_details"][polite_example_num] = {
                **item_one,
                **item_two_three,
            }

        cos_scores = cos_sim_scoring.calculate_cosine_scores(criteria_dict[key])
        for line_num, cosine_score in cos_scores.items():
            if line_num in criteria_dict[key]["scoring_details"]:
                criteria_dict[key]["scoring_details"][line_num][
                    "cosine_score"
                ] = cosine_score

    async def empathy_scoring(self, criteria_dict, key):
        # Initial request for empathy examples
        criteria_dict[key] = await gpt4.generate_response_async(
            "empathy", context=self.transcript, verbose=self.verbose
        )
        empathy_lines = self.get_line_from_nums(
            criteria_dict[key]["empathetic_examples"], self.transcript
        )
        criteria_dict[key]["scoring_details"] = {}

        tasks = []
        # Create tasks for each empathy scoring call
        for sentence in empathy_lines:
            task = gpt4.generate_response_async(
                "empathy_scoring", sentence=sentence, verbose=self.verbose
            )
            tasks.append(task)

        # Await all tasks concurrently
        results = await asyncio.gather(*tasks)

        # Process results to populate scoring_details
        for count, (sentence, result) in enumerate(zip(empathy_lines, results), 2):
            item_one = {"original": sentence}
            item_two_three = result.copy()

            # Check for at least two keys to rename
            keys = list(item_two_three.keys())
            if len(keys) >= 2:
                first_key, second_key = keys[:2]
                # Rename the first and second keys
                item_two_three["best_version"] = item_two_three.pop(first_key)
                item_two_three["worst_version"] = item_two_three.pop(second_key)
            else:
                # Default assignment if not enough keys are present
                item_two_three["best_version"] = item_two_three["worst_version"] = None

            # Merge and assign to criteria_dict
            empathetic_example_num = criteria_dict[key]["empathetic_examples"][
                count - 2
            ]  # Adjusted index to match enumerate starting at 2
            criteria_dict[key]["scoring_details"][empathetic_example_num] = {
                **item_one,
                **item_two_three,
            }

        cos_scores = cos_sim_scoring.calculate_cosine_scores(criteria_dict[key])
        for line_num, cosine_score in cos_scores.items():
            if line_num in criteria_dict[key]["scoring_details"]:
                criteria_dict[key]["scoring_details"][line_num][
                    "cosine_score"
                ] = cosine_score

    def get_line_from_nums(self, line_nums: list, transcript: list = None) -> list:
        """
        Takes list of line numbers and the transcript (comma separated list), returns a list of the lines.
        Safely handles out-of-range line numbers by filtering them out.
        """
        if transcript is None:
            transcript = self.transcript
        
        if not transcript or not line_nums:
            return []

        # Filter out invalid line numbers
        valid_line_nums = [num for num in line_nums if isinstance(num, (int, float)) and 1 <= num <= len(transcript)]
        
        # Take only the first 10 valid line numbers to prevent excessive processing
        valid_line_nums = valid_line_nums[:10]
        
        output = []
        for line_num in valid_line_nums:
            try:
                output.append(transcript[int(line_num) - 1])
            except (IndexError, ValueError, TypeError):
                continue  # Skip any problematic indices
                
        return output

    def scoring(self, criteria_dict: dict):
        """
        Calculates the standard deviation and averages for the politeness and empathy sections using a completed criteria dictionary.
        """
        for criteria, response in criteria_dict["Skill Section"].items():
            if "scoring_details" in response:
                scores = [
                    item["cosine_score"]
                    for item in response["scoring_details"].values()
                    if "cosine_score" in item
                ]
                if len(scores) > 1:
                    average_score = mean(scores)
                    standard_deviation = stdev(scores)
                    criteria_dict["Skill Section"][criteria]["scoring"] = {
                        "average": f"{average_score:.2f}",
                        "standard_deviation": f"{standard_deviation:.2f}",
                    }
                elif scores:
                    criteria_dict["Skill Section"][criteria]["scoring"] = {
                        "average": scores[0],
                        "standard_deviation": "0",
                    }  # ONLY 1 SCORE SO CANT COMPUTE STANDARD DEVIATION
                else:
                    # No valid scores found, provide default values
                    criteria_dict["Skill Section"][criteria]["scoring"] = {
                        "average": "0.00",
                        "standard_deviation": "0.00",
                    }
                
                # Reorder keys to put scoring and scoring_details at the end
                current_dict = criteria_dict["Skill Section"][criteria]
                reordered_dict = {}
                
                # Add all keys except 'scoring' and 'scoring_details' first
                for k, v in current_dict.items():
                    if k not in ["scoring", "scoring_details"]:
                        reordered_dict[k] = v
                
                # Add 'scoring' and 'scoring_details' at the end if they exist
                if "scoring" in current_dict:
                    reordered_dict["scoring"] = current_dict["scoring"]
                if "scoring_details" in current_dict:
                    reordered_dict["scoring_details"] = current_dict["scoring_details"]
                    
                criteria_dict["Skill Section"][criteria] = reordered_dict
