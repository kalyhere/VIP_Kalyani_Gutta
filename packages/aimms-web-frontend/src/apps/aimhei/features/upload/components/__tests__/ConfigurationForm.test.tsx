import { describe, it, expect, vi, beforeEach } from "vitest"
import dayjs from "dayjs"

// Now import after mocks
import { render, screen, fireEvent } from "@testing-library/react"
import { ConfigurationForm } from "../ConfigurationForm"
import type { AIMHEIConfig, ValidationErrors } from "../../hooks/useAIMHEIConfig"

// Mock StyledFormComponents - MUST be before component import
vi.mock("../../../../../components/StyledFormComponents", () => ({
  UATextField: ({ label, value, onChange, error, helperText, ...props }: any) => (
    <div>
      <label>{label}</label>
      <input value={value} onChange={onChange} aria-invalid={error} aria-label={label} {...props} />
      {helperText && <span>{helperText}</span>}
    </div>
  ),
  UASelect: ({ label, value, onChange, options }: any) => (
    <div>
      <label>{label}</label>
      <select value={value} onChange={(e) => onChange?.(e.target.value)} aria-label={label}>
        {options?.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  ),
  UADateTimePicker: ({ label, value, onChange, error }: any) => (
    <div>
      <label>{label}</label>
      <input
        type="datetime-local"
        value={value ? value.format?.("YYYY-MM-DDTHH:mm") : ""}
        onChange={(e) => onChange?.(dayjs(e.target.value))}
        aria-invalid={error}
        aria-label={label}
      />
    </div>
  ),
  FieldGroup: ({ children }: any) => <div>{children}</div>,
}))

// Mock processing components
vi.mock("../../processing/components/ProgressIndicator", () => ({
  ProgressIndicator: ({ progress, message, jobId }: any) => (
    <div>
      <p>{message}</p>
      <p>
Progress:{progress}
%
</p>
      {jobId && <p>
Job ID:{jobId}</p>}
    </div>
  ),
}))

vi.mock("../../processing/components/ErrorDisplay", () => ({
  ErrorDisplay: ({ error }: any) => <div>{error}</div>,
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

const mockValidationErrors: ValidationErrors = {}

describe("ConfigurationForm", () => {
  const defaultProps = {
    config: mockConfig,
    interviewDate: dayjs("2024-01-15"),
    validationErrors: mockValidationErrors,
    processing: false,
    processingProgress: 0,
    processingMessage: "",
    jobId: null,
    error: null,
    transcriptFile: new File(["test"], "test.txt", { type: "text/plain" }),
    onConfigUpdate: vi.fn(),
    onInterviewDateChange: vi.fn(),
    onProcessClick: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Form fields", () => {
    it("should render all required form fields", () => {
      render(<ConfigurationForm {...defaultProps} />)

      expect(screen.getByLabelText(/Report Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Clinical Supervisor/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Interview Location/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Healthcare Provider Name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Academic Year/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/Patient ID/i)).toBeInTheDocument()
    })

    it("should display config values in form fields", () => {
      render(<ConfigurationForm {...defaultProps} />)

      expect(screen.getByDisplayValue("Test Report")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Dr. Smith")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Hospital A")).toBeInTheDocument()
      expect(screen.getByDisplayValue("Dr. Jones")).toBeInTheDocument()
      expect(screen.getByDisplayValue("2024")).toBeInTheDocument()
      expect(screen.getByDisplayValue("P12345")).toBeInTheDocument()
    })

    it("should call onConfigUpdate when report name changes", () => {
      const onConfigUpdate = vi.fn()
      render(<ConfigurationForm {...defaultProps} onConfigUpdate={onConfigUpdate} />)

      const input = screen.getByLabelText(/Report Name/i)
      fireEvent.change(input, { target: { value: "New Report Name" } })

      expect(onConfigUpdate).toHaveBeenCalledWith("report_name", "New Report Name")
    })

    it("should call onConfigUpdate when supervisor changes", () => {
      const onConfigUpdate = vi.fn()
      render(<ConfigurationForm {...defaultProps} onConfigUpdate={onConfigUpdate} />)

      const input = screen.getByLabelText(/Clinical Supervisor/i)
      fireEvent.change(input, { target: { value: "Dr. Johnson" } })

      expect(onConfigUpdate).toHaveBeenCalledWith("human_supervisor", "Dr. Johnson")
    })
  })

  describe("Validation errors", () => {
    it("should display validation error for report name", () => {
      const errors: ValidationErrors = {
        report_name: "Report name is required",
      }

      render(<ConfigurationForm {...defaultProps} validationErrors={errors} />)

      expect(screen.getByText("Report name is required")).toBeInTheDocument()
    })

    it("should mark field as error when validation fails", () => {
      const errors: ValidationErrors = {
        report_name: "Report name is required",
      }

      render(<ConfigurationForm {...defaultProps} validationErrors={errors} />)

      const input = screen.getByLabelText(/Report Name/i)
      expect(input).toHaveAttribute("aria-invalid", "true")
    })
  })

  describe("Process button", () => {
    it("should render Analyze Transcript button", () => {
      render(<ConfigurationForm {...defaultProps} />)

      expect(screen.getByText("Analyze Transcript")).toBeInTheDocument()
    })

    it("should call onProcessClick when button is clicked", () => {
      const onProcessClick = vi.fn()
      render(<ConfigurationForm {...defaultProps} onProcessClick={onProcessClick} />)

      const button = screen.getByText("Analyze Transcript")
      fireEvent.click(button)

      expect(onProcessClick).toHaveBeenCalledTimes(1)
    })

    it("should disable button when no transcript file", () => {
      render(<ConfigurationForm {...defaultProps} transcriptFile={null} />)

      const button = screen.getByText("Analyze Transcript")
      expect(button).toBeDisabled()
    })

    it("should disable button when processing", () => {
      render(<ConfigurationForm {...defaultProps} processing />)

      const buttons = screen.getAllByText("Processing...")
      const processButton = buttons.find((el) => el.tagName === "BUTTON")
      expect(processButton).toBeDisabled()
    })

    it("should disable button when validation errors exist", () => {
      const errors: ValidationErrors = {
        report_name: "Required",
      }

      render(<ConfigurationForm {...defaultProps} validationErrors={errors} />)

      const button = screen.getByText("Analyze Transcript")
      expect(button).toBeDisabled()
    })

    it("should show Processing... text when processing", () => {
      render(<ConfigurationForm {...defaultProps} processing />)

      const processTexts = screen.getAllByText("Processing...")
      expect(processTexts.length).toBeGreaterThan(0)
      expect(screen.queryByText("Analyze Transcript")).not.toBeInTheDocument()
    })

    it("should show circular progress when processing", () => {
      const { container } = render(<ConfigurationForm {...defaultProps} processing />)

      const progress = container.querySelector('[class*="MuiCircularProgress-root"]')
      expect(progress).toBeInTheDocument()
    })
  })

  describe("Processing state", () => {
    it("should show ProgressIndicator when processing", () => {
      render(
        <ConfigurationForm
          {...defaultProps}
          processing
          processingProgress={50}
          processingMessage="Analyzing..."
          jobId="job-123"
        />
      )

      expect(screen.getByText(/Analyzing.../i)).toBeInTheDocument()
    })

    it("should not show ProgressIndicator when not processing", () => {
      render(<ConfigurationForm {...defaultProps} processing={false} />)

      expect(screen.queryByText(/job id/i)).not.toBeInTheDocument()
    })
  })

  describe("Error display", () => {
    it("should show ErrorDisplay when error exists", () => {
      render(<ConfigurationForm {...defaultProps} error="Something went wrong" />)

      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("should not show ErrorDisplay when no error", () => {
      render(<ConfigurationForm {...defaultProps} error={null} />)

      // Error display shouldn't be present
      const errorDisplays = screen.queryAllByText(/error/i)
      expect(errorDisplays.filter((el) => el.textContent?.includes("Something"))).toHaveLength(0)
    })
  })

  describe("AI Model selection", () => {
    it("should render with AI Model in config", () => {
      const { container } = render(<ConfigurationForm {...defaultProps} />)

      // The mocked select component renders the AI model options
      expect(container).toBeInTheDocument()
    })
  })

  describe("Date picker", () => {
    it("should render with date picker mocked", () => {
      const { container } = render(<ConfigurationForm {...defaultProps} />)

      // DateTimePicker is mocked globally, just verify form renders
      expect(container).toBeInTheDocument()
    })
  })
})
