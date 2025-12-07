import { FacultyUser, Student, ClassAssignmentStatus, FacultyClass } from "@/types/faculty-types"
import { MedicalCase } from "../../types/medical-cases"
import { api } from "./api"
import { AssignmentStatus } from "../../constants/assignmentStatus"

interface FacultyAssignmentResponse {
  id: number
  due_date: string
  assigned_date: string
  case: {
    id: number
    title: string
  }
  student: {
    id: number
    email: string
    name: string | null
  }
  faculty: {
    id: number
    email: string
    name: string | null
  }
  status: string | null
  report_id: number | null
}

function transformAssignmentToStatus(
  assignment: FacultyAssignmentResponse,
  classId: number
): ClassAssignmentStatus {
  let status: AssignmentStatus = "not_started"

  if (assignment.status === "COMPLETED") {
    status = "pending_review"
  } else if (assignment.status === "ACTIVE") {
    status = "in_progress"
  }

  return {
    assignmentId: assignment.id,
    studentId: assignment.student.id,
    studentEmail: assignment.student.email,
    studentName: assignment.student.name || assignment.student.email,
    caseId: assignment.case.id,
    caseTitle: assignment.case.title,
    dueDate: assignment.due_date,
    status,
    reportId: assignment.report_id,
    classId,
  }
}

export async function getFacultyAssignments(classId: number): Promise<ClassAssignmentStatus[]> {
  const response = await api.get<FacultyAssignmentResponse[]>("/api/case-assignments/faculty/")
  return response.data.map((assignment: FacultyAssignmentResponse) =>
    transformAssignmentToStatus(assignment, classId)
  )
}

export const getClassAssignments = async (classId: number): Promise<ClassAssignmentStatus[]> => {
  const response = await api.get<any[]>(`/api/classes/${classId}/assignments`)

  const assignments = response.data.map((assignment) => ({
    assignmentId: assignment.id,
    studentId: assignment.student_id,
    studentEmail: assignment.student.email,
    studentName: assignment.student.name || assignment.student.email.split("@")[0],
    caseId: assignment.case_id,
    caseTitle: assignment.case.title,
    dueDate: assignment.due_date,
    status: assignment.status,
    reportId: assignment.report_id,
    classId: assignment.class_id,
  }))

  return assignments
}

export const getFacultyStudents = async (classId: number): Promise<Student[]> => {
  if (!classId) {
    console.warn("No class ID provided for getFacultyStudents")
    return []
  }

  try {
    // Use POST request to send class_id in the body
    const response = await api.post<any[]>("/api/users/faculty/students", { class_id: classId })
    return response.data.map((student) => ({
      id: student.id,
      email: student.email,
      name: student.name || student.email.split("@")[0],
      is_active: student.is_active,
      caseAssignments: student.case_assignments || [], // Use case assignments from backend
      progress: {
        completedCases: 0,
        totalAssigned: student.case_assignments?.length || 0,
        averageScore: 0,
      },
    }))
  } catch (error) {
    console.error("Failed to fetch students:", error)
    throw error
  }
}

export async function getFacultyStats(): Promise<FacultyUser> {
  const response = await api.get<FacultyUser>("/api/users/faculty/stats")
  return response.data
}

interface BulkAssignmentResponse {
  success: boolean
  message: string
  assignments: Array<{
    id: number
    case_id: number
    student_id: number
    faculty_id: number
    assigned_date: string
    due_date: string | null
    case: {
      id: number
      title: string
    }
    student: {
      id: number
      email: string
      name: string | null
    }
    faculty: {
      id: number
      email: string
      name: string | null
    }
  }>
  errors?: Array<{
    student_id: number
    error: string
  }>
}

/**
 * Assign a case to multiple students at once
 * @param caseId The ID of the case to assign
 * @param studentIds Array of student IDs to assign the case to
 * @param classId The ID of the class to which the case belongs
 * @param dueDate Optional due date for the assignments
 * @returns Promise with the bulk assignment response
 */
export const bulkAssignCase = async (
  caseId: number,
  studentIds: number[],
  classId: number,
  dueDate?: Date
): Promise<BulkAssignmentResponse> => {
  try {
    const response = await api.post<BulkAssignmentResponse>("/api/case-assignments/bulk", {
      case_id: caseId,
      class_id: classId,
      student_ids: studentIds,
      due_date: dueDate?.toISOString(), // Convert Date to ISO string for API
    })
    return response.data
  } catch (error) {
    console.error("Error in bulkAssignCase:", error)
    throw error
  }
}

/**
 * Delete a case assignment
 * @param classId The ID of the class
 * @param assignmentId The ID of the assignment to delete
 * @returns Promise with success message
 */
export const deleteAssignment = async (
  classId: number,
  assignmentId: number
): Promise<{ message: string }> => {
  try {
    const response = await api.delete<{ message: string }>(
      `/api/classes/${classId}/assignments/${assignmentId}`
    )
    return response.data
  } catch (error) {
    console.error("Error in deleteAssignment:", error)
    throw error
  }
}

/**
 * Update due date for a single assignment
 * @param classId The ID of the class
 * @param assignmentId The ID of the assignment to update
 * @param newDueDate The new due date
 * @returns Promise with success message
 */
export const updateAssignmentDueDate = async (
  classId: number,
  assignmentId: number,
  newDueDate: Date
): Promise<{ message: string }> => {
  try {
    const response = await api.put<{ message: string }>(
      `/api/classes/${classId}/assignments/${assignmentId}`,
      {
        due_date: newDueDate.toISOString(),
      }
    )
    return response.data
  } catch (error) {
    console.error("Error in updateAssignmentDueDate:", error)
    throw error
  }
}

/**
 * Bulk update due dates for multiple assignments (using individual requests)
 * @param classId The ID of the class
 * @param assignmentIds Array of assignment IDs to update
 * @param newDueDate The new due date for all assignments
 * @returns Promise with success message
 */
export const bulkUpdateDueDate = async (
  classId: number,
  assignmentIds: number[],
  newDueDate: Date
): Promise<{ message: string }> => {
  try {
    // Update each assignment individually since bulk endpoint doesn't exist
    const updatePromises = assignmentIds.map((assignmentId) =>
      updateAssignmentDueDate(classId, assignmentId, newDueDate)
    )

    await Promise.all(updatePromises)

    return {
      message: `Successfully updated due dates for ${assignmentIds.length} assignment${assignmentIds.length !== 1 ? "s" : ""}`,
    }
  } catch (error) {
    console.error("Error in bulkUpdateDueDate:", error)
    throw error
  }
}

export const getFacultyMedicalCases = async (): Promise<MedicalCase[]> => {
  try {
    const response = await api.get<MedicalCase[]>("/api/medical-cases/")
    return response.data
  } catch (error) {
    console.error("Failed to fetch medical cases:", error)
    throw error
  }
}

export const getFacultyClasses = async (): Promise<FacultyClass[]> => {
  const response = await api.get<any[]>("/api/classes/")

  // Get assignments for each class to count pending reviews
  const classesWithPendingReviews = await Promise.all(
    response.data.map(async (classData) => {
      // Get assignments for this class
      const assignments = await getClassAssignments(classData.id)

      // Count pending reviews (assignments with status 'Pending Review')
      const pendingReviews = assignments.filter(
        (assignment) => assignment.status === "pending_review"
      ).length

      // Get student count from class_enrollment
      const studentCount = classData.student_count || 0

      return {
        id: classData.id,
        name: classData.name,
        code: classData.code,
        term: classData.term,
        studentCount,
        pendingReviews,
      }
    })
  )

  return classesWithPendingReviews
}

interface AssignmentResponse {
  id: number
  student_id: number
  case_id: number
  due_date: string
  status: AssignmentStatus | null
  score?: number | null
  report_id?: number | null
}
