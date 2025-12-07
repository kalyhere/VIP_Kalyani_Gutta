export interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrl?: string
  isLocked?: boolean
  imageUrls?: string[]
}

export interface TableRow {
  id: string
  cells: TableCell[]
}

export interface TableSection {
  id: string
  title: string
  hasHeader: boolean
  columns: number
  rows: TableRow[]
}

export interface Section {
  id: string
  title: string
  tables: TableSection[]
}

export interface Case {
  id: string
  name: string
  sections: Section[]
  lastModified: string
}

export interface TableDialogData {
  title: string
  rows: number
  columns: number
  hasHeader: boolean
}

export interface CaseContext {
  patientAge?: string
  patientGender?: string
  mainCondition?: string
  previousResponses: Record<string, string>
}
