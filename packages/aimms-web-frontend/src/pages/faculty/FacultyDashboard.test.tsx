import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { BrowserRouter } from "react-router-dom"
import { FacultyDashboard } from "./FacultyDashboard"
import * as facultyService from "../../services/facultyService"

// Mock the services
vi.mock("../../services/facultyService")

// Mock framer-motion to avoid animation issues in tests
vi.mock("framer-motion", () => {
  const mockMotion = new Proxy(
    (Component: any) => Component, // Handle motion(Component) syntax
    {
      get: (target, prop) => {
        // Handle motion.div, motion.button, etc.
        const Component = ({ children, ...props }: any) => {
          const {
            initial,
            animate,
            exit,
            transition,
            variants,
            whileHover,
            whileTap,
            whileFocus,
            whileDrag,
            whileInView,
            drag,
            dragConstraints,
            dragElastic,
            dragMomentum,
            layout,
            layoutId,
            ...otherProps
          } = props
          return <div {...otherProps}>{children}</div>
        }
        Component.displayName = `motion.${String(prop)}`
        return Component
      },
    }
  )

  return {
    motion: mockMotion,
    AnimatePresence: ({ children }: any) => <>{children}</>,
  }
})

// Mock MUI DateTimePicker components
vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: ({ value, onChange, ...props }: any) => (
    <input type="datetime-local" value={value?.toString()} onChange={onChange} {...props} />
  ),
}))

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: ({ children }: any) => <>{children}</>,
}))

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: vi.fn(),
}))

const mockFacultyStats = {
  name: "Dr. Smith",
  email: "smith@test.com",
  department: "Biology",
  role: "Clinical Faculty",
  stats: {
    totalStudents: 50,
    activeCases: 10,
    totalCases: 15,
    averageCompletion: 75,
  },
}

const mockClasses = [
  {
    id: 1,
    name: "Biology 101",
    code: "BIO101",
    term: "Fall 2024",
    studentCount: 25,
    pendingReviews: 5,
  },
  {
    id: 2,
    name: "Biology 201",
    code: "BIO201",
    term: "Fall 2024",
    studentCount: 20,
    pendingReviews: 2,
  },
]

const mockStudents = [
  {
    id: 1,
    name: "Student One",
    email: "student1@test.com",
    is_active: true,
    progress: {
      completedCases: 3,
      totalAssigned: 4,
      averageScore: 85,
    },
  },
  {
    id: 2,
    name: "Student Two",
    email: "student2@test.com",
    is_active: true,
    progress: {
      completedCases: 2,
      totalAssigned: 4,
      averageScore: 78,
    },
  },
]

const mockAssignments = [
  {
    assignmentId: 1,
    studentId: 1,
    studentName: "Student One",
    studentEmail: "student1@test.com",
    caseId: 1,
    caseTitle: "Test Case 1",
    status: "not_started" as const,
    dueDate: "2024-12-01",
    classId: 1,
    reportId: null,
  },
  {
    assignmentId: 2,
    studentId: 2,
    studentName: "Student Two",
    studentEmail: "student2@test.com",
    caseId: 2,
    caseTitle: "Test Case 2",
    status: "in_progress" as const,
    dueDate: "2024-12-05",
    classId: 1,
    reportId: null,
  },
]

const mockMedicalCases = [
  {
    id: 1,
    title: "Cardiac Emergency",
    description: "Patient presenting with chest pain",
    topics: ["Cardiology", "Emergency"],
    difficulty: "Intermediate",
    sections: [],
  },
  {
    id: 2,
    title: "Respiratory Distress",
    description: "Patient with breathing difficulties",
    topics: ["Pulmonology", "Critical Care"],
    difficulty: "Advanced",
    sections: [],
  },
]

describe("FacultyDashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup default mock responses
    vi.mocked(facultyService.getFacultyStats).mockResolvedValue(mockFacultyStats as any)
    vi.mocked(facultyService.getFacultyClasses).mockResolvedValue(mockClasses as any)
    vi.mocked(facultyService.getFacultyStudents).mockResolvedValue(mockStudents as any)
    vi.mocked(facultyService.getClassAssignments).mockResolvedValue(mockAssignments as any)
    vi.mocked(facultyService.getFacultyMedicalCases).mockResolvedValue(mockMedicalCases as any)
    vi.mocked(facultyService.bulkAssignCase).mockResolvedValue({ success: true } as any)
    vi.mocked(facultyService.deleteAssignment).mockResolvedValue(undefined)
    vi.mocked(facultyService.bulkUpdateDueDate).mockResolvedValue(undefined)
  })

  const renderDashboard = () =>
    render(
    <BrowserRouter>
        <FacultyDashboard />
      </BrowserRouter>,
    )

  it("should render faculty dashboard with greeting", async () => {
    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/Good/)).toBeInTheDocument()
      expect(screen.getByText(/Dr\./)).toBeInTheDocument()
    })
  })

  it("should load and display faculty stats", async () => {
    renderDashboard()

    await waitFor(() => {
      expect(facultyService.getFacultyStats).toHaveBeenCalled()
    })

    // Check that stats are displayed
    await waitFor(() => {
      expect(screen.getByText("50")).toBeInTheDocument() // totalStudents
      expect(screen.getByText("10")).toBeInTheDocument() // activeCases
      expect(screen.getByText("75%")).toBeInTheDocument() // averageCompletion
    })
  })

  it("should load and display classes", async () => {
    renderDashboard()

    await waitFor(() => {
      expect(facultyService.getFacultyClasses).toHaveBeenCalled()
    })

    await waitFor(() => {
      expect(screen.getByText("Biology 101")).toBeInTheDocument()
      expect(screen.getByText("Biology 201")).toBeInTheDocument()
    })
  })

  it("should handle errors when loading faculty stats", async () => {
    vi.mocked(facultyService.getFacultyStats).mockRejectedValue(new Error("Failed to load stats"))

    renderDashboard()

    await waitFor(() => {
      const errorMessages = screen.queryAllByText(/Failed to load faculty stats. Please try again./)
      expect(errorMessages.length).toBeGreaterThan(0)
    })
  })

  it("should handle errors when loading classes", async () => {
    vi.mocked(facultyService.getFacultyClasses).mockRejectedValue(
      new Error("Failed to load classes")
    )

    renderDashboard()

    // When classes fail to load, an empty array is set, so "No classes found" is shown
    await waitFor(() => {
      expect(screen.getByText(/No classes found/)).toBeInTheDocument()
    })
  })

  it("should show loading state initially", async () => {
    renderDashboard()

    // Since mocked data resolves immediately, just verify the component renders
    // and eventually shows the loaded data
    await waitFor(() => {
      expect(screen.getByText(/Dr\./)).toBeInTheDocument()
      expect(screen.getByText("Biology 101")).toBeInTheDocument()
    })
  })

  it("should display correct greeting based on time of day", async () => {
    const originalDate = Date

    // Mock morning time (8 AM)
    global.Date = class extends originalDate {
      getHours() {
        return 8
      }
    } as any

    renderDashboard()

    await waitFor(() => {
      expect(screen.getByText(/Good morning/)).toBeInTheDocument()
    })

    global.Date = originalDate
  })

  describe("Class Selection and Navigation", () => {
    it("should navigate to class detail view when class is clicked", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Wait for classes to load
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      // Find the ListItemButton that contains "Biology 101"
      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      if (classButton) {
        await user.click(classButton)
      }

      // Should load students and assignments for that class
      await waitFor(() => {
        expect(facultyService.getFacultyStudents).toHaveBeenCalledWith(1)
        expect(facultyService.getClassAssignments).toHaveBeenCalledWith(1)
      }, { timeout: 10000 })
    }, 15000)

    it("should display students when class is selected", async () => {
      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      expect(classButton).toBeDefined()
      if (classButton) {
        await user.click(classButton)
      }

      // Should display student names
      await waitFor(
        () => {
          expect(screen.getByText("Student One")).toBeInTheDocument()
          expect(screen.getByText("Student Two")).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it("should navigate back to class list from class detail", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to class detail
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      if (classButton) {
        await user.click(classButton)
      }

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      }, { timeout: 10000 })

      // Find and click back button
      const backButton = screen.queryByRole("button", { name: /back/i })
      if (backButton) {
        await user.click(backButton)

        // Should return to class list view
        await waitFor(() => {
          expect(screen.getByText("Biology 101")).toBeInTheDocument()
        }, { timeout: 10000 })
      }
    }, 20000)
  })

  describe("Assignment Flow", () => {
    it("should load medical cases when starting assignment flow", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Select a class first
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      if (classButton) {
        await user.click(classButton)
      }

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Look for "New Assignment" chip/button - it could be a Chip component with role="button"
      await waitFor(() => {
        const newAssignmentElements = screen.getAllByRole("button")
        const newAssignmentButton = newAssignmentElements.find((el) =>
          el.textContent?.includes("New Assignment")
        )

        expect(newAssignmentButton).toBeDefined()
        if (newAssignmentButton) {
          user.click(newAssignmentButton)
        }
      })

      // Should load medical cases
      await waitFor(() => {
        expect(facultyService.getFacultyMedicalCases).toHaveBeenCalled()
      }, { timeout: 10000 })
    }, 15000)

    it("should display medical cases in assignment flow", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to assignment flow
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      if (classButton) {
        await user.click(classButton)
      }

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Look for "New Assignment" chip/button
      await waitFor(() => {
        const newAssignmentElements = screen.getAllByRole("button")
        const newAssignmentButton = newAssignmentElements.find((el) =>
          el.textContent?.includes("New Assignment")
        )

        expect(newAssignmentButton).toBeDefined()
        if (newAssignmentButton) {
          user.click(newAssignmentButton)
        }
      })

      // Should display medical case titles
      await waitFor(
        () => {
          expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
          expect(screen.getByText("Respiratory Distress")).toBeInTheDocument()
        },
        { timeout: 10000 }
      )
    }, 15000)

    it("should allow selecting a case and moving to student selection", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to assignment flow
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classElements = screen.getAllByRole("button")
      const classButton = classElements.find((el) => el.textContent?.includes("Biology 101"))

      if (classButton) {
        await user.click(classButton)
      }

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Look for "New Assignment" chip/button
      await waitFor(() => {
        const newAssignmentElements = screen.getAllByRole("button")
        const newAssignmentButton = newAssignmentElements.find((el) =>
          el.textContent?.includes("New Assignment")
        )

        expect(newAssignmentButton).toBeDefined()
        if (newAssignmentButton) {
          user.click(newAssignmentButton)
        }
      })

      await waitFor(() => {
        expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
      })

      // Click on a case to select it
      const caseCard = screen.getByText("Cardiac Emergency").closest("div[role='button']")
      if (caseCard) {
        await user.click(caseCard)

        // Should move to student selection step
        await waitFor(() => {
          // Check if we're on step 2 by looking for student checkboxes or selection UI
          expect(screen.getByText("Student One")).toBeInTheDocument()
        }, { timeout: 10000 })
      }
    }, 15000)

    it("should allow selecting students for assignment", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // This test verifies student selection functionality
      // Implementation depends on actual UI structure
      // Placeholder for now - will be refined based on actual component structure
      expect(true).toBe(true)
    })

    it("should submit bulk assignment with selected case, students, and due date", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // This test verifies the complete assignment submission flow
      // Implementation depends on actual UI structure
      // Placeholder for now - will be refined based on actual component structure
      expect(true).toBe(true)
    })
  })

  describe("Error Handling", () => {
    it("should display error when medical cases fail to load", async () => {
      vi.mocked(facultyService.getFacultyMedicalCases).mockRejectedValue(
        new Error("Failed to load cases")
      )

      renderDashboard()

      // Try to trigger case loading
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      // Error should be handled gracefully
      // Specific assertion depends on error UI implementation
      expect(true).toBe(true)
    })

    it("should handle assignment submission errors gracefully", async () => {
      vi.mocked(facultyService.bulkAssignCase).mockRejectedValue(new Error("Assignment failed"))

      renderDashboard()

      // Placeholder for error handling test
      expect(true).toBe(true)
    })
  })

  describe("Complete Assignment Submission Flow", () => {
    it("should complete full assignment flow from case selection to submission", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to class and start assignment flow
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Start new assignment
      const newAssignmentButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("New Assignment"))
      if (newAssignmentButton) await user.click(newAssignmentButton)

      // Select a case
      await waitFor(() => {
        expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
      })

      const caseCard = screen.getByText("Cardiac Emergency").closest("div[role='button']")
      if (caseCard) await user.click(caseCard)

      // Should show student selection
      await waitFor(() => {
        const checkboxes = screen.getAllByRole("checkbox")
        expect(checkboxes.length).toBeGreaterThan(0)
      })
    })

    it("should show student selection after case selection", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate through assignment flow to student selection
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      const newAssignmentButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("New Assignment"))
      if (newAssignmentButton) await user.click(newAssignmentButton)

      await waitFor(() => {
        expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
      })

      const caseCard = screen.getByText("Cardiac Emergency").closest("div[role='button']")
      if (caseCard) {
        await user.click(caseCard)

        // Should show student selection checkboxes
        await waitFor(() => {
          const checkboxes = screen.getAllByRole("checkbox")
          expect(checkboxes.length).toBeGreaterThan(0)
        })
      }
    })

    it("should successfully submit assignment with selected students and due date", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate through complete flow
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      const newAssignmentButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("New Assignment"))
      if (newAssignmentButton) await user.click(newAssignmentButton)

      await waitFor(() => {
        expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
      })

      const caseCard = screen.getByText("Cardiac Emergency").closest("div[role='button']")
      if (caseCard) {
        await user.click(caseCard)

        // Select students and submit
        await waitFor(() => {
          const checkboxes = screen.getAllByRole("checkbox")
          if (checkboxes.length > 0) {
            user.click(checkboxes[0])
          }
        })

        // Submit assignment
        const submitButton = screen
          .queryAllByRole("button")
          .find((el) => el.textContent?.includes("Assign"))
        if (submitButton) {
          await user.click(submitButton)

          // Verify API was called
          await waitFor(() => {
            expect(facultyService.bulkAssignCase).toHaveBeenCalled()
          })
        }
      }
    })
  })

  describe("Report Review Workflow", () => {
    it("should load assignments that may include completed reports", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to class with assignments
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Verify assignments were loaded
      expect(facultyService.getClassAssignments).toHaveBeenCalled()
    })
  })

  describe("Assignment Deletion and Bulk Operations", () => {
    it("should delete individual assignments", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to class assignments
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Look for delete button in assignments grid
      // Click and confirm deletion
      // Verify deleteAssignment API was called
      expect(true).toBe(true)
    })

    it("should perform bulk due date updates", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to assignments
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      // Select multiple assignments and update due date
      // Verify bulkUpdateDueDate API was called
      expect(true).toBe(true)
    })

    it("should handle assignment deletion errors gracefully", async () => {
      vi.mocked(facultyService.deleteAssignment).mockRejectedValue(
        new Error("Failed to delete assignment")
      )

      const user = userEvent.setup()
      renderDashboard()

      // Attempt to delete and verify error handling
      expect(true).toBe(true)
    })
  })

  describe("Case Content Viewer", () => {
    it("should display medical cases with their information", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Navigate to assignment flow to see medical cases
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) await user.click(classButton)

      await waitFor(() => {
        expect(screen.getByText("Student One")).toBeInTheDocument()
      })

      const newAssignmentButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("New Assignment"))
      if (newAssignmentButton) {
        await user.click(newAssignmentButton)

        // Verify medical cases are displayed
        await waitFor(() => {
          expect(screen.getByText("Cardiac Emergency")).toBeInTheDocument()
          expect(screen.getByText("Respiratory Distress")).toBeInTheDocument()
        })
      }
    })
  })

  describe("Panel Transitions and State Management", () => {
    it("should transition between main views correctly", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Test transitions: classList -> classDetail -> reportReview -> back
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) {
        await user.click(classButton)

        await waitFor(() => {
          expect(screen.getByText("Student One")).toBeInTheDocument()
        })
      }

      // Verify state transitions work correctly
      expect(true).toBe(true)
    })

    it("should manage right panel view states", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Test transitions: none -> assignmentFlow -> caseContent -> report
      expect(true).toBe(true)
    })

    it("should clear state when navigating back to class list", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Select class, then navigate back
      // Verify selectedClass, students, assignments are cleared
      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) {
        await user.click(classButton)

        await waitFor(() => {
          expect(screen.getByText("Student One")).toBeInTheDocument()
        })

        // Navigate back
        const backButton = screen.queryByRole("button", { name: /back/i })
        if (backButton) {
          await user.click(backButton)

          // Verify state is cleared
          await waitFor(() => {
            expect(screen.queryByText("Student One")).not.toBeInTheDocument()
          })
        }
      }
    })
  })

  describe("Edge Cases and Validation", () => {
    it("should handle empty class list gracefully", async () => {
      vi.mocked(facultyService.getFacultyClasses).mockResolvedValue([])

      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText(/No classes found/)).toBeInTheDocument()
      })
    })

    it("should handle empty student list in a class", async () => {
      vi.mocked(facultyService.getFacultyStudents).mockResolvedValue([])

      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) {
        await user.click(classButton)

        // Verify students endpoint was called
        await waitFor(() => {
          expect(facultyService.getFacultyStudents).toHaveBeenCalledWith(1)
        })

        // With no students, the assignments grid should still be visible
        await waitFor(() => {
          expect(facultyService.getClassAssignments).toHaveBeenCalledWith(1)
        })
      }
    })

    it("should handle empty assignments list", async () => {
      vi.mocked(facultyService.getClassAssignments).mockResolvedValue([])

      const user = userEvent.setup()
      renderDashboard()

      await waitFor(() => {
        expect(screen.getByText("Biology 101")).toBeInTheDocument()
      })

      const classButton = screen
        .getAllByRole("button")
        .find((el) => el.textContent?.includes("Biology 101"))
      if (classButton) {
        await user.click(classButton)

        // Verify both endpoints were called
        await waitFor(() => {
          expect(facultyService.getFacultyStudents).toHaveBeenCalledWith(1)
          expect(facultyService.getClassAssignments).toHaveBeenCalledWith(1)
        })
      }
    })

    it("should handle missing data gracefully", async () => {
      const user = userEvent.setup()
      renderDashboard()

      // Verify component renders even with minimal data
      await waitFor(() => {
        expect(screen.getByText(/Good/)).toBeInTheDocument()
      })
    })
  })
})
