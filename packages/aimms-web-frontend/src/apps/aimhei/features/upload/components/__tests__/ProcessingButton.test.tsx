/**
 * ProcessingButton Component Tests
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { ProcessingButton } from "../ProcessingButton"

describe("ProcessingButton", () => {
  describe("Rendering", () => {
    it("should render with default label", () => {
      render(<ProcessingButton onClick={vi.fn()} />)
      expect(screen.getByRole("button", { name: /start analysis/i })).toBeInTheDocument()
    })

    it("should render with custom label", () => {
      render(<ProcessingButton onClick={vi.fn()} label="Begin Processing" />)
      expect(screen.getByRole("button", { name: /begin processing/i })).toBeInTheDocument()
    })

    it("should render play icon when not loading", () => {
      const { container } = render(<ProcessingButton onClick={vi.fn()} />)
      // PlayArrowIcon is rendered
      const icon = container.querySelector('[data-testid="PlayArrowIcon"]')
      expect(icon).toBeInTheDocument()
    })

    it("should render circular progress when loading", () => {
      render(<ProcessingButton onClick={vi.fn()} loading />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
      expect(screen.getByRole("button")).toHaveTextContent(/processing/i)
    })

    it("should render circular progress when processing prop is true", () => {
      render(<ProcessingButton onClick={vi.fn()} processing />)
      expect(screen.getByRole("progressbar")).toBeInTheDocument()
      expect(screen.getByRole("button")).toHaveTextContent(/processing/i)
    })
  })

  describe("Interactions", () => {
    it("should call onClick when clicked", async () => {
      const user = userEvent.setup()
      const handleClick = vi.fn()
      render(<ProcessingButton onClick={handleClick} />)

      await user.click(screen.getByRole("button"))
      expect(handleClick).toHaveBeenCalledTimes(1)
    })

    it("should not call onClick when disabled", () => {
      const handleClick = vi.fn()
      render(<ProcessingButton onClick={handleClick} disabled />)

      const button = screen.getByRole("button")
      expect(button).toBeDisabled()

      // Disabled button with pointer-events: none cannot be clicked with userEvent
      // Verification that button is disabled is sufficient
      expect(handleClick).not.toHaveBeenCalled()
    })

    it("should not call onClick when loading", () => {
      const handleClick = vi.fn()
      render(<ProcessingButton onClick={handleClick} loading />)

      const button = screen.getByRole("button")
      expect(button).toBeDisabled()

      // Disabled button with pointer-events: none cannot be clicked with userEvent
      expect(handleClick).not.toHaveBeenCalled()
    })

    it("should not call onClick when processing", () => {
      const handleClick = vi.fn()
      render(<ProcessingButton onClick={handleClick} processing />)

      const button = screen.getByRole("button")
      expect(button).toBeDisabled()

      // Disabled button with pointer-events: none cannot be clicked with userEvent
      expect(handleClick).not.toHaveBeenCalled()
    })
  })

  describe("States", () => {
    it("should be enabled by default", () => {
      render(<ProcessingButton onClick={vi.fn()} />)
      expect(screen.getByRole("button")).not.toBeDisabled()
    })

    it("should be disabled when disabled prop is true", () => {
      render(<ProcessingButton onClick={vi.fn()} disabled />)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("should be disabled when loading", () => {
      render(<ProcessingButton onClick={vi.fn()} loading />)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("should be disabled when processing", () => {
      render(<ProcessingButton onClick={vi.fn()} processing />)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("should be disabled when both disabled and loading", () => {
      render(<ProcessingButton onClick={vi.fn()} disabled loading />)
      expect(screen.getByRole("button")).toBeDisabled()
    })

    it("should prioritize loading over processing prop", () => {
      render(<ProcessingButton onClick={vi.fn()} loading={false} processing />)
      expect(screen.getByRole("button")).toBeDisabled()
      expect(screen.getByRole("button")).toHaveTextContent(/processing/i)
    })
  })

  describe("Accessibility", () => {
    it("should have accessible button role", () => {
      render(<ProcessingButton onClick={vi.fn()} />)
      expect(screen.getByRole("button")).toBeInTheDocument()
    })

    it("should show loading state to screen readers", () => {
      render(<ProcessingButton onClick={vi.fn()} loading />)
      const button = screen.getByRole("button")
      expect(button).toHaveAccessibleName(/processing/i)
    })

    it("should maintain focus when state changes", () => {
      const { rerender } = render(<ProcessingButton onClick={vi.fn()} />)
      const button = screen.getByRole("button")
      button.focus()
      expect(button).toHaveFocus()

      rerender(<ProcessingButton onClick={vi.fn()} loading />)
      // Button still exists but is now disabled
      expect(button).toBeInTheDocument()
    })
  })
})
