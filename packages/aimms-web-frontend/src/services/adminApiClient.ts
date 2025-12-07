// Admin-specific API client for user and class management
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

interface CreateUserRequest {
  email: string
  password: string
  name: string
  is_active: boolean
  role: "student" | "faculty" | "admin"
  allowed_apps: string[]
}

interface CreateClassRequest {
  name: string
  code: string
  term: string
  faculty_id: number
  is_active: boolean
}

interface EnrollStudentRequest {
  class_id: number
  student_id: number
}

class AdminApiClient {
  private getAuthHeaders() {
    const token = localStorage.getItem("auth_token")
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }
  }

  async createUser(userData: CreateUserRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/users/register`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(userData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to create user")
    }

    return response.json()
  }

  async createClass(classData: CreateClassRequest): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/classes/`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(classData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to create class")
    }

    return response.json()
  }

  async updateClass(classId: number, classData: Partial<CreateClassRequest>): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(classData),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to update class")
    }

    return response.json()
  }

  async deleteClass(classId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to delete class")
    }

    return response.json()
  }

  async enrollStudent(classId: number, studentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/students/${studentId}`, {
      method: "POST",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to enroll student")
    }

    return response.json()
  }

  async getClasses(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/classes/`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch classes")
    }

    return response.json()
  }

  async getUsers(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch users")
    }

    return response.json()
  }

  async getClassStudents(classId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/students`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch class students")
    }

    return response.json()
  }

  async unenrollStudent(classId: number, studentId: number): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/classes/${classId}/students/${studentId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to unenroll student")
    }

    return response.json()
  }

  async getCurrentUser(): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/users/me`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch current user")
    }

    return response.json()
  }

  async getClassAssignments(classId: number): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/students/assignments/${classId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch class assignments")
    }

    return response.json()
  }

  async getAdminCaseAssignments(classId?: number): Promise<any[]> {
    const response = await fetch(
      `${API_BASE_URL}/api/admin/case-assignments${classId ? `?class_id=${classId}` : ""}`,
      {
        method: "GET",
        headers: this.getAuthHeaders(),
      }
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch case assignments")
    }

    return response.json()
  }

  async getFacultyAssignments(): Promise<any[]> {
    const response = await fetch(`${API_BASE_URL}/api/case-assignments/faculty/`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch faculty assignments")
    }

    return response.json()
  }

  async bulkUpdateAssignmentDueDates(assignmentIds: number[], newDueDate: Date): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/admin/assignments/bulk-update-due-date`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        assignment_ids: assignmentIds,
        due_date: newDueDate.toISOString(),
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to update assignment due dates")
    }

    return response.json()
  }

  async uploadCriteriaJson(file: File): Promise<any> {
    const token = localStorage.getItem("auth_token")
    const formData = new FormData()
    formData.append("file", file)

    const response = await fetch(`${API_BASE_URL}/api/admin/aimhei/upload-criteria`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to upload criteria file")
    }

    return response.json()
  }

  async downloadCriteriaJson(): Promise<Blob> {
    const token = localStorage.getItem("auth_token")
    const response = await fetch(`${API_BASE_URL}/api/admin/aimhei/download-criteria`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to download criteria file")
    }

    return response.blob()
  }

  async exportReportsCSV(reportIds?: number[]): Promise<Blob> {
    const token = localStorage.getItem("auth_token")
    const url =      reportIds && reportIds.length > 0
        ? `${API_BASE_URL}/api/admin/aimhei/reports/export/csv?report_ids=${reportIds.join(",")}`
        : `${API_BASE_URL}/api/admin/aimhei/reports/export/csv`

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to export reports")
    }

    return response.blob()
  }

  // === Report Organization Methods ===

  async updateReportFolder(reportId: number, folder: string | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/${reportId}/folder`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ folder }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to update folder")
    }

    return response.json()
  }

  async bulkSetFolder(reportIds: number[], folder: string | null): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/bulk-set-folder`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ report_ids: reportIds, folder }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to set folder")
    }

    return response.json()
  }

  async getAllFolders(): Promise<string[]> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/folders`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch folders")
    }

    const data = await response.json()
    return data.folders
  }

  async getFolderCounts(): Promise<{
    folder_counts: Record<string, number>
    total_reports: number
    unorganized_count: number
  }> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/folders/counts`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to fetch folder counts")
    }

    return response.json()
  }

  async createFolder(
    name: string,
  ): Promise<{ message: string; folder: { id: number; name: string } }> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/folders/create`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ name }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to create folder")
    }

    return response.json()
  }

  async renameFolder(
    oldName: string,
    newName: string,
  ): Promise<{ message: string; reports_updated: number }> {
    const response = await fetch(`${API_BASE_URL}/api/aimhei-reports/folders/rename`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ old_name: oldName, new_name: newName }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to rename folder")
    }

    return response.json()
  }

  async deleteFolder(folderName: string): Promise<{ message: string }> {
    const response = await fetch(
      `${API_BASE_URL}/api/aimhei-reports/folders/${encodeURIComponent(folderName)}`,
      {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      },
    )

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || "Failed to delete folder")
    }

    return response.json()
  }
}

export const adminApiClient = new AdminApiClient()
