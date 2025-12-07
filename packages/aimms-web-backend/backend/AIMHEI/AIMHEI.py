import structlog
from io import BytesIO
from .modeling import Model
from .preparing import Prepare
from .reporting import Report
from .utility.decorators import time_measurement
import os

structlog.configure(
    processors=[structlog.processors.JSONRenderer()],
    logger_factory=structlog.PrintLoggerFactory(),
)
logger = structlog.get_logger()


class AIMHEI:
    def __init__(
        self,
        json_data: dict,
        transcript_input: BytesIO,
        file_name=None,
        is_test_mode=False,
        skip_pdf=False,
        custom_criteria=None,
    ) -> None:
        self.reported = None
        self.modeled = None
        self.prepared = None
        self.is_test_mode = is_test_mode
        self.skip_pdf = skip_pdf
        self.file_name = file_name
        self.json_data = json_data
        self.transcript_input = transcript_input
        self.formatting_process = self.json_data["formatting_process"]
        self.model = self.json_data["model"]
        self.custom_criteria = custom_criteria  # Store custom criteria if provided

    @time_measurement("Preparing")
    def prepare(self) -> None:
        self.prepared = Prepare(
            self.file_name, self.transcript_input, self.formatting_process or "default"
        )
        self.prepared.generate_formatted_transcript(self.file_name)

    @time_measurement("Modeling")
    async def model_data(self) -> None:
        # Use custom criteria if provided, otherwise load from file
        if self.custom_criteria:
            # Custom criteria provided as dict - pass directly to Model
            print(f"AIMHEI: Using CUSTOM criteria (dict keys: {list(self.custom_criteria.keys())})")
            self.modeled = Model(
                self.prepared,
                self.model or "gpt-4o",
                custom_criteria_dict=self.custom_criteria,
                verbose=False,
            )
        else:
            # Load criteria from default file path
            criteria_path = (
                "backend/AIMHEI/data/testing/test_scoring_criteria.json"
                if self.is_test_mode
                else "backend/AIMHEI/data/scoring_criteria.json"
            )
            print(f"AIMHEI: Using DEFAULT criteria from: {criteria_path}")

            self.modeled = Model(
                self.prepared,
                self.model or "gpt-4o",
                criteria_path=criteria_path,
                verbose=False,
            )

        await self.modeled.run()

    @time_measurement("Reporting")
    async def generate_reports(
        self, transcript=None, criteria_dict=None, strengths_weaknesses=True
    ) -> dict:
        if transcript is None:
            transcript = self.prepared.transcript

        self.reported = Report(
            transcript,
            criteria_dict or self.modeled.criteria_dict,
            self.json_data,
        )
        rubric_content = self.reported.generate_rubric_json()

        # Generate strengths/weaknesses analysis (needed for both PDF and database)
        if strengths_weaknesses:
            await self.reported.get_async_AIMES(strengths_weaknesses=True)

        # Conditionally generate PDF based on skip_pdf flag
        if self.skip_pdf:
            print("AIMHEI: Skipping PDF generation for faster web processing")
            aimhei_report_content = None
        else:
            print("AIMHEI: Generating PDF report")
            aimhei_report_content = await self.reported.generate_AIMHEI_report(
                strengths_weaknesses=strengths_weaknesses
            )

        # Kyle: "we might need it in a year" -Oct 2, 2024
        # aispe_content = (
        #     await self.reported.generate_AISPE(self.file_name)
        #     if not self.is_test_mode
        #     else None
        # )

        return {
            "aimhei_report": aimhei_report_content,
            "rubric": rubric_content,
            "strengths_weaknesses": self.reported.AIMHEI.strengths_weaknesses,
            # "aispe": aispe_content,
        }

    @time_measurement("AIMHEI Run")
    async def run(self) -> dict:
        try:
            print(f"AIMHEI: Current working directory: {os.getcwd()}")
            print(f"AIMHEI: Files in current directory: {os.listdir('.')}")
            print(f"AIMHEI: Backend directory exists: {os.path.exists('backend')}")
            if os.path.exists('backend'):
                print(f"AIMHEI: Backend contents: {os.listdir('backend')}")
            print(f"AIMHEI: AIMHEI directory exists: {os.path.exists('backend/AIMHEI')}")
            if os.path.exists('backend/AIMHEI'):
                print(f"AIMHEI: AIMHEI contents: {os.listdir('backend/AIMHEI')}")
            
            print("AIMHEI: Starting prepare() step...")
            self.prepare()
            print(f"AIMHEI: Prepare completed. Transcript type: {type(self.prepared.transcript)}, length: {len(self.prepared.transcript) if hasattr(self.prepared, 'transcript') else 'N/A'}")
            print(f"AIMHEI: First few transcript lines: {self.prepared.transcript[:3] if hasattr(self.prepared, 'transcript') and self.prepared.transcript else 'N/A'}")
            
            print("AIMHEI: Starting model_data() step...")
            await self.model_data()
            print(f"AIMHEI: Model data completed. Criteria dict keys: {list(self.modeled.criteria_dict.keys()) if hasattr(self.modeled, 'criteria_dict') else 'N/A'}")
            
            print("AIMHEI: Starting generate_reports() step...")
            result = await self.generate_reports(
                transcript=self.prepared.transcript,
                criteria_dict=self.modeled.criteria_dict,
                strengths_weaknesses=True,
            )
            print("AIMHEI: Generate reports completed successfully")
            return result
        except Exception as e:
            print(f"AIMHEI: Error in run() method: {str(e)}")
            print(f"AIMHEI: Error type: {type(e)}")
            import traceback
            print(f"AIMHEI: Full traceback: {traceback.format_exc()}")
            raise

    @time_measurement("Test Run")
    async def test_run(self) -> dict:
        with open(
            "backend/AIMHEI/data/testing/allan_deana-formatted_transcript.txt", "r"
        ) as file:
            file_contents = file.read()
            test_transcript = file_contents.split("\n")
            return await self.generate_reports(
                transcript=test_transcript,
                criteria_dict=Model.open_json(
                    "backend/AIMHEI/data/testing/allan_deana-sep_05-09_20am.json"
                ),
                strengths_weaknesses=False,
            )
