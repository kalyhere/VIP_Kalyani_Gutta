export enum DifficultyLevel {
  Beginner = "Beginner",
  Intermediate = "Intermediate",
  Advanced = "Advanced",
}

export interface MedicalCase {
  id: number
  title: string
  description: string
  topics: string[]
  content: any // The full case JSON content
  created_at: string
  updated_at: string
  created_by: number
  is_public: boolean
  is_active: boolean
  version?: string
  difficulty?: DifficultyLevel | string
  duration?: number
  creator?: {
    id: number
    email: string
    role: string
  }
}

export interface CaseAssignment {
  id: number
  case_id: number
  student_id: number
  faculty_id: number | null
  assigned_date: string
  due_date: string | null
  completed: boolean
  case?: MedicalCase
  student?: {
    id: number
    email: string
    role: string
  }
  faculty?: {
    id: number
    email: string
    role: string
  }
}

export interface MedicalCaseCreate {
  title: string
  description: string
  topics: string[]
  content: any
  is_public?: boolean
  difficulty?: DifficultyLevel | string
  duration?: number
}

export interface MedicalCaseUpdate {
  title?: string
  description?: string
  topics?: string[]
  content?: any
  is_public?: boolean
  is_active?: boolean
  difficulty?: DifficultyLevel | string
  duration?: number
}

export interface CaseAssignmentCreate {
  case_id: number
  student_id: number
  due_date?: string
  feedback?: string
}

export interface CaseAssignmentUpdate {
  due_date?: string
  completed?: boolean
}
