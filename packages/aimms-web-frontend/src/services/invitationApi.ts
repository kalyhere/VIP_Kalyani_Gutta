import axios from "axios"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"

export interface Invitation {
  id: number
  email: string
  role: "student" | "faculty" | "admin"
  token: string
  created_at: string
  expires_at: string
  is_used: boolean
  used_at: string | null
  created_by_user_id: number
}

export interface InvitationWithUrl extends Invitation {
  registration_url: string
}

export interface InvitationCreate {
  email: string
  role: "student" | "faculty" | "admin"
  expires_in_days?: number
}

export interface InviteTokenValidation {
  valid: boolean
  email?: string
  role?: "student" | "faculty" | "admin"
  error?: string
}

export interface UserRegisterWithInvite {
  token: string
  name: string
  password: string
}

const getAuthHeaders = () => {
  const token = localStorage.getItem("auth_token")
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
}

/**
 * Create a new user invitation
 */
export const createInvitation = async (data: InvitationCreate): Promise<InvitationWithUrl> => {
  const response = await axios.post(`${API_URL}/api/admin/invitations`, data, getAuthHeaders())
  return response.data
}

/**
 * Get all invitations with optional filters
 */
export const getInvitations = async (params?: {
  skip?: number
  limit?: number
  status_filter?: "pending" | "used" | "expired"
  role_filter?: "student" | "faculty" | "admin"
}): Promise<Invitation[]> => {
  const response = await axios.get(`${API_URL}/api/admin/invitations`, {
    ...getAuthHeaders(),
    params,
  })
  return response.data
}

/**
 * Get a specific invitation by ID
 */
export const getInvitation = async (id: number): Promise<InvitationWithUrl> => {
  const response = await axios.get(`${API_URL}/api/admin/invitations/${id}`, getAuthHeaders())
  return response.data
}

/**
 * Revoke (delete) an invitation
 */
export const revokeInvitation = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/api/admin/invitations/${id}`, getAuthHeaders())
}

/**
 * Validate an invitation token (public endpoint)
 */
export const validateInviteToken = async (token: string): Promise<InviteTokenValidation> => {
  const response = await axios.get(`${API_URL}/api/auth/validate-invite/${token}`)
  return response.data
}

/**
 * Register a new user with an invitation token (public endpoint)
 */
export const registerWithInvite = async (
  role: "student" | "faculty" | "admin",
  data: UserRegisterWithInvite
): Promise<{ message: string; user: any }> => {
  const response = await axios.post(`${API_URL}/api/auth/register-with-invite/${role}`, data)
  return response.data
}
