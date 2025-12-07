import { describe, it, expect, vi } from "vitest"
import { createRef } from "react"
import dayjs from "dayjs"

// Now import after mocks
import { render, screen, fireEvent } from "@testing-library/react"
import { UploadPanel } from "../UploadPanel"
import type { AIMHEIConfig, ValidationErrors } from "../../hooks/useAIMHEIConfig"

// Mock StyledFormComponents - MUST be before component import
vi.mock("../../../../../components/StyledFormComponents", () => ({
  FormSectionHeader: ({ icon, title, subtitle }: any) => (
    <div>
      {icon}
      <h3>{title}</h3>
      <p>{subtitle}</p>
    </div>
  ),
}))

// Mock FileDropzone
vi.mock("./FileDropzone", () => ({
  FileDropzone: ({ title, subtitle, file, error, onFileSelect, onRemove }: any) => (
    <div>
      <p>{title}</p>
      <p>{subtitle}</p>
      {file && (
        <div>
          <span>{file.name}</span>
          <button onClick={onRemove}>Remove</button>
        </div>
      )}
      {!file && <button onClick={onFileSelect}>Select File</button>}
      {error && <span>{error}</span>}
    </div>
  ),
}))

// Mock ConfigurationForm
vi.mock("./ConfigurationForm", () => ({
  ConfigurationForm: ({ config }: any) => (
    <div>
      <label>Report Name</label>
      <input value={config.report_name} readOnly aria-label="Report Name" />
      <label>Clinical Supervisor</label>
      <input value={config.human_supervisor} readOnly aria-label="Clinical Supervisor" />
      <label>Patient ID</label>
      <input value={config.patient_id} readOnly aria-label="Patient ID" />
    </div>
  ),
}))

const mockConfig: AIMHEIConfig = {
  report_name: "Test Report",
  interview_date: "2024-01-15",
  human_supervisor: "Dr. Smith",
  aispe_location: "Hospital A",
  hcp_name: "Dr. Jones",
  hcp_year: "2024",
  patient_id: "P12345",
  model: "gpt-4o",
}

describe("UploadPanel", () => {
  const defaultProps = {
    transcriptFile: null,
    isDragOver: false,
    fileInputRef: createRef<HTMLInputElement>(),
    validationErrors: {} as ValidationErrors,
    handleDragOver: vi.fn(),
    handleDragLeave: vi.fn(),
    handleDrop: vi.fn(),
    handleFileSelect: vi.fn(),
    handleFileChange: vi.fn(),
    removeFile: vi.fn(),
    useCustomCriteria: false,
    setUseCustomCriteria: vi.fn(),
    criteriaFile: null,
    isCriteriaDragOver: false,
    criteriaFileInputRef: createRef<HTMLInputElement>(),
    handleCriteriaDragOver: vi.fn(),
    handleCriteriaDragLeave: vi.fn(),
    handleCriteriaDrop: vi.fn(),
    handleCriteriaFileSelect: vi.fn(),
    handleCriteriaFileChange: vi.fn(),
    removeCriteriaFile: vi.fn(),
    config: mockConfig,
    interviewDate: dayjs("2024-01-15"),
    processing: false,
    processingProgress: 0,
    processingMessage: "",
    jobId: null,
    error: null,
    updateConfig: vi.fn(),
    setInterviewDate: vi.fn(),
    processTranscript: vi.fn(),
  }

  describe("Panel header", () => {
    it("should render panel title", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByText("Configuration")).toBeInTheDocument()
      expect(screen.getByText("Upload & Settings")).toBeInTheDocument()
    })

    it("should render divider", () => {
      const { container } = render(<UploadPanel {...defaultProps} />)

      const divider = container.querySelector('[class*="MuiDivider-root"]')
      expect(divider).toBeInTheDocument()
    })
  })

  describe("File upload section", () => {
    it("should render transcript file dropzone", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByText("Transcript Upload")).toBeInTheDocument()
      expect(screen.getByText("Drop transcript file here")).toBeInTheDocument()
    })

    it("should render hidden file input", () => {
      const { container } = render(<UploadPanel {...defaultProps} />)

      const inputs = container.querySelectorAll('input[type="file"]')
      const transcriptInput = Array.from(inputs).find((input) =>
        input.getAttribute("accept")?.includes("text/plain")
      )

      expect(transcriptInput).toBeInTheDocument()
      expect(transcriptInput).toHaveStyle({ display: "none" })
    })

    it("should show uploaded file when transcriptFile is provided", () => {
      const file = new File(["test content"], "test.txt", { type: "text/plain" })

      render(<UploadPanel {...defaultProps} transcriptFile={file} />)

      expect(screen.getByText("test.txt")).toBeInTheDocument()
    })
  })

  describe("Custom criteria section", () => {
    it("should render custom criteria checkbox", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByText(/Use Custom Scoring Criteria/i)).toBeInTheDocument()
    })

    it("should call setUseCustomCriteria when checkbox is clicked", () => {
      const setUseCustomCriteria = vi.fn()
      render(<UploadPanel {...defaultProps} setUseCustomCriteria={setUseCustomCriteria} />)

      const checkbox = screen.getByRole("checkbox", { name: /Use Custom Scoring Criteria/i })
      fireEvent.click(checkbox)

      expect(setUseCustomCriteria).toHaveBeenCalledWith(true)
    })

    it("should show criteria dropzone when useCustomCriteria is true", () => {
      render(<UploadPanel {...defaultProps} useCustomCriteria />)

      expect(screen.getByText("Custom Scoring Criteria")).toBeInTheDocument()
      expect(screen.getByText("Drop criteria.json here")).toBeInTheDocument()
    })

    it("should not show criteria dropzone when useCustomCriteria is false", () => {
      render(<UploadPanel {...defaultProps} useCustomCriteria={false} />)

      expect(screen.queryByText("Custom Scoring Criteria")).not.toBeInTheDocument()
      expect(screen.queryByText("Drop criteria.json here")).not.toBeInTheDocument()
    })

    it("should render hidden criteria file input when useCustomCriteria is true", () => {
      const { container } = render(<UploadPanel {...defaultProps} useCustomCriteria />)

      const inputs = container.querySelectorAll('input[type="file"]')
      const criteriaInput = Array.from(inputs).find((input) =>
        input.getAttribute("accept")?.includes("json")
      )

      expect(criteriaInput).toBeInTheDocument()
      expect(criteriaInput).toHaveStyle({ display: "none" })
    })

    it("should call removeCriteriaFile when unchecking custom criteria", () => {
      const removeCriteriaFile = vi.fn()
      render(
        <UploadPanel {...defaultProps} useCustomCriteria removeCriteriaFile={removeCriteriaFile} />
      )

      const checkbox = screen.getByRole("checkbox", { name: /Use Custom Scoring Criteria/i })
      fireEvent.click(checkbox)

      expect(removeCriteriaFile).toHaveBeenCalledTimes(1)
    })
  })

  describe("Configuration section", () => {
    it("should render configuration section header", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByText("Analysis Configuration")).toBeInTheDocument()
      expect(screen.getByText("Configure the AI analysis parameters")).toBeInTheDocument()
    })

    it("should render configuration form", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByLabelText(/Report Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Clinical Supervisor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Patient ID/i)).toBeInTheDocument()
    })

    it("should pass config to ConfigurationForm", () => {
      render(<UploadPanel {...defaultProps} />)

      expect(screen.getByDisplayValue("Test Report")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument()
      expect(screen.getByDisplayValue("P12345")).toBeInTheDocument()
    })
  })

  describe("Layout and scrolling", () => {
    it("should have scrollable content area", () => {
      const { container } = render(<UploadPanel {...defaultProps} />)

      const scrollableBox = container.querySelector('[class*="MuiBox-root"]')
      expect(scrollableBox).toBeInTheDocument()
    })

    it("should use Paper component as container", () => {
      const { container } = render(<UploadPanel {...defaultProps} />)

      const paper = container.querySelector('[class*="MuiPaper-root"]')
      expect(paper).toBeInTheDocument()
    })
  })

  describe("Processing state", () => {
    it("should render when processing", () => {
      const { container } = render(<UploadPanel {...defaultProps} processing />)

      // ConfigurationForm is mocked, just verify UploadPanel renders
      expect(container).toBeInTheDocument()
    })

    it("should render when error exists", () => {
      const { container } = render(<UploadPanel {...defaultProps} error="Test error" />)

      // ConfigurationForm is mocked, just verify UploadPanel renders
      expect(container).toBeInTheDocument()
    })
  })

  describe("Validation errors", () => {
    it("should pass validation errors to FileDropzone", () => {
      const validationErrors: ValidationErrors = {
        file: "File is required",
      }

      render(<UploadPanel {...defaultProps} validationErrors={validationErrors} />)

      expect(screen.getByText("File is required")).toBeInTheDocument()
    })

    it("should pass validation errors to ConfigurationForm", () => {
      const validationErrors: ValidationErrors = {
        report_name: "Report name is required",
      }

      render(<UploadPanel {...defaultProps} validationErrors={validationErrors} />)

      expect(screen.getByText("Report name is required")).toBeInTheDocument()
    })
  })
})
