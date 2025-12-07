import { ClassAssignmentStatus } from "../types/faculty-types"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export const fetchFacultyAssignments = async (
  classId: number
): Promise<ClassAssignmentStatus[]> => {
  const response = await fetch(`${API_URL}/api/case-assignments/faculty/`, {
    headers: {
      Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
    },
  })

  if (!response.ok) {
    throw new Error("Failed to fetch faculty assignments")
  }

  const data = await response.json()

  // Transform the API response to match our ClassAssignmentStatus type
  return data.map((assignment: any) => ({
    assignmentId: assignment.id,
    studentId: assignment.student.id,
    studentName: assignment.student.email.split("@")[0], // Use email username as display name
    studentEmail: assignment.student.email,
    caseId: assignment.case.id,
    caseTitle: assignment.case.title,
    dueDate: assignment.due_date,
    status: determineAssignmentStatus(assignment),
    reportId: assignment.report_id || null,
    classId, // Add class ID from parameter
  }))
}

// Helper function to determine assignment status based on API data
const determineAssignmentStatus = (assignment: any): ClassAssignmentStatus["status"] => {
  // First check if there's a direct status field
  if (assignment.status) {
    return assignment.status as ClassAssignmentStatus["status"]
  }

  // Fallback to session_status if status is not available
  if (assignment.session_status === "completed") {
    return assignment.report_id ? "reviewed" : "pending_review"
  }
  if (assignment.session_status === "in_progress") {
    return "in_progress"
  }
  if (assignment.due_date && new Date(assignment.due_date) < new Date()) {
    return "late"
  }
  return "not_started"
}
