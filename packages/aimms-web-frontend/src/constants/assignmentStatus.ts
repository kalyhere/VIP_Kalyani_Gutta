export type AssignmentStatus =
  | "not_started"
  | "in_progress"
  | "pending_review"
  | "reviewed"
  | "late"
  | "completed"
  | "pending"
  | "overdue"

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  pending_review: "Pending Review",
  reviewed: "Reviewed",
  late: "Late",
  completed: "Completed",
  pending: "Pending",
  overdue: "Overdue",
}

export const getStatusLabel = (status: AssignmentStatus): string =>
  ASSIGNMENT_STATUS_LABELS[status] || status
