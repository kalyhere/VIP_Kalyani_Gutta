/**
 * Test Fixtures for AIMMS Web Frontend
 * Mock data for reports, users, assignments, and other entities
 */

import { User } from "@/types/auth"

// ============================================================================
// USER FIXTURES
// ============================================================================

export const mockStudentUser: User = {
  id: 1,
  email: "student@test.com",
  name: "Test Student",
  role: "student",
}

export const mockFacultyUser: User = {
  id: 2,
  email: "faculty@test.com",
  name: "Test Faculty",
  role: "faculty",
}

export const mockAdminUser: User = {
  id: 3,
  email: "admin@test.com",
  name: "Test Admin",
  role: "admin",
}

// ============================================================================
// AIMHEI REPORT FIXTURES
// ============================================================================

export interface AIMHEIReport {
  id: number
  report_name: string
  user_id: number
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  updated_at: string
  hcp_name?: string
  hcp_year?: string
  patient_id?: string
  model?: string
  scores?: {
    overall_score?: number
    category_scores?: Record<string, number>
  }
  rubric_data?: Array<{
    category: string
    score: number
    feedback: string
  }>
}

export const mockAIMHEIReport: AIMHEIReport = {
  id: 101,
  report_name: "Test AIMHEI Report",
  user_id: 1,
  status: "completed",
  created_at: "2025-10-15T10:00:00Z",
  updated_at: "2025-10-15T10:05:00Z",
  hcp_name: "Dr. Smith",
  hcp_year: "2025",
  patient_id: "PAT-001",
  model: "gpt-4o",
  scores: {
    overall_score: 85,
    category_scores: {
      communication: 90,
      empathy: 80,
      clinical_reasoning: 85,
    },
  },
  rubric_data: [
    {
      category: "Communication",
      score: 90,
      feedback: "Excellent communication skills demonstrated",
    },
    {
      category: "Empathy",
      score: 80,
      feedback: "Good empathy, could improve active listening",
    },
    {
      category: "Clinical Reasoning",
      score: 85,
      feedback: "Strong clinical reasoning abilities",
    },
  ],
}

export const mockAIMHEIReportPending: AIMHEIReport = {
  ...mockAIMHEIReport,
  id: 102,
  status: "pending",
  scores: undefined,
  rubric_data: undefined,
}

export const mockAIMHEIReportProcessing: AIMHEIReport = {
  ...mockAIMHEIReport,
  id: 103,
  status: "processing",
  scores: undefined,
  rubric_data: undefined,
}

export const mockAIMHEIReportFailed: AIMHEIReport = {
  ...mockAIMHEIReport,
  id: 104,
  status: "failed",
  scores: undefined,
  rubric_data: undefined,
}

export const mockAIMHEIReportList: AIMHEIReport[] = [
  mockAIMHEIReport,
  mockAIMHEIReportPending,
  mockAIMHEIReportProcessing,
  {
    id: 105,
    report_name: "Another AIMHEI Report",
    user_id: 1,
    status: "completed",
    created_at: "2025-10-14T10:00:00Z",
    updated_at: "2025-10-14T10:05:00Z",
    model: "gpt-4",
    scores: {
      overall_score: 75,
    },
  },
]

// ============================================================================
// SUTURE ANALYSIS FIXTURES
// ============================================================================

export interface SutureAnalysis {
  id: number
  user_id: number
  image_url: string
  status: "pending" | "processing" | "completed" | "failed"
  created_at: string
  detections?: Array<{
    id: number
    bbox: [number, number, number, number] // [x, y, width, height]
    confidence: number
    class: string
  }>
  metrics?: {
    stitch_count: number
    average_spacing: number
    quality_score: number
    symmetry_score: number
  }
}

export const mockSutureAnalysis: SutureAnalysis = {
  id: 201,
  user_id: 1,
  image_url: "/test-suture.jpg",
  status: "completed",
  created_at: "2025-10-15T11:00:00Z",
  detections: [
    {
      id: 1,
      bbox: [100, 150, 50, 30],
      confidence: 0.95,
      class: "suture",
    },
    {
      id: 2,
      bbox: [200, 150, 50, 30],
      confidence: 0.92,
      class: "suture",
    },
    {
      id: 3,
      bbox: [300, 150, 50, 30],
      confidence: 0.88,
      class: "suture",
    },
  ],
  metrics: {
    stitch_count: 3,
    average_spacing: 100,
    quality_score: 85,
    symmetry_score: 90,
  },
}

export const mockSutureAnalysisPending: SutureAnalysis = {
  ...mockSutureAnalysis,
  id: 202,
  status: "pending",
  detections: undefined,
  metrics: undefined,
}

// ============================================================================
// DASHBOARD FIXTURES
// ============================================================================

export interface DashboardStats {
  total_reports: number
  completed_reports: number
  pending_reports: number
  average_score: number
}

export const mockDashboardStats: DashboardStats = {
  total_reports: 25,
  completed_reports: 20,
  pending_reports: 5,
  average_score: 82,
}

export interface ClassAssignment {
  id: number
  name: string
  description: string
  due_date: string
  created_at: string
}

export const mockClassAssignments: ClassAssignment[] = [
  {
    id: 1,
    name: "AIMHEI Assessment 1",
    description: "Complete your first AIMHEI interview",
    due_date: "2025-10-25T23:59:59Z",
    created_at: "2025-10-10T10:00:00Z",
  },
  {
    id: 2,
    name: "Suture Practice",
    description: "Upload your suture practice images",
    due_date: "2025-10-30T23:59:59Z",
    created_at: "2025-10-12T10:00:00Z",
  },
]

// ============================================================================
// API RESPONSE FIXTURES
// ============================================================================

export const mockAuthLoginResponse = {
  access_token: "mock-jwt-token-12345",
  token_type: "bearer",
}

export const mockAuthVerifyResponse = mockStudentUser

// ============================================================================
// FILE UPLOAD FIXTURES
// ============================================================================

export const createMockFile = (
  name: string = "test-file.txt",
  type: string = "text/plain",
  size: number = 1024
): File => {
  const blob = new Blob(["test content"], { type })
  const file = new File([blob], name, { type })

  // Mock file size
  Object.defineProperty(file, "size", {
    value: size,
    writable: false,
  })

  return file
}

export const createMockImageFile = (
  name: string = "test-image.jpg",
  size: number = 1024 * 100 // 100 KB
): File => createMockFile(name, "image/jpeg", size)

export const createMockAudioFile = (
  name: string = "test-audio.mp3",
  size: number = 1024 * 1024 * 5 // 5 MB
): File => createMockFile(name, "audio/mpeg", size)
