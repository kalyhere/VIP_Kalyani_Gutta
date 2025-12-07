import {
  StudentUser,
  StudentClass,
  StudentCaseAssignment,
  VirtualPatientLaunchData,
} from "@/types/student-types"
import { api } from "./api"
import { AssignmentStatus } from "../../constants/assignmentStatus"

/**
 * Get student stats and profile information
 */
export const getStudentStats = async (): Promise<StudentUser> => {
  try {
    const response = await api.get<any>("/api/students/stats")
    return response.data
  } catch (error) {
    console.error("Error fetching student stats:", error)
    throw error
  }
}

/**
 * Get all classes for the current student
 */
export const getStudentClasses = async (): Promise<StudentClass[]> => {
  try {
    const response = await api.get<StudentClass[]>("/api/students/classes")
    return response.data
  } catch (error) {
    console.error("Error fetching student classes:", error)
    throw error
  }
}

/**
 * Get assignments for a specific class or all assignments with pagination and filters
 */
export const getStudentAssignments = async (
  classId?: number,
  page: number = 0,
  limit: number = 5,
  statusFilter?: string,
  dueDateFilter?: string
): Promise<{ data: StudentCaseAssignment[]; total: number; page: number; limit: number }> => {
  try {
    const url = classId ? `/api/students/assignments/${classId}` : "/api/students/assignments"
    const params: any = { page, limit }

    // Add filters if provided
    if (statusFilter && statusFilter !== "all") {
      params.status_filter = statusFilter
    }
    if (dueDateFilter && dueDateFilter !== "all") {
      params.due_date_filter = dueDateFilter
    }

    const response = await api.get<{
      data: any[]
      total: number
      page: number
      limit: number
    }>(url, {
      params,
    })

    // Backend returns {data, total, page, limit} directly in response.data
    const paginatedResponse = response.data

    // Transform the response to match our frontend types
    const data = paginatedResponse.data.map((assignment: any) => ({
      assignmentId: assignment.assignmentId,
      caseId: assignment.caseId,
      caseTitle: assignment.caseTitle,
      classId: assignment.classId,
      className: assignment.className,
      facultyName: assignment.facultyName,
      dueDate: assignment.dueDate,
      status: assignment.status as AssignmentStatus,
      reportId: assignment.reportId,
      score: assignment.score,
      assignedDate: assignment.assignedDate,
      submittedDate: assignment.submittedDate,
      learning_objectives: assignment.learning_objectives || [],
      description: assignment.description,
    }))

    return {
      data,
      total: paginatedResponse.total,
      page: paginatedResponse.page,
      limit: paginatedResponse.limit,
    }
  } catch (error) {
    console.error("Error fetching student assignments:", error)
    throw error
  }
}

/**
 * Launch virtual patient for an assignment
 */
export const launchVirtualPatient = async (
  assignmentId: number
): Promise<VirtualPatientLaunchData> => {
  try {
    const response = await api.post<VirtualPatientLaunchData>(
      `/api/students/assignments/${assignmentId}/launch`
    )
    return response.data
  } catch (error) {
    console.error("Error launching virtual patient:", error)
    throw error
  }
}

/**
 * Get session status
 */
export const getSessionStatus = async (sessionId: string) => {
  try {
    const response = await api.get<any>(`/api/students/sessions/${sessionId}/status`)
    return response.data
  } catch (error) {
    console.error("Error getting session status:", error)
    throw error
  }
}

/**
 * Get student report (read-only)
 */
export const getStudentReport = async (reportId: number) => {
  try {
    const response = await api.get<any>(`/api/students/reports/${reportId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching student report:", error)
    throw error
  }
}

/**
 * Get case details for a student (only if assigned)
 */
export const getStudentCaseDetails = async (caseId: number) => {
  try {
    const response = await api.get<any>(`/api/students/cases/${caseId}`)
    return response.data
  } catch (error) {
    console.error("Error fetching case details:", error)
    throw error
  }
}
