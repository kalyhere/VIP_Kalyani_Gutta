/**
 * Mock Service Worker (MSW) Handlers
 * Intercepts API calls during tests and returns mock data
 */

import { http, HttpResponse, delay } from "msw"
import {
  mockAuthLoginResponse,
  mockAuthVerifyResponse,
  mockStudentUser,
  mockFacultyUser,
  mockAdminUser,
  mockAIMHEIReport,
  mockAIMHEIReportList,
  mockAIMHEIReportPending,
  mockAIMHEIReportProcessing,
  mockSutureAnalysis,
  mockSutureAnalysisPending,
  mockDashboardStats,
  mockClassAssignments,
} from "./testFixtures"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

// ============================================================================
// AUTH HANDLERS
// ============================================================================

export const authHandlers = [
  // Login endpoint
  http.post(`${API_URL}/auth/login`, async ({ request }) => {
    await delay(100) // Simulate network delay

    const body = await request.text()
    const params = new URLSearchParams(body)
    const username = params.get("username")
    const password = params.get("password")

    // Mock authentication logic
    if (username === "student@test.com" && password === "password") {
      return HttpResponse.json(mockAuthLoginResponse)
    }

    if (username === "faculty@test.com" && password === "password") {
      return HttpResponse.json({ ...mockAuthLoginResponse, access_token: "faculty-token" })
    }

    if (username === "admin@test.com" && password === "password") {
      return HttpResponse.json({ ...mockAuthLoginResponse, access_token: "admin-token" })
    }

    // Invalid credentials
    return HttpResponse.json({ detail: "Invalid username or password" }, { status: 401 })
  }),

  // Verify token endpoint
  http.post(`${API_URL}/auth/verify`, async ({ request }) => {
    await delay(50)

    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!token) {
      return HttpResponse.json({ detail: "No token provided" }, { status: 401 })
    }

    // Return different users based on token
    if (token.includes("student") || token === "mock-jwt-token-12345") {
      return HttpResponse.json(mockStudentUser)
    }

    if (token.includes("faculty")) {
      return HttpResponse.json(mockFacultyUser)
    }

    if (token.includes("admin")) {
      return HttpResponse.json(mockAdminUser)
    }

    return HttpResponse.json({ detail: "Invalid token" }, { status: 401 })
  }),

  // Logout endpoint
  http.post(`${API_URL}/auth/logout`, async () => {
    await delay(50)
    return HttpResponse.json({ message: "Logged out successfully" })
  }),
]

// ============================================================================
// AIMHEI REPORT HANDLERS
// ============================================================================

export const aimheiHandlers = [
  // Get all AIMHEI reports
  http.get(`${API_URL}/aimhei/reports`, async ({ request }) => {
    await delay(100)

    const url = new URL(request.url)
    const limit = parseInt(url.searchParams.get("limit") || "50")
    const offset = parseInt(url.searchParams.get("offset") || "0")

    const paginatedReports = mockAIMHEIReportList.slice(offset, offset + limit)

    return HttpResponse.json({
      reports: paginatedReports,
      total: mockAIMHEIReportList.length,
      limit,
      offset,
    })
  }),

  // Get single AIMHEI report by ID
  http.get(`${API_URL}/aimhei/reports/:reportId`, async ({ params }) => {
    await delay(100)

    const { reportId } = params
    const id = parseInt(reportId as string)

    const report = mockAIMHEIReportList.find((r) => r.id === id) || mockAIMHEIReport

    return HttpResponse.json(report)
  }),

  // Create new AIMHEI report
  http.post(`${API_URL}/aimhei/reports`, async ({ request }) => {
    await delay(200)

    const formData = await request.formData()
    const reportName = formData.get("report_name") as string

    const newReport = {
      ...mockAIMHEIReportPending,
      id: Math.floor(Math.random() * 10000),
      report_name: reportName || "New Report",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    return HttpResponse.json(newReport, { status: 201 })
  }),

  // Upload file for AIMHEI report
  http.post(`${API_URL}/aimhei/reports/:reportId/upload`, async ({ params }) => {
    await delay(500) // Simulate file upload

    const { reportId } = params

    return HttpResponse.json({
      report_id: parseInt(reportId as string),
      status: "processing",
      message: "File uploaded successfully",
    })
  }),

  // Delete AIMHEI report
  http.delete(`${API_URL}/aimhei/reports/:reportId`, async ({ params }) => {
    await delay(100)

    return HttpResponse.json({
      message: "Report deleted successfully",
      id: parseInt(params.reportId as string),
    })
  }),

  // Update AIMHEI report
  http.put(`${API_URL}/aimhei/reports/:reportId`, async ({ params, request }) => {
    await delay(100)

    const updates = await request.json()

    return HttpResponse.json({
      ...mockAIMHEIReport,
      id: parseInt(params.reportId as string),
      ...updates,
      updated_at: new Date().toISOString(),
    })
  }),

  // Share AIMHEI report
  http.post(`${API_URL}/aimhei/reports/:reportId/share`, async ({ params }) => {
    await delay(100)

    const shareToken = `share-token-${params.reportId}-${Date.now()}`

    return HttpResponse.json({
      share_token: shareToken,
      share_url: `${window.location.origin}/shared-report/${shareToken}`,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    })
  }),
]

// ============================================================================
// SUTURE ANALYSIS HANDLERS
// ============================================================================

export const sutureHandlers = [
  // Get all suture analyses
  http.get(`${API_URL}/suture/analyses`, async () => {
    await delay(100)

    return HttpResponse.json({
      analyses: [mockSutureAnalysis, mockSutureAnalysisPending],
      total: 2,
    })
  }),

  // Get single suture analysis
  http.get(`${API_URL}/suture/analyses/:analysisId`, async ({ params }) => {
    await delay(100)

    return HttpResponse.json({
      ...mockSutureAnalysis,
      id: parseInt(params.analysisId as string),
    })
  }),

  // Create new suture analysis
  http.post(`${API_URL}/suture/analyses`, async () => {
    await delay(500) // Simulate image processing

    return HttpResponse.json(mockSutureAnalysis, { status: 201 })
  }),

  // Upload image for suture analysis
  http.post(`${API_URL}/suture/upload`, async () => {
    await delay(300)

    return HttpResponse.json({
      analysis_id: Math.floor(Math.random() * 10000),
      status: "processing",
      message: "Image uploaded successfully",
    })
  }),
]

// ============================================================================
// DASHBOARD HANDLERS
// ============================================================================

export const dashboardHandlers = [
  // Get dashboard stats
  http.get(`${API_URL}/dashboard/stats`, async () => {
    await delay(100)

    return HttpResponse.json(mockDashboardStats)
  }),

  // Get class assignments
  http.get(`${API_URL}/assignments`, async () => {
    await delay(100)

    return HttpResponse.json({
      assignments: mockClassAssignments,
      total: mockClassAssignments.length,
    })
  }),

  // Get users (admin/faculty)
  http.get(`${API_URL}/users`, async () => {
    await delay(100)

    return HttpResponse.json({
      users: [mockStudentUser, mockFacultyUser, mockAdminUser],
      total: 3,
    })
  }),
]

// ============================================================================
// ERROR SIMULATION HANDLERS
// ============================================================================

// These handlers can be used to test error states
export const errorHandlers = {
  networkError: http.get(`${API_URL}/*`, () => HttpResponse.error()),

  serverError: http.get(`${API_URL}/*`, () =>
    HttpResponse.json({ detail: "Internal server error" }, { status: 500 })
  ),

  unauthorized: http.get(`${API_URL}/*`, () =>
    HttpResponse.json({ detail: "Unauthorized" }, { status: 401 })
  ),

  notFound: http.get(`${API_URL}/*`, () =>
    HttpResponse.json({ detail: "Not found" }, { status: 404 })
  ),
}

// ============================================================================
// COMBINED HANDLERS (DEFAULT)
// ============================================================================

export const handlers = [
  ...authHandlers,
  ...aimheiHandlers,
  ...sutureHandlers,
  ...dashboardHandlers,
]
