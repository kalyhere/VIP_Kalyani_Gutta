/**
 * Authentication Types
 */

export interface User {
  id: number
  email: string
  name?: string | null
  role: string
}

export interface UserIdentity extends User {
  fullName: string
}
