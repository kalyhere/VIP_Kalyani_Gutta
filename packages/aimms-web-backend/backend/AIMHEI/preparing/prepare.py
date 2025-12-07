from io import BytesIO

import structlog

from .helper_functions import (
    formatting_process_canada_database,
    formatting_process_google_recorder,
    formatting_process_sonix,
    med_terminology,
)

structlog.configure(
    processors=[structlog.processors.JSONRenderer()],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()


class Prepare:

    def __init__(
        self,
        file_name: str,
        transcript_input: BytesIO,
        formatting_process: str = "default",
        verbose: bool = False,
    ) -> None:
        """
        formatting_process: default (canada original database)
        formatting_process: google_recorder
        formatting_process: sonix
        formatting_process: none
        """
        self.file_name = file_name
        self.verbose = verbose
        self.transcript_input = transcript_input
        self.formatting_process = formatting_process
        self.transcript = self.format_txt()
        self.prepared_med_terms = self.finding_medical_terminology(self.transcript)
        self.transcript_tokens = self.estimate_total_tokens()

    def generate_formatted_transcript(
        self, file_name: str = "NEW", csvfile: bool = False
    ) -> None:
        """
        outputs file of specified type
        """
        try:
            if csvfile:
                pass
                # file_name = f"{file_name}-formatted_transcript.csv"
                # with open(file_name, "w", newline="", encoding="utf-8") as file:
                #     writer = csv.writer(file)
                #     for item in self.transcript:
                #         writer.writerow([item])
            else:
                pass
                # file_name = f"{file_name}-formatted_transcript.txt"
                # with open(file_name, "w", encoding="utf-8") as outfile:
                #     outfile.write("\n".join(self.transcript))
            if self.verbose:
                print(f"Created {file_name}.")
        except IOError as e:
            logger.error(f"Failed to write to file {file_name}: {e}")

    def format_txt(self) -> list:
        # Reset the BytesIO cursor to the beginning
        self.transcript_input.seek(0)

        # Read the content
        content = self.transcript_input.read().decode("utf-8")

        if self.formatting_process == "default":
            result = formatting_process_canada_database.format(content)
        elif self.formatting_process == "google_recorder":
            result = formatting_process_google_recorder.format(content)
        elif self.formatting_process == "sonix":
            result = formatting_process_sonix.format(content)
        elif self.formatting_process == "none":
            result = content.split("\n")
        else:
            raise ValueError("Invalid formatting process specified.")

        if self.verbose:
            print(f"Formatted transcript using {self.formatting_process} method.")

        return result

    def finding_medical_terminology(
        self, transcript: list, ama_glossary_path: str = "backend/AIMHEI/data/ama_no_lay_terms.csv"
    ) -> list:
        """
        returns two lists, medical_terms_used, possible_definitions_used.
        both contain medical term, actual definition, line_num, line, context around line
        (then possible definitions used follows that with cos sim score between definition and usage in line)
        """
        medical_terms_used, possible_definitions_used = (
            med_terminology.medical_terminology(transcript, ama_glossary_path)
        )

        # Dictionary to store unique terms with combined context
        unique_terms = {}
        for term, definition, line_num, line, context in medical_terms_used:
            if term not in unique_terms:
                unique_terms[term] = [definition, line_num, line, []]

            # Append new context lines while avoiding duplicates
            for ctx_line in context:
                if ctx_line not in unique_terms[term][3]:
                    unique_terms[term][3].append(ctx_line)

        # Convert to final list
        checked_for_dupes = [
            (term, data[0], data[1], data[2], data[3])
            for term, data in unique_terms.items()
        ]

        return checked_for_dupes, possible_definitions_used

    def estimate_total_tokens(self) -> int:
        """
        Estimates the total number of tokens in the formatted transcript based on the approximation
        that 1 token is roughly equivalent to 4 characters in English. This method provides a rough
        estimate and may not perfectly match OpenAI's token counts but offers a closer approximation
        for English text.
        """
        total_chars = sum(
            len(item) for item in self.transcript
        )  # Sum of all characters in the transcript
        total_tokens = (
            total_chars / 4
        )  # Approximating the total tokens based on the 1 token ≈ 4 chars rule
        if self.verbose:
            print(f"Estimated total tokens in the transcript: {total_tokens}")
        return int(total_tokens)  # Returning the total as an integer for simplicity
