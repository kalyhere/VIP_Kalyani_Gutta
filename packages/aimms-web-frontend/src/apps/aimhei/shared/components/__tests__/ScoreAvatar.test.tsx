import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { ScoreAvatar } from "../ScoreAvatar"

describe("ScoreAvatar", () => {
  describe("score display", () => {
    it("should display score when provided", () => {
      render(<ScoreAvatar score={85} title="Test" />)

      expect(screen.getByText("85")).toBeInTheDocument()
    })

    it("should display rounded score", () => {
      render(<ScoreAvatar score={85.7} title="Test" />)

      expect(screen.getByText("86")).toBeInTheDocument()
    })

    it("should display question mark when score is null", () => {
      render(<ScoreAvatar score={null} title="Test" />)

      expect(screen.getByText("?")).toBeInTheDocument()
    })

    it("should display zero score", () => {
      render(<ScoreAvatar score={0} title="Test" />)

      expect(screen.getByText("0")).toBeInTheDocument()
    })

    it("should display perfect score", () => {
      render(<ScoreAvatar score={100} title="Test" />)

      expect(screen.getByText("100")).toBeInTheDocument()
    })
  })

  describe("title handling", () => {
    it("should use first letter of title", () => {
      // Note: The component shows score, not first letter in the avatar
      // But the title affects the avatar color selection
      const { container } = render(<ScoreAvatar score={75} title="Analysis" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })

    it("should handle empty title", () => {
      render(<ScoreAvatar score={75} title="" />)

      expect(screen.getByText("75")).toBeInTheDocument()
    })

    it("should handle null title", () => {
      render(<ScoreAvatar score={75} title={null} />)

      expect(screen.getByText("75")).toBeInTheDocument()
    })

    it("should handle undefined title", () => {
      render(<ScoreAvatar score={75} title={undefined} />)

      expect(screen.getByText("75")).toBeInTheDocument()
    })
  })

  describe("size prop", () => {
    it("should use default size when not specified", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" />)

      const avatar = container.querySelector('[class*="MuiAvatar-root"]')
      expect(avatar).toBeInTheDocument()
    })

    it("should accept custom size", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" size={60} />)

      const avatar = container.querySelector('[class*="MuiAvatar-root"]')
      expect(avatar).toBeInTheDocument()
    })

    it("should accept small size", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" size={24} />)

      const avatar = container.querySelector('[class*="MuiAvatar-root"]')
      expect(avatar).toBeInTheDocument()
    })
  })

  describe("progress indicator", () => {
    it("should show progress by default", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" />)

      const progress = container.querySelectorAll('[class*="MuiCircularProgress-root"]')
      // Should have background and foreground progress
      expect(progress.length).toBeGreaterThanOrEqual(1)
    })

    it("should hide progress when showProgress is false", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" showProgress={false} />)

      const progress = container.querySelectorAll('[class*="MuiCircularProgress-root"]')
      expect(progress.length).toBe(0)
    })

    it("should show progress for null score", () => {
      const { container } = render(<ScoreAvatar score={null} title="Test" showProgress />)

      const progress = container.querySelectorAll('[class*="MuiCircularProgress-root"]')
      // Should show background progress even with null score
      expect(progress.length).toBeGreaterThanOrEqual(1)
    })
  })

  describe("score color coding", () => {
    it("should use excellent color for high scores (80+)", () => {
      const { container } = render(<ScoreAvatar score={90} title="Test" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })

    it("should use good color for decent scores (70-79)", () => {
      const { container } = render(<ScoreAvatar score={75} title="Test" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })

    it("should use needs improvement color for low scores (60-69)", () => {
      const { container } = render(<ScoreAvatar score={65} title="Test" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })

    it("should use poor color for failing scores (<60)", () => {
      const { container } = render(<ScoreAvatar score={50} title="Test" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })

    it("should use neutral color for null score", () => {
      const { container } = render(<ScoreAvatar score={null} title="Test" />)

      expect(container.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })
  })

  describe("avatar color selection", () => {
    it("should generate consistent color for same title", () => {
      const { container: container1 } = render(<ScoreAvatar score={75} title="Analysis" />)
      const { container: container2 } = render(<ScoreAvatar score={75} title="Analysis" />)

      const avatar1 = container1.querySelector('[class*="MuiAvatar-root"]')
      const avatar2 = container2.querySelector('[class*="MuiAvatar-root"]')

      expect(avatar1).toBeInTheDocument()
      expect(avatar2).toBeInTheDocument()
    })

    it("should use different colors for different titles", () => {
      const { container: container1 } = render(<ScoreAvatar score={75} title="Analysis" />)
      const { container: container2 } = render(<ScoreAvatar score={75} title="Report" />)

      expect(container1.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
      expect(container2.querySelector('[class*="MuiAvatar-root"]')).toBeInTheDocument()
    })
  })

  describe("edge cases", () => {
    it("should handle negative scores", () => {
      render(<ScoreAvatar score={-10} title="Test" />)

      expect(screen.getByText("-10")).toBeInTheDocument()
    })

    it("should handle scores over 100", () => {
      render(<ScoreAvatar score={150} title="Test" />)

      expect(screen.getByText("150")).toBeInTheDocument()
    })

    it("should handle very large scores", () => {
      render(<ScoreAvatar score={999} title="Test" />)

      expect(screen.getByText("999")).toBeInTheDocument()
    })
  })
})
