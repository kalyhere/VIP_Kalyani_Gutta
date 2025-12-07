/**
 * StatusMessage Component Tests
 */

import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { StatusMessage } from "../StatusMessage"

describe("StatusMessage", () => {
  describe("Rendering", () => {
    it("should render message text", () => {
      render(<StatusMessage message="Processing complete" />)
      expect(screen.getByText("Processing complete")).toBeInTheDocument()
    })

    it("should render with info severity by default", () => {
      render(<StatusMessage message="Information message" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardInfo")
    })

    it("should render with success severity", () => {
      render(<StatusMessage message="Success!" severity="success" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardSuccess")
    })

    it("should render with warning severity", () => {
      render(<StatusMessage message="Warning!" severity="warning" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardWarning")
    })

    it("should render with error severity", () => {
      render(<StatusMessage message="Error occurred" severity="error" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardError")
    })
  })

  describe("Type Alias", () => {
    it("should accept type prop as alias for severity", () => {
      render(<StatusMessage message="Using type prop" type="success" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardSuccess")
    })

    it("should prioritize type prop over severity when both provided", () => {
      render(<StatusMessage message="Conflicting props" severity="error" type="success" />)
      const alert = screen.getByRole("alert")
      // type should win
      expect(alert).toHaveClass("MuiAlert-standardSuccess")
    })

    it("should use severity when type is not provided", () => {
      render(<StatusMessage message="Only severity" severity="warning" />)
      const alert = screen.getByRole("alert")
      expect(alert).toHaveClass("MuiAlert-standardWarning")
    })
  })

  describe("Message Updates", () => {
    it("should update message when prop changes", () => {
      const { rerender } = render(<StatusMessage message="Initial message" />)
      expect(screen.getByText("Initial message")).toBeInTheDocument()

      rerender(<StatusMessage message="Updated message" />)
      expect(screen.getByText("Updated message")).toBeInTheDocument()
      expect(screen.queryByText("Initial message")).not.toBeInTheDocument()
    })

    it("should update severity when prop changes", () => {
      const { rerender } = render(<StatusMessage message="Message" severity="info" />)
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardInfo")

      rerender(<StatusMessage message="Message" severity="error" />)
      expect(screen.getByRole("alert")).toHaveClass("MuiAlert-standardError")
    })

    it("should handle empty message string", () => {
      render(<StatusMessage message="" />)
      // Component should still render, just with empty text
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  describe("Severity Icons", () => {
    it("should display info icon for info severity", () => {
      const { container } = render(<StatusMessage message="Info" severity="info" />)
      // MUI Alert includes an icon by default
      const icon = container.querySelector(".MuiAlert-icon")
      expect(icon).toBeInTheDocument()
    })

    it("should display success icon for success severity", () => {
      const { container } = render(<StatusMessage message="Success" severity="success" />)
      const icon = container.querySelector(".MuiAlert-icon")
      expect(icon).toBeInTheDocument()
    })

    it("should display warning icon for warning severity", () => {
      const { container } = render(<StatusMessage message="Warning" severity="warning" />)
      const icon = container.querySelector(".MuiAlert-icon")
      expect(icon).toBeInTheDocument()
    })

    it("should display error icon for error severity", () => {
      const { container } = render(<StatusMessage message="Error" severity="error" />)
      const icon = container.querySelector(".MuiAlert-icon")
      expect(icon).toBeInTheDocument()
    })
  })

  describe("Accessibility", () => {
    it("should have alert role", () => {
      render(<StatusMessage message="Accessible message" />)
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })

    it("should have visible message text", () => {
      render(<StatusMessage message="Screen reader text" />)
      expect(screen.getByText("Screen reader text")).toBeVisible()
    })

    it("should maintain alert role across severity changes", () => {
      const { rerender } = render(<StatusMessage message="Message" severity="info" />)
      expect(screen.getByRole("alert")).toBeInTheDocument()

      rerender(<StatusMessage message="Message" severity="error" />)
      expect(screen.getByRole("alert")).toBeInTheDocument()
    })
  })

  describe("Long Messages", () => {
    it("should handle long message text", () => {
      const longMessage =
        "This is a very long status message that contains a lot of information about the current processing state and might wrap to multiple lines."
      render(<StatusMessage message={longMessage} />)
      expect(screen.getByText(longMessage)).toBeInTheDocument()
    })

    it("should handle multiline messages", () => {
      const multilineMessage = "Line 1\nLine 2\nLine 3"
      render(<StatusMessage message={multilineMessage} />)
      // Verify all lines are present in the document
      expect(screen.getByText(/Line 1/)).toBeInTheDocument()
      expect(screen.getByText(/Line 2/)).toBeInTheDocument()
      expect(screen.getByText(/Line 3/)).toBeInTheDocument()
    })
  })

  describe("All Severity Types", () => {
    const severities = ["success", "info", "warning", "error"] as const

    severities.forEach((severity) => {
      it(`should render correctly with ${severity} severity`, () => {
        render(<StatusMessage message={`${severity} message`} severity={severity} />)
        expect(screen.getByRole("alert")).toBeInTheDocument()
        expect(screen.getByText(`${severity} message`)).toBeInTheDocument()
      })
    })
  })
})
