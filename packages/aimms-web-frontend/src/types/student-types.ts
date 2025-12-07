// Interface definitions for Student Dashboard

import { AssignmentStatus } from "../../constants/assignmentStatus"

export interface StudentClass {
  id: number
  name: string
  code: string
  term: string
  faculty_name?: string
  faculty_email?: string
  assignedCases: number
  completedCases: number
  pendingReports: number
}

export interface StudentCaseAssignment {
  assignmentId: number
  caseId: number
  caseTitle: string
  classId: number
  className: string
  facultyName?: string
  dueDate: string | null
  status: AssignmentStatus
  reportId: number | null
  score?: number | null
  assignedDate: string
  submittedDate?: string | null
  learning_objectives?: string[]
  description?: string
}

export interface StudentUser {
  id: number
  email: string
  name: string
  role: string
  stats: StudentStats
}

export interface StudentStats {
  totalAssigned: number
  completed: number
  averageScore: number
  pendingReports: number
}

export interface VirtualPatientLaunchData {
  launchUrl: string
  token: string
  expiresAt: string | null
  canResume: boolean
  assignmentStatus: string
}
