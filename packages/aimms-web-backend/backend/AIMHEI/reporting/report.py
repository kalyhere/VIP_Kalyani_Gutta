import asyncio
import datetime
import time
import os
import subprocess
import traceback
import glob
import platform
import tempfile
import logging
import platform
from io import StringIO
from .helper_functions import async_summary_report_ai

logger = logging.getLogger(__name__)


def get_latex_content():
    if platform.system() == "Darwin":  # macOS
        font_command = r"\newcommand{\setmainfontcustom}{\setmainfont{Georgia}}"
    else:  # Linux or other OS
        font_command = r"\newcommand{\setmainfontcustom}{\setmainfont{DejaVu Serif}}"

    with open('backend/AIMHEI/data/AIMHEI_REPORT_TEMPLATE.tex', 'r', encoding='utf-8') as template_file:
        latex_template = template_file.read()

    # Insert the font command after the \documentclass line
    latex_content = latex_template.replace(
        r'\documentclass[11pt]{article}',
        r'\documentclass[11pt]{article}' + '\n' + font_command
    )
    return latex_content


class AIMHEI_report_variables:
    def __init__(self):
        self.HCP_name = "HCP_NAME"
        self.HCP_year = "HCP_YEAR"
        self.patient_ID = "PATIENT_ID"
        self.date_today = "DATE_TODAY"
        self.interview_date = "INTERVIEW_DATE"
        self.human_supervisor = "HUMAN_SUPERVISOR"
        self.adjective_score = "ADJECTIVE_SCORE"
        self.percentile_score = "PERCENTILE_SCORE"
        self.unacceptable_performance_areas = "UNACCEPTABLE_PERFORMANCE_AREAS"
        self.unacceptable_performance_items = "UNACCEPTABLE_PERFORMANCE_ITEMS"
        self.improvement_areas = "IMPROVEMENT_AREAS"
        self.strengths_weaknesses = None  # Will be populated with structured data
        self.AIMES = None  # LaTeX string for PDF, populated by get_async_AIMES()
        self.AIMES_table = None  # LaTeX table for PDF
        self.info_section_points_earned = "INFO_SECTION_POINTS_EARNED"
        self.info_section_points_missed = "INFO_SECTION_POINTS_MISSED"
        self.skill_section_points_earned = "SKILL_SECTION_POINTS_EARNED"
        self.skill_section_points_missed = "SKILL_SECTION_POINTS_MISSED"
        self.points_awarded = "POINTS_AWARDED"
        self.points_total = "POINTS_TOTAL"
        self.points_percentage = "POINTS_PERCENTAGE"
        self.section_score_1 = "SECTION_SCORE_1"
        self.section_score_2 = "SECTION_SCORE_2"
        self.section_score_3 = "SECTION_SCORE_3"
        # WRITE-UP VARIABLES
        self.aispe_location = "AISPE_LOCATION"
        self.source_and_setting = "SOURCE_AND_SETTING"
        self.chief_complaint = "CHIEF_COMPLAINT"
        self.history_of_present_illness = "HISTORY_OF_PRESENT_ILLNESS"
        self.medical_history = "MEDICAL_HISTORY"
        self.hospitalizations = "HOSPITALIZATIONS"
        self.surgical_history = "SURGICAL_HISTORY"
        self.medications = "MEDICATIONS"
        self.allergies = "ALLERGIES"
        self.family_history = "FAMILY_HISTORY"
        self.social_history = "SOCIAL_HISTORY"
        self.habits = "HABITS"
        self.recreational_drug_use = "RECREATIONAL_DRUG_USE"
        self.alcohol_intake = "ALCOHOL_INTAKE"
        self.lifestyle = "LIFESTYLE"
        self.sexual_history = "SEXUAL_HISTORY"
        self.constitutional = "CONSTITUTIONAL"
        self.HEENT = "HEENT"
        self.cardiovascular = "CARDIOVASCULAR"
        self.respiratory = "RESPIRATORY"
        self.gastrointestinal = "GASTROINTESTINAL"
        self.musculoskeletal = "MUSCULOSKELETAL"
        self.hematological = "HEMATOLOGICAL"
        self.endocrinology = "ENDOCRINOLOGY"
        self.mental_status = "MENTAL_STATUS"

    def tex(self, attr_name, colored: bool = False, var_brackets: bool = True):
        if hasattr(self, attr_name):
            if (
                attr_name == "AIMES"
                or attr_name == "AIMES_table"
                or attr_name == "unacceptable_performance_items"
            ):
                colored = False
                value = getattr(self, attr_name)
                if var_brackets:
                    old = "\\var{\{" + attr_name.replace("_", "\_").lower() + "\}}"
                else:
                    old = "\\var{" + attr_name.replace("_", "\_").lower() + "}"
                # Don't lowercase these specific attributes
                new = value.replace("_", "\_")
                return old, new
                
            value = getattr(self, attr_name)
            if var_brackets:
                old = "\\var{\{" + attr_name.replace("_", "\_").lower() + "\}}"
            else:
                old = "\\var{" + attr_name.replace("_", "\_").lower() + "}"
            if colored:
                new = "\\var{" + value.replace("_", "\_") + "}"
            else:
                new = value.replace("_", "\_").lower()
            return old, new
        else:
            print(f"Attribute {attr_name} not found.")


class AIMHEI_obj:
    def __init__(
        self,
        output: str,
        criteria: str,
        explanation: str,
        line_nums: list,
        lines: list,
        section_title: str,
    ):
        self.output = output
        self.criteria = criteria
        self.explanation = explanation
        self.line_nums = line_nums
        self.lines = lines
        self.section_title = section_title


class Report:
    def __init__(
        self,
        prepared_transcript: list,
        modeled_dict: dict,
        initial_json_parameters: dict,
    ):
        self.transcript = prepared_transcript
        self.criteria_dict = modeled_dict
        self.initial_json_parameters = initial_json_parameters
        self.AIMHEI = AIMHEI_report_variables()
        
        # Format interview_date if it exists in parameters
        if 'interview_date' in initial_json_parameters and initial_json_parameters['interview_date']:
            try:
                # Parse the input date (assuming it's in a standard format like YYYY-MM-DD)
                date_obj = datetime.datetime.strptime(initial_json_parameters['interview_date'], '%Y-%m-%d')
                # Format it like date_today
                initial_json_parameters['interview_date'] = date_obj.strftime('%b %d, %Y')
            except ValueError:
                logger.warning(f"Could not parse interview_date: {initial_json_parameters['interview_date']}")
        
        # Set AIMHEI variables from parameters
        for var, val in self.initial_json_parameters.items():
            if hasattr(self.AIMHEI, var) and val is not None:
                setattr(self.AIMHEI, var, str(val))

        self.info_section = self.criteria_dict["Information Section"]
        self.skill_section = self.criteria_dict["Skill Section"]
        self.AIMHEI_objs = self.generate_AIMHEI_objs()
        self.section_summaries = self.get_section_summaries()
        self.formatted_section_summaries = self.get_formatted_summary_report()
        self.AIMHEI.date_today = datetime.date.today().strftime("%b %d, %Y")

    def generate_AIMHEI_objs(self):
        """
        outputs a list of AIMHEI_objs
        """
        AIMHEI_objs = []
        # INFORMATION SECTION
        for section in self.info_section.keys():
            for criteria, response in self.info_section[section].items():
                output = response["answer"]
                explanation = response["explanation"]
                source = response["line_numbers"]
                source_lines = self.get_line_from_nums(source)
                row = [output, criteria, explanation, source, source_lines, section]
                AIMHEI_objs.append(AIMHEI_obj(*row))

        # SKILL SECTION
        for criteria in self.skill_section.keys():
            if criteria == "Medical Terminology Scoring":
                row = self.medical_reporting(criteria)
                AIMHEI_objs.append(AIMHEI_obj(*row))
            elif criteria == "Politeness Scoring":
                row = self.politeness_reporting(criteria)
                AIMHEI_objs.append(AIMHEI_obj(*row))
            elif criteria == "Empathy Scoring":
                row = self.empathy_reporting(criteria)
                AIMHEI_objs.append(AIMHEI_obj(*row))
            else:
                response = self.skill_section[criteria]
                output = response["answer"]
                explanation = response["explanation"]
                source = response["line_numbers"]
                source_lines = self.get_line_from_nums(source)
                row = [
                    output,
                    criteria,
                    explanation,
                    source,
                    source_lines,
                    f"{list(dict(self.criteria_dict))[1]}: Rephrasing",
                ]
                AIMHEI_objs.append(AIMHEI_obj(*row))

        return AIMHEI_objs

    def get_line_from_nums(self, line_nums: list, transcript: list = None) -> list:
        """
        Takes list of line numbers and the transcript (comma separated list), returns a list of the lines
        """
        if transcript is None:
            transcript = self.transcript
        
        # Add debugging and error handling
        print(f"REPORT: get_line_from_nums called with line_nums: {line_nums}")
        print(f"REPORT: transcript type: {type(transcript)}, length: {len(transcript) if hasattr(transcript, '__len__') else 'N/A'}")
        
        # Ensure transcript is a list
        if isinstance(transcript, str):
            print(f"REPORT: WARNING - transcript is a string, converting to list")
            transcript = transcript.split('\n')
            print(f"REPORT: After split, transcript length: {len(transcript)}")
        
        output = []
        try:
            for line_num in line_nums:
                print(f"REPORT: Accessing line_num: {line_num}, type: {type(line_num)}")
                if isinstance(line_num, (int, float)) and 1 <= line_num <= len(transcript):
                    output.append(transcript[int(line_num) - 1])
                else:
                    print(f"REPORT: WARNING - Invalid line_num: {line_num}, transcript length: {len(transcript)}")
                    output.append(f"[Invalid line reference: {line_num}]")
        except Exception as e:
            print(f"REPORT: Error in get_line_from_nums: {str(e)}")
            print(f"REPORT: line_nums: {line_nums}, transcript type: {type(transcript)}")
            if hasattr(transcript, '__len__'):
                print(f"REPORT: transcript length: {len(transcript)}")
            if transcript:
                print(f"REPORT: first few transcript items: {transcript[:3] if len(transcript) >= 3 else transcript}")
            raise
        
        return output

    def medical_reporting(self, criteria_name: str):
        explanation = ""
        line_nums = []
        yes_count = 0
        no_count = 0

        # Sort the items first by 'yes/no' and then by 'line_num' in explanation
        sorted_items = sorted(
            self.skill_section[criteria_name].items(),
            key=lambda item: (item[1]["answer"], item[1]["line_num"]),
        )

        for term, response in sorted_items:
            temp_explanation = f'Term: {term}\nExplained: {response["answer"]}\nSource: {response["line_num"]}\nContext: {response["context"]}\nRationale: {response["explanation"]}\n\n'
            explanation += temp_explanation
            if response["line_num"] not in line_nums:
                line_nums.append(response["line_num"])
            if response["answer"].lower() == "yes":
                yes_count += 1
            else:
                no_count += 1

        explanation = explanation.replace('"', '""')
        source_lines = self.get_line_from_nums(line_nums)
        output = f"Y:{yes_count}/N:{no_count}"
        data = (
            output,
            criteria_name,
            f'"{explanation}"',
            line_nums,
            source_lines,
            f"{list(dict(self.criteria_dict))[1]}: {criteria_name}",
        )
        return data

    def politeness_reporting(self, criteria_name: str):
        response = self.skill_section[criteria_name]
        polite_lines = []
        for line_num in response["scoring_details"].values():
            polite_lines.append(line_num["original"])
        data = (
            f'AVG:{response["scoring"]["average"]}/SD:{response["scoring"]["standard_deviation"]}',
            "Politeness Scoring",
            response["coaching_tips"],
            response["polite_examples"],
            polite_lines,
            f"{list(dict(self.criteria_dict))[1]}: {criteria_name}",
        )
        return data

    def empathy_reporting(self, criteria_name: str):
        response = self.skill_section[criteria_name]
        empathetic_lines = []
        for line_num in response["scoring_details"].values():
            empathetic_lines.append(line_num["original"])
        data = (
            f'AVG:{response["scoring"]["average"]}/SD:{response["scoring"]["standard_deviation"]}',
            "Empathy Scoring",
            response["coaching_tips"],
            response["empathetic_examples"],
            empathetic_lines,
            f"{list(dict(self.criteria_dict))[1]}: {criteria_name}",
        )
        return data

    def generate_rubric_json(self) -> list[dict]:
        """
        Generates a list of dictionaries representing the rubric details,
        suitable for JSON serialization.
        """
        rubric_data = []
        attributes_to_include = [
            "output",
            "criteria",
            "explanation",
            "line_nums",
            "lines",
            "section_title",
        ]

        for obj in self.AIMHEI_objs:
            item_data = {attr: getattr(obj, attr, None) for attr in attributes_to_include}
            # Optional: Clean or format data further if needed, e.g., ensure lists are lists
            item_data['line_nums'] = list(item_data.get('line_nums', []))
            item_data['lines'] = list(item_data.get('lines', []))
            rubric_data.append(item_data)

        return rubric_data

    def generate_rubric(
        self,
    ) -> str:
        rubric_content = []

        for obj in self.AIMHEI_objs:
            attributes = [
                "output",
                "criteria",
                "explanation",
                "line_nums",
                "lines",
                "section_title",
            ]
            row = [getattr(obj, attr) for attr in attributes]
            rubric_content.append("\t".join(map(str, row)))

        return "\n".join(rubric_content)

        # self.rubric_txt.append(row)
        # file_path = file_path.replace("data/outputs/", "")
        # file_path = "data/outputs/" + file_path
        # if filetype == "txt":
        #     with open(f"{file_path}.txt", "w", encoding="utf-8") as file:
        #         for row in self.rubric_txt:
        #             file.write("\t".join(map(str, row)) + "\n")
        # if filetype == "csv":
        #     # Using CSV module to write data
        #     with open(f"{file_path}.csv", "w", newline="", encoding="utf-8") as file:
        #         writer = csv.writer(file)
        #         # Write the header
        #         writer.writerow(
        #             [
        #                 "Output",
        #                 "Criteria",
        #                 "Explanation",
        #                 "Source",
        #                 "Source Lines" "Section",
        #             ]
        #         )
        #         # Write the data
        #         for obj in self.AIMHEI_objs:
        #             attributes = [
        #                 "output",
        #                 "criteria",
        #                 "explanation",
        #                 "line_nums",
        #                 "lines",
        #                 "section_title",
        #             ]
        #             row = [getattr(obj, attr) for attr in attributes]
        #             file.write("\t".join(map(str, row)) + "\n")
        # else:
        #     pass

    def get_section_summaries(self) -> dict:
        """
        ouputs dictionary containing -> section titles : {values = "yes":int, "no":int, "percentage_correct":int}
        """
        # Create a dictionary to keep track of counts and percentages
        section_summaries = {}

        for obj in self.AIMHEI_objs:
            # Initialize the section in the dictionary if not already present
            if obj.section_title not in section_summaries:
                section_summaries[obj.section_title] = {"yes": 0, "no": 0}

            # Update counts
            if obj.output.lower() in ["yes", "no"]:
                section_summaries[obj.section_title][obj.output.lower()] += 1

        # remove sections with no responses for yes, no like empathy and polite
        section_summaries = {
            section: counts
            for section, counts in section_summaries.items()
            if counts["yes"] > 0 or counts["no"] > 0
        }

        # Calculate the percentage correct for each section
        for section, counts in section_summaries.items():
            total_responses = counts["yes"] + counts["no"]
            percentage_correct = round((counts["yes"] / total_responses) * 100, 2)
            section_summaries[section]["percentage_correct"] = percentage_correct

        return section_summaries

    def get_formatted_summary_report(self) -> str:
        section_summaries = self.section_summaries
        # Find the maximum length of section titles
        max_title_length = max(len(title) for title in section_summaries.keys())

        # Determine the maximum lengths for each data type
        max_correct_length = max(
            len(str(val["yes"])) for val in section_summaries.values()
        )
        max_incorrect_length = max(
            len(str(val["no"])) for val in section_summaries.values()
        )
        max_fraction_length = max(
            len(f"{val['yes']}/{val['yes'] + val['no']}")
            for val in section_summaries.values()
        )
        max_percentage_length = max(
            len(f"{val['percentage_correct']:.2f}%")
            for val in section_summaries.values()
        )

        output = ""
        for section_title, val in section_summaries.items():
            total_criteria = val["yes"] + val["no"]
            correct = f"{val['yes']}"
            incorrect = f"{val['no']}"
            fraction = f"{val['yes']}/{total_criteria}"
            percentage = f"{val['percentage_correct']:.2f}%"

            # Format the title with dashes
            title_with_dashes = (
                f"{section_title}{'-' * (max_title_length - len(section_title))}"
            )

            # Format the output line with consistent width for each data type
            output += f"{title_with_dashes}| {correct: >{max_correct_length}} Correct | {incorrect: >{max_incorrect_length}} Incorrect | {fraction: >{max_fraction_length}} | {percentage: >{max_percentage_length}}\n"
        return output + "\n"

    def get_section_data(AIMHEI_objs: list, section_title: str):
        output = []
        for obj in AIMHEI_objs:
            if obj.section_title == section_title:
                output.append(f"ANSWER: {obj.output}, QUESTION: {obj.criteria}")
        return output

    def get_unacceptable_errors(self):
        criteria_unacceptable_to_miss = [
            "Did the HCP give their first name?",
            "Did the HCP give their last name?",
            "Did the HCP give their title?",
            "Did the HCP explain the purpose of their visit?",
            "Did the HCP ask or confirm the patient's first name?",
            "Did the HCP ask or confirm the patient's last name?",
            "Did the HCP ask or confirm the patient's DOB?",
            # "Did the HCP ask or confirm the patient's medical record number?",
            "Did the HCP ask the patient to provide a list or listing of all prescription medications they were taking?",
        ]
        output = []
        for obj in self.AIMHEI_objs:
            if obj.criteria in criteria_unacceptable_to_miss:
                if obj.output.lower() == "no":
                    output.append(obj.criteria)
        if not output:
            output.append("No areas of unacceptable performance.")
            self.AIMHEI.unacceptable_performance_areas = (
                "no areas of unacceptable performance"
            )
        else:
            self.AIMHEI.unacceptable_performance_areas = (
                "areas of unacceptable performance"
            )
        return ", ".join(output)

    async def get_async_AIMES(
        self,
        threshold_percentage: int = 60,
        verbose: bool = False,
        strengths_weaknesses: bool = True,
    ) -> str:
        total_time = time.time()
        tasks = []
        responses = []
        improvement_areas_output = []
        strengths_weaknesses_data = {}

        for section_title, val in self.section_summaries.items():
            if val["percentage_correct"] <= threshold_percentage:
                if verbose:
                    improvement_areas_output.append(
                        section_title + ": (" + str(val["percentage_correct"]) + "\\%)"
                    )

                if strengths_weaknesses:
                    task = async_summary_report_ai.generate_response(
                        section_title,
                        Report.get_section_data(self.AIMHEI_objs, section_title),
                        verbose=verbose,
                    )
                    tasks.append(task)
        if tasks:
            responses = await asyncio.gather(*tasks)

        output = ""

        if responses and len(responses) > 0:
            for response, section_title in responses:
                # Skip if there was an error in this response
                if "error" in response:
                    continue

                # Store structured data for database
                strengths_weaknesses_data[section_title] = {
                    "strengths": response["strengths"],
                    "weaknesses": response["weaknesses"],
                    "coaching_tips": response["coaching_tips"]
                }

                # Generate LaTeX output for PDF
                output += f"\\needspace{{4\\baselineskip}}\centerline{{\\textbf{{{section_title.upper()}}}}}\\vspace{{-5pt}}\centerline{{\\rule{{10cm}}{{0.4pt}}}}"
                output += (
                    f'\\noindent\\textbf{{STRENGTHS:}}\\\\{response["strengths"]}\\\\'
                )
                output += (
                    f'\\noindent\\textbf{{WEAKNESSES:}}\\\\{response["weaknesses"]}\\\\'
                )
                output += f'\\noindent\\textbf{{OVERALL:}}\\\\{response["coaching_tips"]}\\\\[20pt]'
        else:
            if not strengths_weaknesses:
                output = "strengths_weaknesses turned off"
            else:
                output = "No sections met the criteria for further analysis."

        total_time = time.time() - total_time
        if verbose:
            print(f"Total processing time: {total_time} seconds")

        if improvement_areas_output:
            self.AIMHEI.improvement_areas = ", ".join(improvement_areas_output)

        # Store structured data for database access
        self.AIMHEI.strengths_weaknesses = strengths_weaknesses_data if strengths_weaknesses_data else None

        return output

    def get_AIMES_table(self):
        subtotal_yes = 0
        subtotal_no = 0
        total_yes = 0
        total_no = 0
        output = ""
        try:
            for key, value in self.section_summaries.items():
                if "&" in key:
                    key = key.replace("&", "\&")
                if ": " in key:
                    key = key.split(": ")[1]
                output += f'{key} & {value["yes"]} & {value["no"]} & {value["yes"] + value["no"]} & {value["percentage_correct"]}\\%\\\\\n'
                subtotal_yes += value["yes"]
                subtotal_no += value["no"]

            subtotal_percentage = round(
                (subtotal_yes / (subtotal_yes + subtotal_no)) * 100, 2
            )
            output += f"\hline\n \\textbf{{\\hfill Sub Totals}} & \\textbf{{{subtotal_yes}}} & \\textbf{{{subtotal_no}}} & \\textbf{{{subtotal_yes + subtotal_no}}} & \\textbf{{{subtotal_percentage}\%}} \\\\ \hline\n"
            output += "\multicolumn{5}{c}{} \\\\[-1ex]\n"
            output += "\hline\n \\textbf{Skill Section} & \\textbf{Correct} & \\textbf{Incorrect} & \\textbf{Total} & \\textbf{Percentage} \\\\ \hline\n"
            total_yes += subtotal_yes
            total_no += subtotal_no

            self.AIMHEI.info_section_points_earned = str(subtotal_yes)
            self.AIMHEI.info_section_points_missed = str(subtotal_no)

            subtotal_yes = 0
            subtotal_no = 0
            for obj in self.AIMHEI_objs:
                if obj.criteria == "Medical Terminology Scoring":
                    med_term_yes = int(obj.output.split("/")[0].split(":")[1])
                    med_term_no = int(obj.output.split("/")[1].split(":")[1])
                    subtotal_no = med_term_no
                    if med_term_yes == 0 and subtotal_no == 0:
                        subtotal_yes = 10
                    else:
                        subtotal_yes = med_term_yes / (med_term_yes + subtotal_no) * 10
                    if subtotal_no == 0 and subtotal_yes >= 0:
                        percentage_correct = 100
                    else:
                        percentage_correct = round(subtotal_yes * 10, 2)
                    output += f"{obj.criteria} & {round(subtotal_yes,2)} & {obj.output} & 10 & {percentage_correct}\\%\\\\\n"
                if (
                    obj.criteria == "Politeness Scoring"
                    or obj.criteria == "Empathy Scoring"
                ):
                    avg = obj.output.split("/")[0].split(":")[1]
                    sd = obj.output.split("/")[1].split(":")[1]
                    output += f"{obj.criteria} & {avg} & SD:{sd} & 10 & {round(float(avg)*10,2)}\\%\\\\\n"
                    subtotal_yes += float(avg)

            skill_sect_total = 30
            subtotal_no = round(skill_sect_total - subtotal_yes, 2)
            total_yes += subtotal_yes
            total_no += subtotal_no
            total_percentage = subtotal_percentage * 0.5  # previous section subtotal
            subtotal_percentage = round(
                (subtotal_yes / (skill_sect_total)) * 100, 2
            )  # updates for new section subtotal
            total_percentage += subtotal_percentage * 0.5

            output += f"\hline\n \\textbf{{\\hfill Sub Totals}} & \\textbf{{{round(subtotal_yes,2)}}} & \\textbf{{{subtotal_no}}} & \\textbf{{{skill_sect_total}}} & \\textbf{{{subtotal_percentage}\%}} \\\\ \hline\n"
            output += "\multicolumn{5}{c}{} \\\\[-1ex]\n\hline"
            output += f"\\multicolumn{{4}}{{|l|}}{{\\textbf{{Total Score}}}} & \\textbf{{{round(total_percentage,2)}\%}} \\\\\n"

            self.AIMHEI.points_percentage = (
                "weighted: " + str(round(total_percentage, 2)) + "\\%"
            )
            self.AIMHEI.adjective_score = self.get_percentage_adj(
                round(total_percentage, 2)
            )
            self.AIMHEI.skill_section_points_earned = str(round(subtotal_yes, 2))
            self.AIMHEI.skill_section_points_missed = str(round(subtotal_no, 2))
            self.AIMHEI.points_awarded = str(
                round(
                    float(self.AIMHEI.info_section_points_earned)
                    + float(self.AIMHEI.skill_section_points_earned),
                    2,
                )
            )
            self.AIMHEI.points_total = str(
                round(
                    float(self.AIMHEI.points_awarded)
                    + float(
                        float(self.AIMHEI.info_section_points_missed)
                        + float(self.AIMHEI.skill_section_points_missed)
                    ),
                    2,
                )
            )
            return output
        except Exception as e:
            traceback.print_exc()
            return "Sections & 0 & 0 & 0 & 0\\\\"

    def fill_tex_vars(self, output, template_path, var_brackets=True):
        with open(template_path, "r", encoding="utf-8") as template_file:
            template = template_file.read()

        # Replace variables from self
        # for var, value in self.__dict__.items():
        #     if var != "AIMHEI":  # Skip AIMHEI to handle separately
        #         if var_brackets:
        #             old = f"[{var}]"
        #             # template = template.replace(f"[{var}]", str(value))
        #         else:
        #             old = f"{var}"
        #             # template = template.replace(f"{var}", str(value))
        #         new = str(value)
        #         template = template.replace(old, new)

        attributes = [
            attr
            for attr in dir(self.AIMHEI)
            if not attr.startswith("__") and not callable(getattr(self.AIMHEI, attr))
        ]
        #
        # with open(template_path, "r") as file:
        #     latex_file_contents = file.read()
        #
        for attr in attributes:
            old, new = self.AIMHEI.tex(attr, colored=True, var_brackets=var_brackets)
            template = template.replace(old, new)
            # template = template.replace(
            #     *self.AIMHEI.tex(attr, colored=True, var_brackets=var_brackets)
            # )

        # with open(file_path, "w") as output:
        #     output.write(latex_file_contents)
        #
        # return file_path
        output.write(template)

    def compile_latex_to_pdf(self, latex_content: str) -> bytes:
        with tempfile.TemporaryDirectory() as tmpdir:
            input_file = os.path.join(tmpdir, "input.tex")
            with open(input_file, "w") as f:
                f.write(latex_content)

            # Run pdflatex twice to ensure proper compilation of references
            for i in range(2):
                try:
                    result = subprocess.run(
                        [
                            "xelatex",
                            "-interaction=nonstopmode",
                            "-output-directory",
                            tmpdir,
                            input_file,
                        ],
                        capture_output=True,
                        text=True,
                        check=True,
                        cwd=tmpdir,  # set the working directory
                        # stdout=subprocess.DEVNULL,
                        # stderr=subprocess.DEVNULL,
                    )
                    logger.info(f"LaTex compilation {i+1} successful")
                    logger.debug(f"LaTex compilation {i+1} output: {result.stdout}")
                except subprocess.CalledProcessError as e:
                    logger.error(f"LaTex compilation {i+1} failed")
                    logger.error(f"Command: {e.cmd}")
                    logger.error(f"Return code: {e.returncode}")
                    logger.error(f"stdout: {e.stdout}")
                    logger.error(f"stderr: {e.stderr}")
                    raise Exception(f"PDF compilation failed: {str(e)}")

            pdf_file = os.path.join(tmpdir, "input.pdf")
            if os.path.exists(pdf_file):
                with open(pdf_file, "rb") as f:
                    return f.read()
            else:
                logger.error(f"PDF file not found at {pdf_file}")
                raise Exception("PDF compilation failed: output file not found")

    async def generate_AIMHEI_report(
        self,
        strengths_weaknesses: bool = True,
    ) -> bytes:

        # Only call get_async_AIMES if it hasn't been called yet
        if not hasattr(self.AIMHEI, 'AIMES') or self.AIMHEI.AIMES is None:
            self.AIMHEI.AIMES = await self.get_async_AIMES(
                strengths_weaknesses=strengths_weaknesses
            )

        self.AIMHEI.AIMES_table = self.get_AIMES_table()
        self.AIMHEI.unacceptable_performance_items = self.get_unacceptable_errors()

        output = StringIO()
        self.fill_tex_vars(output, "backend/AIMHEI/data/AIMHEI_REPORT_TEMPLATE.tex")

        latex_content = output.getvalue()
        output.close()

        # Get the LaTeX content with the appropriate font command
        latex_content_with_font = get_latex_content()

        # Ensure the placeholders are filled correctly
        latex_content = latex_content_with_font.replace(
            latex_content_with_font.split('\n', 1)[1], latex_content.split('\n', 1)[1]
        )

        return self.compile_latex_to_pdf(latex_content)

        # async def generate_AISPE(
        #     self,
        #     output_filename,
        #     file_path: str = "data\AISPE.tex",
        #     output_directory: str = "data\outputs",
        # ) -> str:
        #
        #     async def use_rubric():
        #         if not hasattr(self, "rubric_txt"):
        #             self.rubric_txt = self.generate_rubric(filetype=None)
        #
        #         response = await gpt4.generate_response_async(
        #             template_type="rubric",
        #             verbose=False,
        #             context=self.rubric_txt,
        #             interview_date=self.AIMHEI.interview_date,
        #             aispe_location=self.AIMHEI.aispe_location,
        #         )
        #
        #         # assign_vars(response)
        #         # self.fill_tex_vars(
        #         #     file_path, str(Path("data/AISPE_TEMPLATE.tex")), var_brackets=False
        #         # )
        #         # Report.compile_tex("AISPE-R", file_path, output_directory)
        #
        #         return response
        #
        #     async def use_transcript():
        #         response = await gpt4.generate_response_async(
        #             "transcript",
        #             verbose=False,
        #             context=self.transcript,
        #             interview_date=self.AIMHEI.interview_date,
        #             aispe_location=self.AIMHEI.aispe_location,
        #         )
        #
        #         # assign_vars(response)
        #         # self.fill_tex_vars(
        #         #     file_path, str(Path("data/AISPE_TEMPLATE.tex")), var_brackets=False
        #         # )
        #         # Report.compile_tex("AISPE-T", file_path, output_directory)
        #
        #         return response
        #
        #     async def use_both():
        #         response = await gpt4.generate_response_async(
        #             "both",
        #             verbose=False,
        #             transcript_response=self.transcript_response,
        #             rubric_response=self.rubric_response,
        #             interview_date=self.AIMHEI.interview_date,
        #             aispe_location=self.AIMHEI.aispe_location,
        #         )
        #
        #         # assign_vars(response)
        #         # self.fill_tex_vars(
        #         #     file_path, str(Path("data/AISPE_TEMPLATE.tex")), var_brackets=False
        #         # )
        #         # Report.compile_tex(output_filename + "-AISPE", file_path, output_directory)
        #         return response
        #
        #     response = await use_both()  # or use_rubric() or use_transcript()

        # Use StringIO to capture the content instead of writing to a file
        # output = StringIO()
        # self.fill_tex_vars(output, "data/AISPE_TEMPLATE.tex", var_brackets=False)

        # Get the content as a string
        # aispe_content = output.getvalue()
        # output.close()
        # return aispe_content

        # You might want to compile the LaTeX content to PDF here
        # For now, we'll just return the LaTeX content
        # latex_content = output.getvalue()
        # output.close()
        #
        # return self.compile_latex_to_pdf(latex_content)

        # def assign_vars(response):
        #     self.AIMHEI.source_and_setting = response["source_and_setting"]
        #     self.AIMHEI.chief_complaint = response["chief_complaint"]
        #     self.AIMHEI.history_of_present_illness = response[
        #         "history_of_present_illness"
        #     ]
        #     self.AIMHEI.medical_history = response["medical_history"]
        #     self.AIMHEI.hospitalizations = response["hospitalizations"]
        #     self.AIMHEI.surgical_history = response["surgical_history"]
        #     self.AIMHEI.medications = response["medications"]
        #     self.AIMHEI.allergies = response["allergies"]
        #     self.AIMHEI.family_history = response["family_history"]
        #     self.AIMHEI.social_history = response["social_history"]
        #     self.AIMHEI.habits = response["habits"]
        #     self.AIMHEI.recreational_drug_use = response["recreational_drug_use"]
        #     self.AIMHEI.alcohol_intake = response["alcohol_intake"]
        #     self.AIMHEI.lifestyle = response["lifestyle"]
        #     self.AIMHEI.sexual_history = response["sexual_history"]
        #     self.AIMHEI.constitutional = response["constitutional"]
        #     self.AIMHEI.HEENT = response["HEENT"]
        #     self.AIMHEI.cardiovascular = response["cardiovascular"]
        #     self.AIMHEI.respiratory = response["respiratory"]
        #     self.AIMHEI.gastrointestinal = response["gastrointestinal"]
        #     self.AIMHEI.musculoskeletal = response["musculoskeletal"]
        #     self.AIMHEI.hematological = response["hematological"]
        #     self.AIMHEI.endocrinology = response["endocrinology"]
        #     self.AIMHEI.mental_status = response["mental_status"]
        #
        # self.rubric_response = await use_rubric()
        # self.transcript_response = await use_transcript()
        # await use_both()

    @staticmethod
    def get_percentage_adj(percentage):
        if 0 <= percentage <= 49.9:
            return "poor"
        elif 50 <= percentage <= 59.9:
            return "marginal"
        elif 60 <= percentage <= 69.9:
            return "fair"
        elif 70 <= percentage <= 79.9:
            return "good"
        elif 80 <= percentage <= 89.9:
            return "very good"
        elif 90 <= percentage <= 100:
            return "excellent"
        else:
            return "Invalid percentage"

    def compile_tex(
        output_filename, file_path: str, output_directory: str = "data\outputs"
    ):
        if "Windows" not in platform.system():
            output_directory = str(output_directory).replace("\\", "/")
            file_path = file_path.replace("\\", "/")

        # Ensure the LaTeX file exists
        if not os.path.exists(file_path):
            print(f"The file {file_path} does not exist.")
            return

        # Ensure the output directory exists or create it
        if not os.path.exists(output_directory):
            os.makedirs(output_directory)

        # Construct the full output path
        full_output_path = os.path.join(output_directory, output_filename)

        try:
            # output_filename_without_path = str(output_filename).replace(
            #     "data/uploads/", ""
            # )
            # Compile the LaTeX file with XeLaTeX and specify the output filename

            # raise Exception(output_directory, output_filename_without_path, file_path)
            with open(os.devnull, "w") as devnull:
                # TODO: make this log to a file so you can debug it better
                h = subprocess.run(
                    [
                        "xelatex",
                        "-output-directory=" + f"{output_directory}",
                        "-jobname=" + f"{output_filename}",
                        file_path,
                    ],
                    cwd=os.getcwd(),
                    capture_output=True,
                    timeout=60,
                )
                # subprocess.check_call(
                #     [
                #         "xelatex",
                #         "-output-directory=" + f"'{output_directory}'",
                #         "-jobname=" + f"'{output_filename_without_path}'",
                #         file_path,
                #     ],
                #     stdout=devnull,
                #     stderr=devnull,
                # )

        except subprocess.CalledProcessError as e:
            print(f"Error during LaTeX compilation: {e}")
            return

        except Exception as e:
            print(f"An unexpected error occurred: {e}")
            return

        finally:
            # Clean up auxiliary files
            cleanup_extensions = ["*.aux", "*.log", "*.out", "*.toc"]
            for ext in cleanup_extensions:
                for file in glob.glob(os.path.join(output_directory, ext)):
                    os.remove(file)
