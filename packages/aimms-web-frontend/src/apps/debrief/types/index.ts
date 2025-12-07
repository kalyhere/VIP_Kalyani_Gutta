/**
 * Debrief Types
 * Shared type definitions for the Debrief application
 */

export interface HealthData {
  status: string
}

export interface EvaluationScore {
  category: string
  score: number
  comment: string
  maxScore: number
}

export interface ParsedReport {
  evaluator: string
  instructor: string
  course: string
  date: string
  location: string
  classSize: string
  context: string
  scores: EvaluationScore[]
  totalScore: number
  summaryReport: string
  rawReport: string
}
