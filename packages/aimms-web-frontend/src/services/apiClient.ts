import queryString from "query-string"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = "ApiError"
  }
}

// Create a custom HTTP client that includes the auth token
const httpClient = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem("auth_token")

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  // Remove Content-Type for FormData requests
  if (options.body instanceof FormData) {
    delete headers["Content-Type"]
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Request failed" }))
    throw new ApiError(error.detail || `HTTP ${response.status}`, response.status, error)
  }

  const contentType = response.headers.get("content-type")
  if (contentType && contentType.includes("application/json")) {
    return response.json()
  }

  return response
}

export interface ListParams {
  pagination?: {
    page: number
    perPage: number
  }
  sort?: {
    field: string
    order: "asc" | "desc"
  }
  filter?: Record<string, any>
  signal?: AbortSignal
}

export interface ListResponse<T> {
  data: T[]
  total: number
}

export class ApiClient {
  // Get a list of resources
  async getList<T>(resource: string, params: ListParams = {}): Promise<ListResponse<T>> {
    const { pagination = { page: 1, perPage: 10 }, sort, filter = {}, signal } = params
    const { page, perPage } = pagination

    const query: Record<string, any> = {
      skip: (page - 1) * perPage,
      limit: perPage,
      filter: JSON.stringify(filter),
    }

    if (sort) {
      query.sort = JSON.stringify([sort.field, sort.order])
    }

    const url = `${API_URL}/${resource}?${queryString.stringify(query)}`
    const response = await fetch(url, {
      headers: this.getAuthHeaders(),
      signal,
    })

    if (!response.ok) {
      throw new ApiError(`Failed to fetch ${resource}`, response.status)
    }

    const data = await response.json()
    const contentRange = parseInt(response.headers.get("content-range") || "10")

    return {
      data,
      total: contentRange,
    }
  }

  // Get a single resource
  async getOne<T>(resource: string, id: string | number, signal?: AbortSignal): Promise<T> {
    const url = `${API_URL}/${resource}/${id}`
    return httpClient(url, { signal })
  }

  // Get many resources by IDs
  async getMany<T>(resource: string, ids: (string | number)[], signal?: AbortSignal): Promise<T[]> {
    const query = {
      filter: JSON.stringify({ ids }),
    }
    const url = `${API_URL}/${resource}?${queryString.stringify(query)}`
    return httpClient(url, { signal })
  }

  // Create a new resource
  async create<T>(resource: string, data: any): Promise<T> {
    const url = `${API_URL}/${resource}`
    return httpClient(url, {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Update a resource
  async update<T>(resource: string, id: string | number, data: any): Promise<T> {
    const url = `${API_URL}/${resource}/${id}`
    return httpClient(url, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  // Delete a resource
  async delete<T>(resource: string, id: string | number): Promise<T> {
    const url = `${API_URL}/${resource}/${id}`
    return httpClient(url, {
      method: "DELETE",
    })
  }

  // Delete many resources
  async deleteMany<T>(resource: string, ids: (string | number)[]): Promise<(string | number)[]> {
    const deletePromises = ids.map((id) => this.delete(resource, id).then(() => id))
    return Promise.all(deletePromises)
  }

  // Upload file for suture analysis
  async uploadSutureFile(file: File): Promise<any> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("file_name", file.name)

    const url = `${API_URL}/suture/analyze`
    return httpClient(url, {
      method: "POST",
      body: formData,
    })
  }

  private getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem("auth_token")
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    return headers
  }
}

export const apiClient = new ApiClient()
