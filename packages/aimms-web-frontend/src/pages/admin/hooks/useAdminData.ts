import { useState, useEffect, useCallback } from "react"
import { apiClient } from "../../services/apiClient"

export interface PlatformStats {
  totalUsers: number
  activeUsers: number
  totalFaculty: number
  totalStudents: number
  totalCases: number
  publicCases: number
  activeSessions: number
  totalAssignments: number
  completedAssignments: number
  totalClasses: number
  recentLogins: number
  systemStatus: "healthy" | "warning" | "error"
  trends: {
    userGrowth: number
    caseGrowth: number
    activeUsersGrowth: number
  }
}

export interface AppMetrics {
  aimmsWeb: {
    dailyLogins: number[]
    weeklyActiveUsers: number
    permissionChanges: number
    lastUpdated: string
  }
  mcc: {
    casesCreated: number
    casesEdited: number
    averageComplexity: number
    popularCases: Array<{ id: number; title: string; uses: number }>
  }
  virtualPatient: {
    activeSessions: number
    completedSessions: number
    averageSessionTime: number
    diagnosisAccuracy: number
    studentProgress: Array<{ studentId: string; progress: number }>
  }
  aimhei: {
    submissions: number
    averageScore: number
    completionRate: number
  }
  suture: {
    analyses: number
    averageScore: number
    improvementRate: number
  }
}

export interface ActivityItem {
  id: string
  type: "login" | "case_created" | "assignment" | "system" | "session" | "submission"
  user: string
  action: string
  timestamp: string
  status: "success" | "warning" | "error"
  metadata?: any
}

export interface UserMetrics {
  roleDistribution: { role: string; count: number }[]
  activityByHour: { hour: number; count: number }[]
  topActiveUsers: { id: number; name: string; actions: number }[]
  newUsersThisWeek: number
}

export const useAdminData = (refreshInterval: number = 60000) => {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [appMetrics, setAppMetrics] = useState<AppMetrics | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [userMetrics, setUserMetrics] = useState<UserMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPlatformStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/admin/stats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch stats")

      const data = await response.json()
      setStats(data)
    } catch (err) {
      console.error("Error fetching platform stats:", err)
      throw err
    }
  }, [])

  const fetchActivities = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/admin/recent-activity?limit=50`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error("Failed to fetch activities")

      const data = await response.json()
      setActivities(data)
    } catch (err) {
      console.error("Error fetching activities:", err)
      throw err
    }
  }, [])

  const fetchAppMetrics = useCallback(async () => {
    // Only update if we don't have app metrics yet or if stats changed
    if (!appMetrics || !stats) {
      const mockAppMetrics: AppMetrics = {
        aimmsWeb: {
          dailyLogins: [45, 52, 38, 65, 72, 58, 61],
          weeklyActiveUsers: 342,
          permissionChanges: 12,
          lastUpdated: new Date().toISOString(),
        },
        mcc: {
          casesCreated: stats?.totalCases || 87,
          casesEdited: 23,
          averageComplexity: 3.7,
          popularCases: [
            { id: 1, title: "Chest Pain Evaluation", uses: 145 },
            { id: 2, title: "Diabetes Management", uses: 132 },
            { id: 3, title: "Hypertension Workup", uses: 98 },
            { id: 4, title: "Abdominal Pain Differential", uses: 87 },
            { id: 5, title: "Respiratory Infection Assessment", uses: 76 },
          ],
        },
        virtualPatient: {
          activeSessions: stats?.activeSessions || 12,
          completedSessions: 145,
          averageSessionTime: 28.5,
          diagnosisAccuracy: 82.3,
          studentProgress: [
            { studentId: "student1", progress: 75 },
            { studentId: "student2", progress: 88 },
            { studentId: "student3", progress: 92 },
            { studentId: "student4", progress: 67 },
            { studentId: "student5", progress: 79 },
          ],
        },
        aimhei: {
          submissions: 34,
          averageScore: 78.5,
          completionRate: 89.2,
        },
        suture: {
          analyses: 56,
          averageScore: 84.2,
          improvementRate: 15.3,
        },
      }

      setAppMetrics(mockAppMetrics)
    }
  }, [stats, appMetrics])

  const fetchUserMetrics = useCallback(async () => {
    // Only update if we don't have user metrics yet or if stats changed
    if (!userMetrics || !stats) {
      const mockUserMetrics: UserMetrics = {
        roleDistribution: [
          { role: "Students", count: stats?.totalStudents || 250 },
          { role: "Faculty", count: stats?.totalFaculty || 45 },
          { role: "Admins", count: 8 },
        ],
        activityByHour: [
          { hour: 0, count: 15 },
          { hour: 1, count: 8 },
          { hour: 2, count: 5 },
          { hour: 3, count: 3 },
          { hour: 4, count: 2 },
          { hour: 5, count: 4 },
          { hour: 6, count: 12 },
          { hour: 7, count: 25 },
          { hour: 8, count: 45 },
          { hour: 9, count: 52 },
          { hour: 10, count: 48 },
          { hour: 11, count: 42 },
          { hour: 12, count: 38 },
          { hour: 13, count: 44 },
          { hour: 14, count: 50 },
          { hour: 15, count: 46 },
          { hour: 16, count: 40 },
          { hour: 17, count: 35 },
          { hour: 18, count: 28 },
          { hour: 19, count: 22 },
          { hour: 20, count: 18 },
          { hour: 21, count: 14 },
          { hour: 22, count: 10 },
          { hour: 23, count: 8 },
        ],
        topActiveUsers: [
          { id: 1, name: "Dr. Sarah Johnson", actions: 234 },
          { id: 2, name: "Prof. Michael Chen", actions: 189 },
          { id: 3, name: "Dr. Emily Rodriguez", actions: 167 },
          { id: 4, name: "John Smith (Student)", actions: 145 },
          { id: 5, name: "Lisa Wang (Student)", actions: 132 },
        ],
        newUsersThisWeek: 18,
      }

      setUserMetrics(mockUserMetrics)
    }
  }, [stats, userMetrics])

  const fetchAllData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Only fetch platform stats and activities from API
      await Promise.all([fetchPlatformStats(), fetchActivities()])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard data")
    } finally {
      setLoading(false)
    }
  }, [fetchPlatformStats, fetchActivities])

  // Separate effect to fetch mock data only when stats change
  useEffect(() => {
    if (stats && !loading) {
      fetchAppMetrics()
      fetchUserMetrics()
    }
  }, [stats, loading, fetchAppMetrics, fetchUserMetrics])

  const refreshData = useCallback(() => {
    fetchAllData()
  }, [fetchAllData])

  useEffect(() => {
    fetchAllData()

    // Set up auto-refresh
    const interval = setInterval(fetchAllData, refreshInterval)

    return () => clearInterval(interval)
  }, [fetchAllData, refreshInterval])

  return {
    stats,
    appMetrics,
    activities,
    userMetrics,
    loading,
    error,
    refreshData,
  }
}

export const formatTimeAgo = (isoString: string) => {
  const date = new Date(isoString)
  const now = new Date()
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) return "Just now"
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`

  return date.toLocaleDateString()
}

export const getStatusColor = (status: string) => {
  const colors = {
    healthy: "#1B5E20",
    success: "#1B5E20",
    warning: "#F57C00",
    error: "#AB0520",
    info: "#1E5288",
  }
  return colors[status as keyof typeof colors] || "#757575"
}

export const exportToCSV = (data: any[], filename: string) => {
  const csv = convertToCSV(data)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const link = document.createElement("a")

  if (navigator.msSaveBlob) {
    navigator.msSaveBlob(blob, filename)
  } else {
    link.href = URL.createObjectURL(blob)
    link.download = filename
    link.click()
  }
}

const convertToCSV = (data: any[]) => {
  if (!data.length) return ""

  const headers = Object.keys(data[0])
  const csv = [
    headers.join(","),
    ...data.map((row) =>
      headers
      .map((header) => {
        const value = row[header]
        return typeof value === "string" && value.includes(",") ? `"${value}"` : value
      })
      .join(",")
    ),
  ].join("\n")

  return csv
}
