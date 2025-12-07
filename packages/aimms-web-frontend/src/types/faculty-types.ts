// Interface definitions for Faculty Dashboard

import { AssignmentStatus } from "../constants/assignmentStatus"

export interface Student {
  id: number
  email: string
  name?: string
  is_active: boolean
  caseAssignments?: Array<{ caseId: number; title: string }>
  progress?: {
    completedCases: number
    totalAssigned: number
    averageScore: number
  }
}

export interface FacultyUser {
  name: string
  email: string
  department: string
  role: string
  stats: {
    totalStudents: number
    activeCases: number
    totalCases: number
    averageCompletion: number
  }
}

export interface FacultyClass {
  id: number
  name: string
  code: string
  term: string
  studentCount: number
  pendingReviews: number
}

export interface AssignmentStudentStatus {
  studentId: number
  studentEmail: string
  studentName: string
  status: AssignmentStatus
  submittedDate?: string
}

export interface ClassAssignmentStatus {
  assignmentId: number
  studentId: number
  studentEmail: string
  studentName: string
  caseId: number
  caseTitle: string
  dueDate: string
  status: AssignmentStatus
  reportId?: number | null
  classId: number
}

export interface RubricItem {
  output: string | null
  criteria: string | null
  explanation: string | null
  line_nums: number[]
  lines: string[]
  section_title: string | null
}

export interface AISPESectionFeedback {
  section_title: string
  strengths: string
  weaknesses: string
  overall_feedback: string
}

export interface AISPEReportData {
  feedback_sections: AISPESectionFeedback[]
  general_summary?: string
}

export interface CompletedReportDetailItem {
  report_id: number
  session_id: number
  case_title: string
  updated_at: string
  percentage_score?: number | null
  total_points_earned?: number | null
  total_points_possible?: number | null
  information_section_score?: number | null
  skill_section_score?: number | null
  medical_terminology_score?: number | null
  politeness_score?: number | null
  empathy_score?: number | null
  unacceptable_areas?: string[] | null
  improvement_areas?: string[] | null
  section_summaries?: { [key: string]: any } | null
  strengths_weaknesses?: {
    [sectionTitle: string]: { strengths: string; weaknesses: string; coaching_tips: string }
  } | null
  rubric_detail?: RubricItem[] | null
  aispe_report_data?: AISPEReportData
  percentile_rank?: number | null
  report_name?: string
}

export type MainView = "classList" | "classDetail" | "reportReview"
export type RightPanelView = "report" | "caseContent" | "none" | "assignmentFlow"
