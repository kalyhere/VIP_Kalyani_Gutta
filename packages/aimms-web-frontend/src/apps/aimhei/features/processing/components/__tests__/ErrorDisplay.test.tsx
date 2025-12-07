/**
 * ErrorDisplay Component Tests
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ErrorDisplay } from "../ErrorDisplay"

describe("ErrorDisplay", () => {
  describe("Rendering", () => {
    it("should render error message", () => {
      render(<ErrorDisplay error="Something went wrong" />)
      expect(screen.getByText("Something went wrong")).toBeInTheDocument()
    })

    it("should render with error severity", () => {
      render(<ErrorDisplay error="Error occurred" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardError")
    })

    it("should render error icon", () => {
      const { container } = render(<ErrorDisplay error="Error" />)
      const icon = container.querySelector('[data-testid="ErrorOutlineIcon"]')
      expect(icon).toBeInTheDocument()
    })

    it("should render title when provided", () => {
      render(<ErrorDisplay error="Details here" title="Error Title" />)
      expect(screen.getByText("Error Title")).toBeInTheDocument()
      expect(screen.getByText("Details here")).toBeInTheDocument()
    })

    it("should not render title section when title not provided", () => {
      const { container } = render(<ErrorDisplay error="Error message" />)
      const alertTitle = container.querySelector(".MuiAlertTitle-root")
      expect(alertTitle).not.toBeInTheDocument()
    })

    it("should render retry button when onRetry provided", () => {
      render(<ErrorDisplay error="Failed" onRetry={vi.fn()} />)
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })

    it("should not render retry button when onRetry not provided", () => {
      render(<ErrorDisplay error="Failed" />)
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument()
    })
  })

  describe("Retry Button Interactions", () => {
    it("should call onRetry when retry button clicked", async () => {
      const user = userEvent.setup()
      const handleRetry = vi.fn()
      render(<ErrorDisplay error="Failed to load" onRetry={handleRetry} />)

      await user.click(screen.getByRole("button", { name: /retry/i }))
      expect(handleRetry).toHaveBeenCalledTimes(1)
    })

    it("should call onRetry multiple times when clicked multiple times", async () => {
      const user = userEvent.setup()
      const handleRetry = vi.fn()
      render(<ErrorDisplay error="Failed" onRetry={handleRetry} />)

      const retryButton = screen.getByRole("button", { name: /retry/i })
      await user.click(retryButton)
      await user.click(retryButton)
      await user.click(retryButton)

      expect(handleRetry).toHaveBeenCalledTimes(3)
    })

    it("should handle retry button keyboard interaction", async () => {
      const user = userEvent.setup()
      const handleRetry = vi.fn()
      render(<ErrorDisplay error="Failed" onRetry={handleRetry} />)

      const retryButton = screen.getByRole("button", { name: /retry/i })
      retryButton.focus()
      await user.keyboard("{Enter}")

      expect(handleRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe("Error Message Variations", () => {
    it("should handle short error messages", () => {
      render(<ErrorDisplay error="Error" />)
      expect(screen.getByText("Error")).toBeInTheDocument()
    })

    it("should handle long error messages", () => {
      const longError =
        "An unexpected error occurred while processing your request. Please check your connection and try again. If the problem persists, contact support."
      render(<ErrorDisplay error={longError} />)
      expect(screen.getByText(longError)).toBeInTheDocument()
    })

    it("should handle empty error message", () => {
      render(<ErrorDisplay error="" />)
      const alert = screen.getByRole("alert")
      expect(alert).toBeInTheDocument()
    })

    it("should handle error messages with special characters", () => {
      const specialError = "Error: Failed with code 404 - Resource not found (server@example.com)"
      render(<ErrorDisplay error={specialError} />)
      expect(screen.getByText(specialError)).toBeInTheDocument()
    })
  })

  describe("Title Variations", () => {
    it("should display custom title", () => {
      render(<ErrorDisplay error="Details" title="Network Error" />)
      expect(screen.getByText("Network Error")).toBeInTheDocument()
    })

    it("should handle long title", () => {
      const longTitle = "Critical System Error Requiring Immediate Attention"
      render(<ErrorDisplay error="Details" title={longTitle} />)
      expect(screen.getByText(longTitle)).toBeInTheDocument()
    })

    it("should handle empty title string", () => {
      const { container } = render(<ErrorDisplay error="Error" title="" />)
      // Empty title should not render AlertTitle (empty string is falsy)
      const alertTitle = container.querySelector(".MuiAlertTitle-root")
      expect(alertTitle).not.toBeInTheDocument()
      expect(screen.getByText("Error")).toBeInTheDocument()
    })
  })

  describe("Combined Props", () => {
    it("should render all props together", () => {
      const handleRetry = vi.fn()
      render(<ErrorDisplay error="Connection failed" title="Network Error" onRetry={handleRetry} />)

      expect(screen.getByText("Network Error")).toBeInTheDocument()
      expect(screen.getByText("Connection failed")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })

    it("should render title and retry without error being too long", () => {
      render(<ErrorDisplay error="Failed" title="Error" onRetry={vi.fn()} />)

      expect(screen.getByText("Error")).toBeInTheDocument()
      expect(screen.getByText("Failed")).toBeInTheDocument()
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })
  })

  describe("Component Updates", () => {
    it("should update error message when prop changes", () => {
      const { rerender } = render(<ErrorDisplay error="First error" />)
      expect(screen.getByText("First error")).toBeInTheDocument()

      rerender(<ErrorDisplay error="Second error" />)
      expect(screen.getByText("Second error")).toBeInTheDocument()
      expect(screen.queryByText("First error")).not.toBeInTheDocument()
    })

    it("should update title when prop changes", () => {
      const { rerender } = render(<ErrorDisplay error="Error" title="Title 1" />)
      expect(screen.getByText("Title 1")).toBeInTheDocument()

      rerender(<ErrorDisplay error="Error" title="Title 2" />)
      expect(screen.getByText("Title 2")).toBeInTheDocument()
      expect(screen.queryByText("Title 1")).not.toBeInTheDocument()
    })

    it("should add retry button when onRetry is added", () => {
      const { rerender } = render(<ErrorDisplay error="Error" />)
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument()

      rerender(<ErrorDisplay error="Error" onRetry={vi.fn()} />)
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()
    })

    it("should remove retry button when onRetry is removed", () => {
      const { rerender } = render(<ErrorDisplay error="Error" onRetry={vi.fn()} />)
      expect(screen.getByRole("button", { name: /retry/i })).toBeInTheDocument()

      rerender(<ErrorDisplay error="Error" />)
      expect(screen.queryByRole("button", { name: /retry/i })).not.toBeInTheDocument()
    })

    it("should update onRetry handler", async () => {
      const user = userEvent.setup()
      const firstHandler = vi.fn()
      const secondHandler = vi.fn()

      const { rerender } = render(<ErrorDisplay error="Error" onRetry={firstHandler} />)
      await user.click(screen.getByRole("button", { name: /retry/i }))
      expect(firstHandler).toHaveBeenCalledTimes(1)
      expect(secondHandler).not.toHaveBeenCalled()

      rerender(<ErrorDisplay error="Error" onRetry={secondHandler} />)
      await user.click(screen.getByRole("button", { name: /retry/i }))
      expect(firstHandler).toHaveBeenCalledTimes(1) // Still 1
      expect(secondHandler).toHaveBeenCalledTimes(1)
    })
  })

  describe("Accessibility", () => {
    it("should have alert role", () => {
      render(<ErrorDisplay error="Error message" />)
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    it("should have accessible retry button", () => {
      render(<ErrorDisplay error="Error" onRetry={vi.fn()} />)
      const button = screen.getByRole("button", { name: /retry/i })
      expect(button).toBeInTheDocument()
      expect(button).toHaveAccessibleName()
    })

    it("should have visible error text", () => {
      render(<ErrorDisplay error="Visible error" />)
      expect(screen.getByText("Visible error")).toBeVisible()
    })

    it("should have visible title text when provided", () => {
      render(<ErrorDisplay error="Error" title="Error Title" />)
      expect(screen.getByText("Error Title")).toBeVisible()
    })

    it("should maintain alert semantics with all props", () => {
      render(<ErrorDisplay error="Error" title="Title" onRetry={vi.fn()} />)
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })
})
