import { useState } from "react"
import dayjs, { Dayjs } from "dayjs"
import { MedicalCase } from "../../types/medical-cases"

export function useAssignmentFlow() {
  const [activeStep, setActiveStep] = useState(0)
  const [selectedCaseForAssignment, setSelectedCaseForAssignment] = useState<MedicalCase | null>(
    null
  )
  const [selectedStudents, setSelectedStudents] = useState<number[]>([])
  const [assignmentDueDate, setAssignmentDueDate] = useState<Dayjs>(() => dayjs().add(7, "day"))
  const [viewerContent, setViewerContent] = useState<any | null>(null)

  const handleCaseSelect = (caseItem: MedicalCase) => {
    setSelectedCaseForAssignment(caseItem)
    setActiveStep(1)

    // Extract content for the right panel
    let parsedContent: any = null
    try {
      if (typeof caseItem.content === "string") {
        parsedContent = JSON.parse(caseItem.content)
      } else if (typeof caseItem.content === "object" && caseItem.content !== null) {
        parsedContent = caseItem.content
      }
    } catch (e) {
      console.error("Failed to parse case content:", e)
    }

    setViewerContent(parsedContent)
  }

  const handleStudentToggle = (studentId: number, assignableIds?: number[]) => {
    if (assignableIds && assignableIds.length > 0) {
      // If assignableIds provided, only allow selection if student is in that list
      if (!assignableIds.includes(studentId)) {
        return
      }
    }

    setSelectedStudents((prev) =>
      prev.includes(studentId) ? prev.filter((id) => id !== studentId) : [...prev, studentId]
    )
  }

  const handleSelectAllStudents = (allStudentIds: number[]) => {
    if (selectedStudents.length === allStudentIds.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(allStudentIds)
    }
  }

  const resetFlow = () => {
    setActiveStep(0)
    setSelectedCaseForAssignment(null)
    setSelectedStudents([])
    setAssignmentDueDate(dayjs().add(7, "day"))
    setViewerContent(null)
  }

  const cancelFlow = () => {
    resetFlow()
  }

  return {
    activeStep,
    setActiveStep,
    selectedCaseForAssignment,
    selectedStudents,
    assignmentDueDate,
    setAssignmentDueDate,
    viewerContent,
    setViewerContent,
    handleCaseSelect,
    handleStudentToggle,
    handleSelectAllStudents,
    resetFlow,
    cancelFlow,
  }
}
