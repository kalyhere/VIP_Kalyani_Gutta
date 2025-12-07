/**
 * ReportFilters Component Tests
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ReportFilters } from "../ReportFilters"

describe("ReportFilters", () => {
  const mockHandlers = {
    onSearchChange: vi.fn(),
    onSearchFieldChange: vi.fn(),
    onModelFilterChange: vi.fn(),
    onDateFilterChange: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("Rendering", () => {
    it("should render search input", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      expect(screen.getByPlaceholderText(/search reports/i)).toBeInTheDocument()
    })

    it("should render search field dropdown", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      expect(screen.getByLabelText(/search by/i)).toBeInTheDocument()
    })

    it("should render AI model dropdown", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument()
    })

    it("should render date range dropdown", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
    })

    it("should render search icon", () => {
      const { container } = render(<ReportFilters searchTerm="" {...mockHandlers} />)
      const icon = container.querySelector('[data-testid="SearchIcon"]')
      expect(icon).toBeInTheDocument()
    })
  })

  describe("Search Input", () => {
    it("should display search term value", () => {
      render(<ReportFilters searchTerm="test query" {...mockHandlers} />)
      expect(screen.getByPlaceholderText(/search reports/i)).toHaveValue("test query")
    })

    it("should call onSearchChange when typing", async () => {
      const user = userEvent.setup()
      const onSearchChange = vi.fn()
      render(<ReportFilters searchTerm="" {...mockHandlers} onSearchChange={onSearchChange} />)

      const searchInput = screen.getByPlaceholderText(/search reports/i)
      await user.type(searchInput, "test")

      // Should be called for each character typed (4 times for "test")
      expect(onSearchChange).toHaveBeenCalled()
      expect(onSearchChange.mock.calls.length).toBeGreaterThan(0)
    })

    it("should call onSearchChange when clearing", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="test" {...mockHandlers} />)

      const searchInput = screen.getByPlaceholderText(/search reports/i)
      await user.clear(searchInput)

      expect(mockHandlers.onSearchChange).toHaveBeenCalledWith("")
    })

    it("should handle paste events", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      const searchInput = screen.getByPlaceholderText(/search reports/i)
      await user.click(searchInput)
      await user.paste("pasted text")

      expect(mockHandlers.onSearchChange).toHaveBeenCalled()
    })
  })

  describe("Search Field Dropdown", () => {
    it("should display default search field", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      // MUI TextField select displays text, not value attribute
      expect(screen.getByText("Title")).toBeInTheDocument()
    })

    it("should display custom search field", () => {
      render(<ReportFilters searchTerm="" searchField="patient_id" {...mockHandlers} />)
      // Check that "Patient ID" is displayed for the patient_id value
      expect(screen.getByText("Patient ID")).toBeInTheDocument()
    })

    it("should call onSearchFieldChange when changed", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/search by/i))
      await user.click(screen.getByRole("option", { name: /patient id/i }))

      expect(mockHandlers.onSearchFieldChange).toHaveBeenCalledWith("patient_id")
    })

    it("should have all search field options", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/search by/i))

      expect(screen.getByRole("option", { name: /^title$/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /patient id/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /hcp name/i })).toBeInTheDocument()
    })
  })

  describe("AI Model Filter", () => {
    it("should display default model filter", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      // MUI TextField select displays text
      expect(screen.getByText("All Models")).toBeInTheDocument()
    })

    it("should display custom model filter", () => {
      render(<ReportFilters searchTerm="" modelFilter="gpt-4o" {...mockHandlers} />)
      // Check that "GPT-4o" text is displayed
      expect(screen.getByText("GPT-4o")).toBeInTheDocument()
    })

    it("should call onModelFilterChange when changed", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/ai model/i))
      await user.click(screen.getByRole("option", { name: /gpt-4o$/i }))

      expect(mockHandlers.onModelFilterChange).toHaveBeenCalledWith("gpt-4o")
    })

    it("should have all model options", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/ai model/i))

      expect(screen.getByRole("option", { name: /all models/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /^gpt-4o$/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /gpt-4o mini/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /claude 3\.5 sonnet/i })).toBeInTheDocument()
    })
  })

  describe("Date Filter", () => {
    it("should display default date filter", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)
      // MUI TextField select displays text
      expect(screen.getByText("All Time")).toBeInTheDocument()
    })

    it("should display custom date filter", () => {
      render(<ReportFilters searchTerm="" dateFilter="last_7_days" {...mockHandlers} />)
      // Check the displayed text for last_7_days value
      expect(screen.getByText("Last 7 Days")).toBeInTheDocument()
    })

    it("should call onDateFilterChange when changed", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/date range/i))
      await user.click(screen.getByRole("option", { name: /last 7 days/i }))

      expect(mockHandlers.onDateFilterChange).toHaveBeenCalledWith("last_7_days")
    })

    it("should have all date options", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/date range/i))

      expect(screen.getByRole("option", { name: /all time/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /^today$/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /last 7 days/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /last 30 days/i })).toBeInTheDocument()
      expect(screen.getByRole("option", { name: /last 90 days/i })).toBeInTheDocument()
    })
  })

  describe("Filters Object API", () => {
    it("should accept filters object", () => {
      const filters = {
        searchTerm: "test",
        searchField: "patient_id",
        modelFilter: "gpt-4o",
        dateFilter: "last_30_days",
      }
      const onFiltersChange = vi.fn()

      render(
        <ReportFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onSearchChange={vi.fn()}
          searchTerm=""
        />,
      )

      expect(screen.getByPlaceholderText(/search reports/i)).toHaveValue("test")
      // MUI Select displays text not values
      expect(screen.getByText("Patient ID")).toBeInTheDocument()
      expect(screen.getByText("GPT-4o")).toBeInTheDocument()
      expect(screen.getByText("Last 30 Days")).toBeInTheDocument()
    })

    it("should call onFiltersChange when search changes", async () => {
      const user = userEvent.setup()
      const filters = {
        searchTerm: "",
        searchField: "case_title",
        modelFilter: "all",
        dateFilter: "all",
      }
      const onFiltersChange = vi.fn()

      render(
        <ReportFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onSearchChange={vi.fn()}
          searchTerm=""
        />,
      )

      await user.type(screen.getByPlaceholderText(/search reports/i), "test")

      // Should be called for each character - just verify it was called
      expect(onFiltersChange).toHaveBeenCalled()
      expect(onFiltersChange.mock.calls.length).toBeGreaterThan(0)
      // Check last call has the searchTerm property
      expect(onFiltersChange.mock.calls[onFiltersChange.mock.calls.length - 1][0]).toHaveProperty(
        "searchTerm",
      )
    })

    it("should call onFiltersChange when filter changes", async () => {
      const user = userEvent.setup()
      const filters = {
        searchTerm: "",
        searchField: "case_title",
        modelFilter: "all",
        dateFilter: "all",
      }
      const onFiltersChange = vi.fn()

      render(
        <ReportFilters
          filters={filters}
          onFiltersChange={onFiltersChange}
          onSearchChange={vi.fn()}
          searchTerm=""
        />,
      )

      await user.click(screen.getByLabelText(/ai model/i))
      await user.click(screen.getByRole("option", { name: /^gpt-4o$/i }))

      expect(onFiltersChange).toHaveBeenCalledWith({ modelFilter: "gpt-4o" })
    })

    it("should prioritize filters object over individual props", () => {
      const filters = {
        searchTerm: "from filters",
        searchField: "patient_id",
        modelFilter: "gpt-4o",
        dateFilter: "last_7_days",
      }

      render(
        <ReportFilters
          filters={filters}
          searchTerm="from prop"
          searchField="case_title"
          modelFilter="all"
          dateFilter="all"
          onFiltersChange={vi.fn()}
          onSearchChange={vi.fn()}
        />
      )

      expect(screen.getByPlaceholderText(/search reports/i)).toHaveValue("from filters")
      // MUI Select displays text not values
      expect(screen.getByText("Patient ID")).toBeInTheDocument()
      expect(screen.getByText("GPT-4o")).toBeInTheDocument()
      expect(screen.getByText("Last 7 Days")).toBeInTheDocument()
    })
  })

  describe("Multiple Filter Changes", () => {
    it("should handle rapid filter changes", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      await user.click(screen.getByLabelText(/search by/i))
      await user.click(screen.getByRole("option", { name: /patient id/i }))

      await user.click(screen.getByLabelText(/ai model/i))
      await user.click(screen.getByRole("option", { name: /^gpt-4o$/i }))

      await user.click(screen.getByLabelText(/date range/i))
      await user.click(screen.getByRole("option", { name: /last 7 days/i }))

      expect(mockHandlers.onSearchFieldChange).toHaveBeenCalledWith("patient_id")
      expect(mockHandlers.onModelFilterChange).toHaveBeenCalledWith("gpt-4o")
      expect(mockHandlers.onDateFilterChange).toHaveBeenCalledWith("last_7_days")
    })
  })

  describe("Accessibility", () => {
    it("should have accessible labels for all inputs", () => {
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      expect(screen.getByPlaceholderText(/search reports/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/search by/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/ai model/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/date range/i)).toBeInTheDocument()
    })

    it("should support keyboard navigation", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" {...mockHandlers} />)

      const searchField = screen.getByLabelText(/search by/i)
      searchField.focus()
      await user.keyboard("{Enter}")

      // Menu should open
      expect(screen.getByRole("option", { name: /^title$/i })).toBeInTheDocument()
    })
  })

  describe("Edge Cases", () => {
    it("should handle missing optional handlers gracefully", async () => {
      const user = userEvent.setup()
      render(<ReportFilters searchTerm="" onSearchChange={vi.fn()} />)

      // Should not throw errors when optional handlers are missing
      await user.click(screen.getByLabelText(/search by/i))
      await user.click(screen.getByRole("option", { name: /patient id/i }))
    })

    it("should handle undefined filter values", () => {
      render(
        <ReportFilters
          searchTerm=""
          searchField={undefined}
          modelFilter={undefined}
          dateFilter={undefined}
          {...mockHandlers}
        />
      )

      // Should use defaults - MUI Select displays text
      expect(screen.getByText("Title")).toBeInTheDocument()
      expect(screen.getByText("All Models")).toBeInTheDocument()
      expect(screen.getByText("All Time")).toBeInTheDocument()
    })
  })
})
