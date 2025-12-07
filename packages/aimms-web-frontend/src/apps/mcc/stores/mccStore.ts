/**
 * MCC Store - Zustand v5
 * Manages state for the Medical Case Creator application
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import { DifficultyLevel } from "../../../types/medical-cases"

// ===== Types =====

export interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrls?: string[]
  isLocked?: boolean
}

export interface TableRow {
  id: string
  cells: TableCell[]
}

export interface Column {
  id: string
  header?: string
  width?: number
}

export interface Table {
  id: string
  title: string
  columns: Column[] | number
  rows: TableRow[]
  hasHeader: boolean
}

export interface Section {
  id: string
  title: string
  tables: Table[]
}

export interface Case {
  id: string
  title: string
  name: string
  description: string
  difficulty: DifficultyLevel
  sections: Section[]
  lastModified: string
}

export interface TableDialogData {
  title: string
  rows: number
  columns: number
  hasHeader: boolean
}

interface MCCState {
  // ===== Core Data State =====
  cases: Case[]
  currentCase: Case | null

  // ===== UI State - Case Management =====
  isCreatingCase: boolean
  newCaseName: string
  editingName: { type: "case" | "section" | "table"; id: string; name: string } | null
  newName: string

  // ===== UI State - Section Management =====
  isAddingSectionDialog: boolean
  newSectionTitle: string
  selectedSectionId: string | null

  // ===== UI State - Table Management =====
  newTableData: TableDialogData
  activeTableId: string | null

  // ===== UI State - AI Generation =====
  isGenerating: boolean
  temperature: number
  attemptedFieldsArray: string[] // Internal array storage (converts to Set)
  generatedFieldsMap: Record<string, string> // Internal object storage (converts to Map)
  lockedFieldsMap: Record<string, boolean> // Internal object storage (converts to Map)
  selectedCellId: string | null
  googleCloudModalOpen: boolean

  // ===== UI State - Dialogs & Menus =====
  // Delete confirmations
  deleteConfirmationOpen: boolean
  caseToDelete: string | null
  clearAllConfirmationOpen: boolean
  deleteTableConfirmationOpen: boolean
  tableToDelete: { sectionId: string; tableId: string } | null
  deleteSectionConfirmationOpen: boolean
  sectionToDelete: string | null

  // File operations
  isUploadDialogOpen: boolean
  uploadedContent: { cases: Case[] } | null
  isDownloadDialogOpen: boolean
  downloadFileName: string
  downloadType: "cases" | "format"

  // Menus
  fillMenuAnchorEl: HTMLElement | null
  formActionsAnchorEl: HTMLElement | null
  menuAnchorEl: HTMLElement | null

  // ===== UI State - Error Handling =====
  errorMessage: string | null

  // ===== UI State - Tour =====
  runTour: boolean

  // ===== Actions - Case Management =====
  /** Set cases array (accepts value or updater function, updates localStorage) */
  setCases: (cases: Case[] | ((prev: Case[]) => Case[])) => void
  /** Set current editing case (accepts value or updater function) */
  setCurrentCase: (caseData: Case | null | ((prev: Case | null) => Case | null)) => void
  /** Toggle case creation dialog visibility */
  setIsCreatingCase: (isCreating: boolean) => void
  /** Set name for new case being created */
  setNewCaseName: (name: string) => void
  /** Add new case to cases array */
  addCase: (newCase: Case) => void
  /** Update existing case by ID (also updates currentCase if it matches) */
  updateCase: (caseId: string, updatedCase: Case) => void
  /** Delete case by ID (clears currentCase if it matches) */
  deleteCase: (caseId: string) => void

  // ===== Actions - Rename Operations =====
  /** Set item currently being renamed (case/section/table) */
  setEditingName: (
    editing: { type: "case" | "section" | "table"; id: string; name: string } | null
  ) => void
  /** Set new name for item being renamed */
  setNewName: (name: string) => void

  // ===== Actions - Section Operations =====
  /** Toggle add section dialog visibility */
  setIsAddingSectionDialog: (isAdding: boolean) => void
  /** Set title for new section being created */
  setNewSectionTitle: (title: string) => void
  /** Set ID of currently selected section */
  setSelectedSectionId: (id: string | null) => void
  /** Add new section to currentCase */
  addSection: (section: Section) => void
  /** Update existing section by ID within currentCase */
  updateSection: (sectionId: string, updatedSection: Section) => void
  /** Delete section by ID from currentCase */
  deleteSection: (sectionId: string) => void

  // ===== Actions - Table Operations =====
  /** Set table configuration for new table dialog */
  setNewTableData: (data: TableDialogData | ((prev: TableDialogData) => TableDialogData)) => void
  /** Set ID of currently active table (for menus/actions) */
  setActiveTableId: (id: string | null) => void
  /** Add new table to section within currentCase */
  addTable: (sectionId: string, table: Table) => void
  /** Update existing table by ID within section */
  updateTable: (sectionId: string, tableId: string, updatedTable: Table) => void
  /** Delete table by ID from section */
  deleteTable: (sectionId: string, tableId: string) => void

  // ===== Actions - AI Generation =====
  /** Toggle AI generation loading state */
  setIsGenerating: (isGenerating: boolean) => void
  /** Set AI temperature (0-1, controls randomness) */
  setTemperature: (temp: number) => void
  /** Set fields that have been attempted for AI generation (converts Set to array internally) */
  setAttemptedFields: (fields: Set<string> | ((prev: Set<string>) => Set<string>)) => void
  /** Set AI-generated field values (converts Map to object internally) */
  setGeneratedFields: (
    fields: Map<string, string> | ((prev: Map<string, string>) => Map<string, string>)
  ) => void
  /** Set locked fields that can't be edited (converts Map to object internally) */
  setLockedFields: (
    fields: Map<string, boolean> | ((prev: Map<string, boolean>) => Map<string, boolean>)
  ) => void
  /** Set ID of currently selected cell for AI generation */
  setSelectedCellId: (id: string | null) => void
  /** Toggle Google Cloud image search modal */
  setGoogleCloudModalOpen: (open: boolean) => void

  // ===== Actions - Dialog & Menu Management =====
  /** Toggle case delete confirmation dialog */
  setDeleteConfirmationOpen: (open: boolean) => void
  /** Set ID of case pending deletion */
  setCaseToDelete: (id: string | null) => void
  /** Toggle clear all confirmation dialog */
  setClearAllConfirmationOpen: (open: boolean) => void
  /** Toggle table delete confirmation dialog */
  setDeleteTableConfirmationOpen: (open: boolean) => void
  /** Set section and table IDs pending deletion */
  setTableToDelete: (data: { sectionId: string; tableId: string } | null) => void
  /** Toggle section delete confirmation dialog */
  setDeleteSectionConfirmationOpen: (open: boolean) => void
  /** Set ID of section pending deletion */
  setSectionToDelete: (id: string | null) => void
  /** Toggle file upload dialog */
  setIsUploadDialogOpen: (open: boolean) => void
  /** Set uploaded file content (for merge/replace choice) */
  setUploadedContent: (content: { cases: Case[] } | null) => void
  /** Toggle file download dialog */
  setIsDownloadDialogOpen: (open: boolean) => void
  /** Set filename for download */
  setDownloadFileName: (name: string) => void
  /** Set download type (cases or format) */
  setDownloadType: (type: "cases" | "format") => void
  /** Set anchor element for fill menu popup */
  setFillMenuAnchorEl: (el: HTMLElement | null) => void
  /** Set anchor element for form actions menu */
  setFormActionsAnchorEl: (el: HTMLElement | null) => void
  /** Set anchor element for main menu */
  setMenuAnchorEl: (el: HTMLElement | null) => void

  // ===== Actions - Error Handling =====
  /** Set global error message (null to clear) */
  setErrorMessage: (message: string | null) => void

  // ===== Actions - Tour =====
  /** Toggle product tour visibility */
  setRunTour: (run: boolean) => void

  // ===== Actions - Reset =====
  /** Reset entire store to initial state */
  reset: () => void
}

// ===== Initial State =====

const initialState = {
  // Core Data State
  cases: [],
  currentCase: null,

  // UI State - Case Management
  isCreatingCase: false,
  newCaseName: "",
  editingName: null,
  newName: "",

  // UI State - Section Management
  isAddingSectionDialog: false,
  newSectionTitle: "",
  selectedSectionId: null,

  // UI State - Table Management
  newTableData: {
    title: "",
    rows: 2,
    columns: 2,
    hasHeader: false,
  },
  activeTableId: null,

  // UI State - AI Generation
  isGenerating: false,
  temperature: 0.7,
  attemptedFieldsArray: [],
  generatedFieldsMap: {},
  lockedFieldsMap: {},
  selectedCellId: null,
  googleCloudModalOpen: false,

  // UI State - Dialogs & Menus
  deleteConfirmationOpen: false,
  caseToDelete: null,
  clearAllConfirmationOpen: false,
  deleteTableConfirmationOpen: false,
  tableToDelete: null,
  deleteSectionConfirmationOpen: false,
  sectionToDelete: null,
  isUploadDialogOpen: false,
  uploadedContent: null,
  isDownloadDialogOpen: false,
  downloadFileName: "",
  downloadType: "cases" as const,
  fillMenuAnchorEl: null,
  formActionsAnchorEl: null,
  menuAnchorEl: null,

  // UI State - Error Handling
  errorMessage: null,

  // UI State - Tour
  runTour: false,
}

// ===== Store =====

export const useMCCStore = create<MCCState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Case Management Actions
      setCases: (casesOrUpdater) =>
        set(
        (state) => ({
          cases:
              typeof casesOrUpdater === "function" ? casesOrUpdater(state.cases) : casesOrUpdater,
        }),
        false,
        "setCases"
        ),

      setCurrentCase: (caseOrUpdater) =>
        set(
        (state) => ({
          currentCase:
              typeof caseOrUpdater === "function"
                ? caseOrUpdater(state.currentCase)
                : caseOrUpdater,
        }),
        false,
        "setCurrentCase"
      ),

      setIsCreatingCase: (isCreating) => set({ isCreatingCase: isCreating }, false, "setIsCreatingCase"),

      setNewCaseName: (name) => set({ newCaseName: name }, false, "setNewCaseName"),

      addCase: (newCase) =>
        set((state) => ({ cases: [...state.cases, newCase] }), false, "addCase"),

      updateCase: (caseId, updatedCase) =>
        set(
        (state) => ({
          cases: state.cases.map((c) => (c.id === caseId ? updatedCase : c)),
          currentCase: state.currentCase?.id === caseId ? updatedCase : state.currentCase,
        }),
        false,
        "updateCase"
      ),

      deleteCase: (caseId) =>
        set(
        (state) => ({
          cases: state.cases.filter((c) => c.id !== caseId),
          currentCase: state.currentCase?.id === caseId ? null : state.currentCase,
        }),
        false,
        "deleteCase"
      ),

      // Rename Operations Actions
      setEditingName: (editing) => set({ editingName: editing }, false, "setEditingName"),

      setNewName: (name) => set({ newName: name }, false, "setNewName"),

      // Section Operations Actions
      setIsAddingSectionDialog: (isAdding) =>
        set({ isAddingSectionDialog: isAdding }, false, "setIsAddingSectionDialog"),

      setNewSectionTitle: (title) => set({ newSectionTitle: title }, false, "setNewSectionTitle"),

      setSelectedSectionId: (id) => set({ selectedSectionId: id }, false, "setSelectedSectionId"),

      addSection: (section) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
                  ...state.currentCase,
              sections: [...state.currentCase.sections, section],
                }
            : null,
        }),
        false,
        "addSection"
        ),

      updateSection: (sectionId, updatedSection) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
              ...state.currentCase,
              sections: state.currentCase.sections.map((s) => (s.id === sectionId ? updatedSection : s)),
                }
            : null,
        }),
        false,
        "updateSection"
      ),

      deleteSection: (sectionId) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
                  ...state.currentCase,
              sections: state.currentCase.sections.filter((s) => s.id !== sectionId),
            }
            : null,
        }),
        false,
        "deleteSection"
      ),

      // Table Operations Actions
      setNewTableData: (dataOrUpdater) =>
        set(
        (state) => ({
          newTableData:
              typeof dataOrUpdater === "function"
                ? dataOrUpdater(state.newTableData)
                : dataOrUpdater,
        }),
        false,
        "setNewTableData"
      ),

      setActiveTableId: (id) => set({ activeTableId: id }, false, "setActiveTableId"),

      addTable: (sectionId, table) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
              ...state.currentCase,
              sections: state.currentCase.sections.map((s) => (s.id === sectionId
                ? {
                          ...s,
                  tables: [...s.tables, table],
                }
                : s)),
                }
            : null,
        }),
        false,
        "addTable"
      ),

      updateTable: (sectionId, tableId, updatedTable) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
              ...state.currentCase,
              sections: state.currentCase.sections.map((s) => (s.id === sectionId
                      ? {
                  ...s,
                          tables: s.tables.map((t) => (t.id === tableId ? updatedTable : t)),
                }
                : s)),
            }
            : null,
        }),
        false,
        "updateTable"
      ),

      deleteTable: (sectionId, tableId) =>
        set(
        (state) => ({
          currentCase: state.currentCase
            ? {
              ...state.currentCase,
              sections: state.currentCase.sections.map((s) => (s.id === sectionId
                ? {
                          ...s,
                  tables: s.tables.filter((t) => t.id !== tableId),
                }
                : s)),
            }
            : null,
        }),
        false,
        "deleteTable"
      ),

      // AI Generation Actions
      setIsGenerating: (isGenerating) => set({ isGenerating }, false, "setIsGenerating"),

      setTemperature: (temp) => set({ temperature: temp }, false, "setTemperature"),

      setAttemptedFields: (fieldsOrUpdater) =>
        set(
        (state) => {
          const currentSet = new Set(state.attemptedFieldsArray)
          const newSet =
              typeof fieldsOrUpdater === "function" ? fieldsOrUpdater(currentSet) : fieldsOrUpdater
          return { attemptedFieldsArray: Array.from(newSet) }
        },
        false,
        "setAttemptedFields"
      ),

      setGeneratedFields: (fieldsOrUpdater) =>
        set(
        (state) => {
          const currentMap = new Map(Object.entries(state.generatedFieldsMap))
          const newMap =
              typeof fieldsOrUpdater === "function" ? fieldsOrUpdater(currentMap) : fieldsOrUpdater
          return { generatedFieldsMap: Object.fromEntries(newMap) }
        },
        false,
        "setGeneratedFields"
      ),

      setLockedFields: (fieldsOrUpdater) =>
        set(
        (state) => {
          const currentMap = new Map(Object.entries(state.lockedFieldsMap))
          const newMap =
              typeof fieldsOrUpdater === "function" ? fieldsOrUpdater(currentMap) : fieldsOrUpdater
          return { lockedFieldsMap: Object.fromEntries(newMap) }
        },
        false,
        "setLockedFields"
        ),

      setSelectedCellId: (id) => set({ selectedCellId: id }, false, "setSelectedCellId"),

      setGoogleCloudModalOpen: (open) =>
        set({ googleCloudModalOpen: open }, false, "setGoogleCloudModalOpen"),

      // Dialog & Menu Management Actions
      setDeleteConfirmationOpen: (open) =>
        set({ deleteConfirmationOpen: open }, false, "setDeleteConfirmationOpen"),

      setCaseToDelete: (id) => set({ caseToDelete: id }, false, "setCaseToDelete"),

      setClearAllConfirmationOpen: (open) =>
        set({ clearAllConfirmationOpen: open }, false, "setClearAllConfirmationOpen"),

      setDeleteTableConfirmationOpen: (open) =>
        set({ deleteTableConfirmationOpen: open }, false, "setDeleteTableConfirmationOpen"),

      setTableToDelete: (data) => set({ tableToDelete: data }, false, "setTableToDelete"),

      setDeleteSectionConfirmationOpen: (open) =>
        set({ deleteSectionConfirmationOpen: open }, false, "setDeleteSectionConfirmationOpen"),

      setSectionToDelete: (id) => set({ sectionToDelete: id }, false, "setSectionToDelete"),

      setIsUploadDialogOpen: (open) => set({ isUploadDialogOpen: open }, false, "setIsUploadDialogOpen"),

      setUploadedContent: (content) => set({ uploadedContent: content }, false, "setUploadedContent"),

      setIsDownloadDialogOpen: (open) =>
        set({ isDownloadDialogOpen: open }, false, "setIsDownloadDialogOpen"),

      setDownloadFileName: (name) => set({ downloadFileName: name }, false, "setDownloadFileName"),

      setDownloadType: (type) => set({ downloadType: type }, false, "setDownloadType"),

      setFillMenuAnchorEl: (el) => set({ fillMenuAnchorEl: el }, false, "setFillMenuAnchorEl"),

      setFormActionsAnchorEl: (el) => set({ formActionsAnchorEl: el }, false, "setFormActionsAnchorEl"),

      setMenuAnchorEl: (el) => set({ menuAnchorEl: el }, false, "setMenuAnchorEl"),

      // Error Handling Actions
      setErrorMessage: (message) => set({ errorMessage: message }, false, "setErrorMessage"),

      // Tour Actions
      setRunTour: (run) => set({ runTour: run }, false, "setRunTour"),

      // Reset Action
      reset: () => set(initialState, false, "reset"),
    }),
    { name: "MCCStore" }
  )
)

// ===== Selectors (for better performance) =====

// Core data selectors
export const selectCases = (state: MCCState) => state.cases
export const selectCurrentCase = (state: MCCState) => state.currentCase

// Case management selectors
export const selectIsCreatingCase = (state: MCCState) => state.isCreatingCase
export const selectNewCaseName = (state: MCCState) => state.newCaseName
export const selectEditingName = (state: MCCState) => state.editingName
export const selectNewName = (state: MCCState) => state.newName

// Section management selectors
export const selectIsAddingSectionDialog = (state: MCCState) => state.isAddingSectionDialog
export const selectNewSectionTitle = (state: MCCState) => state.newSectionTitle
export const selectSelectedSectionId = (state: MCCState) => state.selectedSectionId

// Table management selectors
export const selectNewTableData = (state: MCCState) => state.newTableData
export const selectActiveTableId = (state: MCCState) => state.activeTableId

// AI generation selectors
export const selectIsGenerating = (state: MCCState) => state.isGenerating
export const selectTemperature = (state: MCCState) => state.temperature
// Return arrays directly to avoid creating new Set/Map objects on every render
export const selectAttemptedFieldsArray = (state: MCCState) => state.attemptedFieldsArray
export const selectGeneratedFieldsMap = (state: MCCState) => state.generatedFieldsMap
export const selectLockedFieldsMap = (state: MCCState) => state.lockedFieldsMap
export const selectSelectedCellId = (state: MCCState) => state.selectedCellId
export const selectGoogleCloudModalOpen = (state: MCCState) => state.googleCloudModalOpen

// Dialog selectors
export const selectDeleteConfirmationOpen = (state: MCCState) => state.deleteConfirmationOpen
export const selectCaseToDelete = (state: MCCState) => state.caseToDelete
export const selectClearAllConfirmationOpen = (state: MCCState) => state.clearAllConfirmationOpen
export const selectDeleteTableConfirmationOpen = (state: MCCState) => state.deleteTableConfirmationOpen
export const selectTableToDelete = (state: MCCState) => state.tableToDelete
export const selectDeleteSectionConfirmationOpen = (state: MCCState) =>
  state.deleteSectionConfirmationOpen
export const selectSectionToDelete = (state: MCCState) => state.sectionToDelete

// File operations selectors
export const selectIsUploadDialogOpen = (state: MCCState) => state.isUploadDialogOpen
export const selectUploadedContent = (state: MCCState) => state.uploadedContent
export const selectIsDownloadDialogOpen = (state: MCCState) => state.isDownloadDialogOpen
export const selectDownloadFileName = (state: MCCState) => state.downloadFileName
export const selectDownloadType = (state: MCCState) => state.downloadType

// Menu selectors
export const selectFillMenuAnchorEl = (state: MCCState) => state.fillMenuAnchorEl
export const selectFormActionsAnchorEl = (state: MCCState) => state.formActionsAnchorEl
export const selectMenuAnchorEl = (state: MCCState) => state.menuAnchorEl

// Error handling selectors
export const selectErrorMessage = (state: MCCState) => state.errorMessage

// Tour selectors
export const selectRunTour = (state: MCCState) => state.runTour

// ===== Convenience Hooks =====

// Hook to get all case-related state
export const useCaseState = () =>
  useMCCStore((state) => ({
  cases: state.cases,
  currentCase: state.currentCase,
  isCreatingCase: state.isCreatingCase,
  newCaseName: state.newCaseName,
}))

// Hook to get all case-related actions
export const useCaseActions = () =>
  useMCCStore((state) => ({
  setCases: state.setCases,
  setCurrentCase: state.setCurrentCase,
  setIsCreatingCase: state.setIsCreatingCase,
  setNewCaseName: state.setNewCaseName,
  addCase: state.addCase,
  updateCase: state.updateCase,
  deleteCase: state.deleteCase,
}))

// Hook to get all AI generation state (returns arrays/objects to avoid infinite loops)
export const useAIState = () =>
  useMCCStore((state) => ({
  isGenerating: state.isGenerating,
  temperature: state.temperature,
  attemptedFieldsArray: state.attemptedFieldsArray,
  generatedFieldsMap: state.generatedFieldsMap,
  lockedFieldsMap: state.lockedFieldsMap,
}))

// Hook to get all AI generation actions
export const useAIActions = () =>
  useMCCStore((state) => ({
  setIsGenerating: state.setIsGenerating,
  setTemperature: state.setTemperature,
  setAttemptedFields: state.setAttemptedFields,
  setGeneratedFields: state.setGeneratedFields,
  setLockedFields: state.setLockedFields,
}))

// Hook to get all dialog state
export const useDialogState = () =>
  useMCCStore((state) => ({
  deleteConfirmationOpen: state.deleteConfirmationOpen,
  caseToDelete: state.caseToDelete,
  clearAllConfirmationOpen: state.clearAllConfirmationOpen,
  deleteTableConfirmationOpen: state.deleteTableConfirmationOpen,
  tableToDelete: state.tableToDelete,
  deleteSectionConfirmationOpen: state.deleteSectionConfirmationOpen,
  sectionToDelete: state.sectionToDelete,
  isUploadDialogOpen: state.isUploadDialogOpen,
  uploadedContent: state.uploadedContent,
  isDownloadDialogOpen: state.isDownloadDialogOpen,
  downloadFileName: state.downloadFileName,
  downloadType: state.downloadType,
}))

// Hook to get all dialog actions
export const useDialogActions = () =>
  useMCCStore((state) => ({
  setDeleteConfirmationOpen: state.setDeleteConfirmationOpen,
  setCaseToDelete: state.setCaseToDelete,
  setClearAllConfirmationOpen: state.setClearAllConfirmationOpen,
  setDeleteTableConfirmationOpen: state.setDeleteTableConfirmationOpen,
  setTableToDelete: state.setTableToDelete,
  setDeleteSectionConfirmationOpen: state.setDeleteSectionConfirmationOpen,
  setSectionToDelete: state.setSectionToDelete,
  setIsUploadDialogOpen: state.setIsUploadDialogOpen,
  setUploadedContent: state.setUploadedContent,
  setIsDownloadDialogOpen: state.setIsDownloadDialogOpen,
  setDownloadFileName: state.setDownloadFileName,
  setDownloadType: state.setDownloadType,
}))
