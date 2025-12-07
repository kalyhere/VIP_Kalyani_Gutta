import React, { useState, useEffect, useRef, useMemo } from "react"
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  IconButton,
  Paper,
  Table as MuiTable,
  TableBody as MuiTableBody,
  TableCell as MuiTableCell,
  TableContainer as MuiTableContainer,
  TableHead as MuiTableHead,
  TableRow as MuiTableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Grid,
  CircularProgress,
  Tooltip,
  Menu,
  MenuItem,
  Divider,
  Slider,
  Snackbar,
  Alert,
} from "@mui/material"
import AddIcon from "@mui/icons-material/Add"
import CloseIcon from "@mui/icons-material/Close"
import TableChartIcon from "@mui/icons-material/TableChart"
import PrintIcon from "@mui/icons-material/Print"
import SmartToyIcon from "@mui/icons-material/SmartToy"
import SaveIcon from "@mui/icons-material/Save"
import UploadIcon from "@mui/icons-material/Upload"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import RemoveIcon from "@mui/icons-material/Remove"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import RefreshIcon from "@mui/icons-material/Refresh"
import useMediaQuery from "@mui/material/useMediaQuery"
import CreateIcon from "@mui/icons-material/Create"
import { useTheme } from "@mui/material/styles"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import Joyride from "react-joyride"
import HelpOutlineIcon from "@mui/icons-material/HelpOutline"
import LockRoundedIcon from "@mui/icons-material/LockRounded"
import LockOpenOutlinedIcon from "@mui/icons-material/LockOpenOutlined"

import CloudIcon from "@mui/icons-material/Cloud"

// Feature imports
import { GoogleCloudModal } from "../ai-generation"
import {
  EditableCell,
  TableActions,
  FillMenu,
  AddSectionDialog,
  AddTableDialog,
  DeleteConfirmDialog,
  useCaseOperations,
  useTableOperations,
  useSectionOperations,
  useCellOperations,
} from "../table-operations"
import {
  UploadDialog,
  DownloadDialog,
  useFileOperations,
  useMenuOperations,
  useRenameOperations,
  useResetOperations,
} from "../file-management"
import MainMenu from "./components/MainMenu"
import FormActionsMenu from "./components/FormActionsMenu"

// Shared imports
import { isValidVariableFormat, getVariableFormatError } from "../../shared/utils/validation"
import {
  hasUnfilledVariables,
  hasGeneratedContent,
  isTableDataValid,
} from "../../shared/utils/tableUtils"
import { printCase } from "../../shared/utils/print"
import {
  downloadCases,
  downloadFormat,
  uploadFile,
  getDefaultDownloadFileName,
} from "../../shared/utils/fileOperations"
import { TableDialogData, Section, TableSection } from "../../shared/types"

// Zustand Store
import {
  useMCCStore,
  selectAttemptedFieldsArray,
  selectGeneratedFieldsMap,
  selectLockedFieldsMap,
} from "../../stores/mccStore"

// Hooks
import { useAIGeneration } from "../ai-generation"
import { useTour } from "./hooks/useTour"

// Types
import { MedicalCase, MedicalCaseCreate, DifficultyLevel } from "../../../../types/medical-cases"

interface TableCell {
  id: string
  content: string
  isHeader: boolean
  colSpan?: number
  isAIGenerated?: boolean
  originalVariable?: string
  imageUrls?: string[]
}

interface TableRow {
  cells: any[]
  id: string
}

interface LocalTable {
  title?: string
  columns?: string[]
  hasHeader: boolean
  rows: TableRow[]
}

interface Case {
  id: string
  title: string
  name: string
  description: string
  difficulty: DifficultyLevel
  sections: any[]
  lastModified?: string
}

interface Column {
  id: string
  header?: string
  width?: number
}

interface Table {
  id: string
  columns: Column[]
  rows: TableRow[]
  hasHeader: boolean
}

// Utility functions
const generateId = (): string => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

// Type conversion utilities
const convertMedicalCaseToCase = (medicalCase: MedicalCase): Case => {
  const content = medicalCase.content || {}
  let updatedAt: string | undefined
  if (medicalCase.updated_at) {
    updatedAt = new Date(medicalCase.updated_at as string).toISOString()
  }
  return {
    id: medicalCase.id.toString(),
    title: medicalCase.title,
    name: medicalCase.title,
    description: medicalCase.description,
    difficulty: content.difficulty || DifficultyLevel.Beginner,
    sections: content.sections || [],
    lastModified: updatedAt,
  }
}

const convertCaseToMedicalCase = (caseData: Case): MedicalCaseCreate => ({
  title: caseData.title,
  description: caseData.description,
  topics: [],
  content: {
    difficulty: caseData.difficulty,
    sections: caseData.sections,
  },
})

const getColumnCount = (table: Table): number => table.columns.length

const isValidColumnIndex = (table: Table, columnIndex: number): boolean =>
  table.columns ? columnIndex >= 0 && columnIndex < table.columns.length : false

export const FormBuilder = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"))

  // Get state from Zustand store (use arrays/objects to avoid infinite loops)
  const attemptedFieldsArray = useMCCStore(selectAttemptedFieldsArray)
  const generatedFieldsMap = useMCCStore(selectGeneratedFieldsMap)
  const lockedFieldsMap = useMCCStore(selectLockedFieldsMap)

  // Convert to Set/Map for usage (memoized to avoid recreating on every render)
  const attemptedFields = useMemo(() => new Set(attemptedFieldsArray), [attemptedFieldsArray])
  const generatedFields = useMemo(
    () => new Map(Object.entries(generatedFieldsMap)),
    [generatedFieldsMap],
  )
  const lockedFields = useMemo(() => new Map(Object.entries(lockedFieldsMap)), [lockedFieldsMap])
  const selectedSectionId = useMCCStore((state) => state.selectedSectionId)
  const googleCloudModalOpen = useMCCStore((state) => state.googleCloudModalOpen)
  const selectedCellId = useMCCStore((state) => state.selectedCellId)
  const errorMessage = useMCCStore((state) => state.errorMessage)
  const currentCase = useMCCStore((state) => state.currentCase)

  // Get actions from store
  const setAttemptedFields = useMCCStore((state) => state.setAttemptedFields)
  const setGeneratedFields = useMCCStore((state) => state.setGeneratedFields)
  const setLockedFields = useMCCStore((state) => state.setLockedFields)
  const setSelectedSectionId = useMCCStore((state) => state.setSelectedSectionId)
  const setGoogleCloudModalOpen = useMCCStore((state) => state.setGoogleCloudModalOpen)
  const setSelectedCellId = useMCCStore((state) => state.setSelectedCellId)
  const setErrorMessage = useMCCStore((state) => state.setErrorMessage)
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)

  // Initialize all hooks (now using Zustand internally)
  const {
    cases,
    setCases,
    isCreatingCase,
    setIsCreatingCase,
    newCaseName,
    setNewCaseName,
    caseToDelete,
    deleteConfirmationOpen,
    setDeleteConfirmationOpen,
    clearAllConfirmationOpen,
    setClearAllConfirmationOpen,
    handleCreateCase,
    handleBackToDashboard,
    handleDeleteCase,
    confirmDelete,
    handleClearAll,
    confirmClearAll,
    setCaseToDelete,
  } = useCaseOperations()

  const { handleResetAll, handleFormResetAll } = useResetOperations()

  // Restore AI generation status when case changes
  useEffect(() => {
    if (currentCase) {
      const newGeneratedFields = new Map<string, string>()
      const newLockedFields = new Map<string, boolean>()

      currentCase.sections.forEach((section) => {
        section.tables.forEach((table) => {
          table.rows.forEach((row) => {
            row.cells.forEach((cell) => {
              if (cell.isAIGenerated && cell.originalVariable) {
                newGeneratedFields.set(cell.id, cell.originalVariable)
              }
              if (cell.isLocked) {
                newLockedFields.set(cell.id, true)
              }
            })
          })
        })
      })
      setGeneratedFields(newGeneratedFields)
      setLockedFields(newLockedFields)
    }
  }, [currentCase, setGeneratedFields, setLockedFields])

  const {
    newTableData,
    setNewTableData,
    handleAddTable,
    handleDeleteTable,
    handleAddRow,
    handleDeleteRow,
    handleAddColumn,
    handleDeleteColumn,
    handleInsertRow,
    handleInsertColumn,
    tableToDelete,
    setTableToDelete,
    deleteTableConfirmationOpen,
    setDeleteTableConfirmationOpen,
    confirmDeleteTable,
  } = useTableOperations()

  const {
    newSectionTitle,
    setNewSectionTitle,
    isAddingSectionDialog,
    setIsAddingSectionDialog,
    handleAddSection,
    handleDeleteSection,
    sectionToDelete,
    setSectionToDelete,
    deleteSectionConfirmationOpen,
    setDeleteSectionConfirmationOpen,
    confirmDeleteSection,
  } = useSectionOperations()

  const { editingName, newName, setNewName, handleStartRename, handleFinishRename } =
    useRenameOperations()

  const { handleCellChange, handleClearField, handleImageDrop, handleRemoveImage } =
    useCellOperations({
    isValidVariableFormat,
  })

  const {
    isUploadDialogOpen,
    setIsUploadDialogOpen,
    uploadedContent,
    setUploadedContent,
    isDownloadDialogOpen,
    setIsDownloadDialogOpen,
    downloadFileName,
    setDownloadFileName,
    downloadType,
    fileInputRef,
    handleStartDownload,
    handleDownloadFormat,
    handleDownloadMedicalCases,
    handleUploadClick,
    handleFileSelect,
    handleUploadFormat,
    handleMergeCases,
    handleReplaceCases,
  } = useFileOperations()

  const {
    fillMenuAnchorEl,
    setFillMenuAnchorEl,
    activeTableId,
    setActiveTableId,
    formActionsAnchorEl,
    setFormActionsAnchorEl,
    menuAnchorEl,
    setMenuAnchorEl,
    temperature,
    setTemperature,
  } = useMenuOperations()

  const { isGenerating, generateFieldContent, regenerateField, regenerateTable, regenerateForm } =
    useAIGeneration()

  const { runTour, setRunTour, tourConfig } = useTour(cases, theme)

  // Handle AI generation
  const handleGenerateFieldContent = async (
    tableId: string,
    rowId: string,
    cellId: string,
    content: string
  ) => {
    if (!content.includes("{")) return

    const varPattern = /\{([^}]+)\}/
    const match = content.match(varPattern)
    if (!match) {
      setAttemptedFields((prev) => new Set([...prev, cellId]))
      setErrorMessage("Invalid variable format: Missing variable name")
      return
    }

    if (!isValidVariableFormat(content)) {
      setAttemptedFields((prev) => new Set([...prev, cellId]))
      setErrorMessage(getVariableFormatError(content) || "Invalid variable format")
      return
    }

    try {
      await generateFieldContent(tableId, rowId, cellId, content)
    } catch (error) {
      console.error("Error generating field content:", error)
      setErrorMessage(
        `Error generating field content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  const handleRegenerateField = async (tableId: string, rowId: string, cellId: string) => {
    try {
      await regenerateField(tableId, rowId, cellId)
    } catch (error) {
      console.error("Error regenerating field content:", error)
      alert(
        `Error regenerating field content: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
    }
  }

  const handleRegenerateAll = async (tableId: string) => {
    try {
      await regenerateTable(tableId)
    } catch (error) {
      console.error("Error regenerating fields:", error)
      alert(
        `Error regenerating fields: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  const handleFormRegenerateAll = async () => {
    try {
      await regenerateForm()
    } catch (error) {
      console.error("Error regenerating fields:", error)
      alert(
        `Error regenerating fields: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  // Handle table operations
  const handleFillTable = async (tableId: string) => {
    const table = currentCase?.sections
      .find((section) => section.tables.some((t) => t.id === tableId))
      ?.tables.find((t) => t.id === tableId)

    if (!table) return

    // Check for invalid fields first
    const invalidFields: string[] = []
    table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.content.includes("{") && !isValidVariableFormat(cell.content)) {
          invalidFields.push(cell.id)
        }
      })
    })

    if (invalidFields.length > 0) {
      const fieldArray = Array.from(invalidFields)
      setAttemptedFields(new Set([...fieldArray]))
      alert("Please fix invalid variable formats before generating content")
      return
    }

    try {
      // Collect all fields that need generation
      const fieldsToGenerate: { rowId: string; cellId: string; content: string }[] = []
      table.rows.forEach((row) => {
        row.cells.forEach((cell) => {
          if (cell.content.includes("{") || cell.isAIGenerated) {
            const content =
              cell.isAIGenerated && cell.originalVariable
              ? `{${cell.originalVariable}}`
              : cell.content
            fieldsToGenerate.push({
              rowId: row.id,
              cellId: cell.id,
              content,
            })
          }
        })
      })

      // Generate content for each field
      for (const field of fieldsToGenerate) {
        await handleGenerateFieldContent(table.id, field.rowId, field.cellId, field.content)
      }
    } catch (error) {
      console.error("Error filling table:", error)
      alert(`Error filling table: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  const handleFillEmpty = async (tableId: string) => {
    const table = currentCase?.sections.flatMap((s) => s.tables).find((t) => t.id === tableId)

    if (!table) return

    // First validate all cells that have variables
    const invalidCells: string[] = []
    table.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.content.includes("{") && !isValidVariableFormat(cell.content)) {
          invalidCells.push(cell.id)
        }
      })
    })

    // If there are any invalid cells, mark them and show error
    if (invalidCells.length > 0) {
      setAttemptedFields((prev) => new Set([...prev, ...invalidCells]))
      setErrorMessage("Please fix invalid variable formats before generating content")
      return
    }

    // Find all empty cells that have valid variables
    const emptyCells = table.rows.flatMap((row) =>
      row.cells.filter(
      (cell) =>
          !cell.isAIGenerated && cell.content.includes("{") && isValidVariableFormat(cell.content)
      )
    )

    // Generate content for each empty cell
    for (const cell of emptyCells) {
      const row = table.rows.find((r) => r.cells.includes(cell))
      if (row) {
        try {
          await handleGenerateFieldContent(table.id, row.id, cell.id, cell.content)
        } catch (error) {
          console.error("Error filling empty field:", error)
        }
      }
    }
  }

  const handleFormFillEmpty = async () => {
    try {
      // First validate all cells in the form that have variables
      const invalidCells: string[] = []
      currentCase?.sections.forEach((section) => {
        section.tables.forEach((table) => {
          table.rows.forEach((row) => {
            row.cells.forEach((cell) => {
              if (cell.content.includes("{") && !isValidVariableFormat(cell.content)) {
                invalidCells.push(cell.id)
              }
            })
          })
        })
      })

      // If there are any invalid cells, mark them and show error
      if (invalidCells.length > 0) {
        setAttemptedFields((prev) => new Set([...prev, ...invalidCells]))
        setErrorMessage("Please fix invalid variable formats before generating content")
        return
      }

      // Find all empty cells with valid variables across all tables
      for (const section of currentCase?.sections || []) {
        for (const table of section.tables) {
          const emptyCells = table.rows.flatMap((row) =>
            row.cells.filter(
            (cell) =>
                !cell.isAIGenerated &&
                cell.content.includes("{") &&
                isValidVariableFormat(cell.content)
            )
          )

          for (const cell of emptyCells) {
            const row = table.rows.find((r) => r.cells.includes(cell))
            if (row) {
              await handleGenerateFieldContent(table.id, row.id, cell.id, cell.content)
            }
          }
        }
      }
    } catch (error) {
      console.error("Error filling empty fields:", error)
      alert(
        `Error filling empty fields: ${error instanceof Error ? error.message : "Unknown error"}`
      )
    }
  }

  // Helper functions for form-level checks
  const hasUnfilledVariablesInForm = (): boolean =>
    currentCase?.sections.some((section) =>
      section.tables.some((table) =>
        table.rows.some((row) =>
          row.cells.some(
    (cell) =>
              !cell.isAIGenerated &&
              cell.content.includes("{") &&
              isValidVariableFormat(cell.content)
          )
        )
      )
    ) || false

  const hasGeneratedContentInForm = (): boolean =>
    currentCase?.sections.some((section) =>
      section.tables.some((table) =>
        table.rows.some((row) => row.cells.some((cell) => cell.isAIGenerated))
      )
    ) || false

  const processImage = (imageUrl: string): Promise<string> =>
    new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      // Calculate dimensions to maintain aspect ratio with max height of 256px
      const aspectRatio = img.height / img.width
      const width = Math.min(img.width, Math.round(256 / aspectRatio))
      const height = Math.round(width * aspectRatio)
      resolve(`${imageUrl}#width=${width}&height=${height}`)
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageUrl
  })

  const handleImageSelect = async (imageUrls: string[]) => {
    if (!selectedCellId) return
    try {
      // Process all images to add dimensions
      const processedUrls = await Promise.all(imageUrls.map((url) => processImage(url)))

      setCurrentCase((prevCase) => {
        if (!prevCase) return null
        return {
          ...prevCase,
          sections: prevCase.sections.map((section) => ({
            ...section,
            tables: section.tables.map((table) => ({
              ...table,
              rows: table.rows.map((row) => ({
                ...row,
                cells: row.cells.map((cell) => {
                  if (cell.id === selectedCellId) {
                    return {
                      ...cell,
                      content: "", // Clear the content
                      imageUrls: processedUrls, // Use the processed URLs directly
                      isAIGenerated: false,
                      originalVariable: undefined,
                    }
                  }
                  return cell
                }),
              })),
            })),
          })),
        }
      })
      // Remove from generated fields map
      setGeneratedFields((prev) => {
        const next = new Map(prev)
        next.delete(selectedCellId)
        return next
      })
      setSelectedCellId(null)
    } catch (error) {
      console.error("Error processing images:", error)
    }
  }

  const handleColumnOperation = (table: Table, columnIndex: number) => {
    const newColumns = [...table.columns]
    const newColumn: Column = {
      id: generateId(),
      header: "",
      width: 100,
    }
    newColumns.splice(columnIndex + 1, 0, newColumn)
    table.columns = newColumns
  }

  const handleHeaderToggle = (table: Table) => {
    table.hasHeader = !table.hasHeader
  }

  const toggleLockField = (cellId: string) => {
    setLockedFields((prev) => {
      const next = new Map(prev)
      if (next.has(cellId)) {
        next.delete(cellId)
      } else {
        next.set(cellId, true)
      }
      return next
    })

    setCurrentCase((prevCase) => {
      if (!prevCase) return null
      return {
        ...prevCase,
        sections: prevCase.sections.map((section) => ({
          ...section,
          tables: section.tables.map((table) => ({
            ...table,
            rows: table.rows.map((row) => ({
              ...row,
              cells: row.cells.map((cell) => {
                if (cell.id === cellId) {
                  return {
                    ...cell,
                    isLocked: !cell.isLocked,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })
  }

  return (
    <>
      {runTour ? <Joyride {...tourConfig} /> : null}
      <Snackbar
        open={errorMessage !== null}
        autoHideDuration={4000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{
          zIndex: theme.zIndex.modal + 1,
          top: "80px !important",
        }}>
        <Alert
          onClose={() => setErrorMessage(null)}
          severity="error"
          variant="filled"
          sx={{
            width: "100%",
            boxShadow: 4,
          }}>
          {errorMessage}
        </Alert>
      </Snackbar>
      {isMobile ? (
        <Box
          sx={{
            p: 4,
            textAlign: "center",
            height: "100vh",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            gap: 2,
          }}>
          <Typography variant="h6" color="text.secondary">
            Medical Case Creator
          </Typography>
          <Typography color="text.secondary">
            Please use a desktop or tablet device to access the case creator.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Minimum screen width required: 600px
          </Typography>
        </Box>
      ) : (
        <Card
          sx={{
            borderRadius: 2,
            boxShadow: 2,
            mx: 4,
            my: 3,
          }}>
          <CardContent>
            {!currentCase ? (
              <Box sx={{ display: "flex", flexDirection: "column" }}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    px: 4,
                    py: 3,
                    borderBottom: 1,
                    borderColor: "divider",
                    bgcolor: "background.paper",
                  }}
                  className="mcc-header">
                  <Typography
                    variant="h3"
                    sx={{
                      fontWeight: 500,
                      color: "text.primary",
                    }}>
                    Medical Cases
                  </Typography>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<HelpOutlineIcon />}
                      onClick={(e) => {
                        e.preventDefault()
                        setRunTour(true)
                      }}
                      className="help-button"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 2,
                      }}>
                      Take Tour
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<SaveIcon />}
                      onClick={() => handleStartDownload("cases")}
                      className="download-cases-button"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 2,
                      }}>
                      Download Cases
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<UploadIcon />}
                      onClick={handleUploadClick}
                      className="upload-cases-button"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 2,
                      }}>
                      Upload Cases
                      <input
                        ref={fileInputRef}
                        type="file"
                        hidden
                        accept=".json"
                        onChange={handleFileSelect}
                      />
                    </Button>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<AddIcon />}
                      onClick={() => setIsCreatingCase(true)}
                      className="create-case-button"
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 3,
                        boxShadow: 2,
                      }}>
                      Create New Case
                    </Button>
                  </Box>
                </Box>

                {isCreatingCase ? (
                  <Box sx={{ p: 4 }}>
                    <Paper
                      elevation={2}
                      sx={{
                        p: 3,
                        width: "100%",
                        maxWidth: 500,
                        mx: "auto",
                        borderRadius: 2,
                      }}>
                      <Typography
                        variant="h6"
                        sx={{
                          mb: 2,
                          color: "primary.main",
                          fontWeight: 500,
                        }}>
                        Create New Case
                      </Typography>
                      <TextField
                        autoFocus
                        fullWidth
                        label="Case Name"
                        name="new-case-name"
                        value={newCaseName}
                        onChange={(e) => setNewCaseName(e.target.value)}
                        sx={{ mb: 3 }}
                      />
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Button
                          onClick={() => setIsCreatingCase(false)}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                          }}>
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          onClick={(e) => {
                            e.preventDefault()
                            handleCreateCase()
                          }}
                          disabled={!newCaseName.trim()}
                          sx={{
                            textTransform: "none",
                            borderRadius: 2,
                            px: 3,
                          }}>
                          Create
                        </Button>
                      </Box>
                    </Paper>
                  </Box>
                ) : cases.length > 0 ? (
                  <Box sx={{ p: 4 }} className="case-grid">
                    <Grid container spacing={3}>
                      {cases.map((caseItem) => (
                        <Grid item xs={12} sm={6} md={4} key={caseItem.id}>
                          <Paper
                            elevation={2}
                            sx={{
                              p: 3,
                              height: "100%",
                              display: "flex",
                              flexDirection: "column",
                              gap: 2,
                              cursor: "pointer",
                              borderRadius: 2,
                              transition: "all 0.2s ease-in-out",
                              "&:hover": {
                                transform: "translateY(-4px)",
                                boxShadow: 4,
                                backgroundColor: "rgba(0, 0, 0, 0.02)",
                              },
                              position: "relative",
                            }}
                            onClick={() => setCurrentCase(caseItem)}>
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCase(caseItem.id)
                              }}
                              sx={{
                                position: "absolute",
                                top: 8,
                                right: 8,
                                color:
                                  theme.palette.mode === "dark"
                                    ? "rgba(255, 255, 255, 0.7)"
                                    : "rgba(0, 0, 0, 0.54)",
                                "&:hover": {
                                  color: "error.main",
                                  backgroundColor:
                                    theme.palette.mode === "dark"
                                      ? "rgba(211, 47, 47, 0.12)"
                                      : "rgba(211, 47, 47, 0.04)",
                                },
                              }}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                            <Box>
                              <Typography
                                variant="h4"
                                sx={{
                                  color: "secondary.main",
                                  fontWeight: 500,
                                  mb: 0.5,
                                }}>
                                {caseItem.name}
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                Last modified:{" "}
                                {new Date(caseItem.lastModified).toLocaleDateString()}
                              </Typography>
                            </Box>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                mt: "auto",
                              }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  color: "secondary.main",
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                }}>
                                <TableChartIcon fontSize="small" />
                                {String(caseItem.sections?.length || 0)} section
                                {(caseItem.sections?.length || 0) !== 1 ? "s" : ""}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                ) : (
                  <Box sx={{ p: 4 }}>
                    <Box
                      sx={{
                        textAlign: "center",
                        py: 8,
                        px: 3,
                        backgroundColor: "rgba(0, 0, 0, 0.02)",
                        borderRadius: 2,
                        border: "1px dashed",
                        borderColor: "divider",
                      }}>
                      <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
                        No cases yet
                      </Typography>
                      <Typography color="text.secondary" sx={{ mb: 3 }}>
                        Create your first case to get started
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setIsCreatingCase(true)}
                        className="empty-state-create-button"
                        sx={{
                          borderRadius: 2,
                          textTransform: "none",
                          px: 3,
                          boxShadow: 2,
                        }}>
                        Create New Case
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ p: 4 }}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mb: 3,
                    pb: 2,
                    borderBottom: 1,
                    borderColor: "divider",
                  }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <IconButton
                      onClick={handleBackToDashboard}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          color: "primary.main",
                        },
                      }}>
                      <ArrowBackIcon />
                    </IconButton>
                    {editingName?.type === "case" ? (
                      <TextField
                        autoFocus
                        value={newName}
                        name="rename-field"
                        onChange={(e) => setNewName(e.target.value)}
                        onBlur={handleFinishRename}
                        onKeyPress={(e) => e.key === "Enter" && handleFinishRename()}
                        variant="standard"
                        sx={{
                          minWidth: 200,
                          "& .MuiInput-underline:before": { borderBottom: "none" },
                          "& .MuiInput-underline:after": { borderBottom: "none" },
                          "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                            borderBottom: "none",
                          },
                        }}
                      />
                    ) : (
                      <Typography
                        variant="h5"
                        sx={{
                          fontWeight: 500,
                          color: "text.primary",
                          cursor: "pointer",
                          "&:hover": {
                            color: "primary.main",
                          },
                        }}
                        onClick={() =>
                          handleStartRename("case", currentCase?.id || "", currentCase?.name || "")
                        }>
                        {currentCase?.name}
                      </Typography>
                    )}
                  </Box>
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <IconButton
                      onClick={() => printCase(currentCase)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          color: "primary.main",
                        },
                      }}>
                      <PrintIcon />
                    </IconButton>
                    <IconButton
                      onClick={(e) => setMenuAnchorEl(e.currentTarget)}
                      sx={{
                        color: "text.secondary",
                        "&:hover": {
                          backgroundColor: "rgba(0, 0, 0, 0.04)",
                          color: "primary.main",
                        },
                      }}>
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    mb: 4,
                    alignItems: "center",
                  }}>
                  <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setIsAddingSectionDialog(true)}
                    sx={{
                      borderRadius: 2,
                      textTransform: "none",
                      px: 3,
                    }}>
                    Add Section
                  </Button>
                  {(hasUnfilledVariablesInForm() || hasGeneratedContentInForm()) && (
                    <Button
                      variant="outlined"
                      startIcon={<AutoAwesomeIcon />}
                      onClick={(e) => setFormActionsAnchorEl(e.currentTarget)}
                      disabled={isGenerating}
                      sx={{
                        borderRadius: 2,
                        textTransform: "none",
                        px: 3,
                      }}>
                      AI Actions
                    </Button>
                  )}
                  {(hasUnfilledVariablesInForm() || hasGeneratedContentInForm()) && (
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                        minWidth: 200,
                        backgroundColor: "background.paper",
                        padding: "4px 16px",
                        borderRadius: 2,
                        border: "1px solid",
                        borderColor: "divider",
                      }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ whiteSpace: "nowrap" }}>
                        Creativity:
                        {" "}
                        {temperature.toFixed(1)}
                      </Typography>
                      <Slider
                        value={temperature}
                        onChange={(_, value) => setTemperature(value as number)}
                        min={0}
                        max={1}
                        step={0.1}
                        size="small"
                        sx={{
                          "& .MuiSlider-thumb": {
                            width: 12,
                            height: 12,
                          },
                        }}
                      />
                    </Box>
                  )}
                </Box>

                {currentCase.sections.map((section) => (
                  <Paper
                    key={section.id}
                    sx={{
                      mb: 4,
                      p: 3,
                      borderRadius: 2,
                      boxShadow: 2,
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
                      {editingName?.type === "section" && editingName.id === section.id ? (
                        <TextField
                          autoFocus
                          value={newName}
                          name="rename-field"
                          onChange={(e) => setNewName(e.target.value)}
                          onBlur={handleFinishRename}
                          onKeyPress={(e) => e.key === "Enter" && handleFinishRename()}
                          variant="standard"
                          sx={{
                            minWidth: 200,
                            "& .MuiInput-underline:before": { borderBottom: "none" },
                            "& .MuiInput-underline:after": { borderBottom: "none" },
                            "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                              borderBottom: "none",
                            },
                          }}
                        />
                      ) : (
                        <Typography
                          variant="h5"
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              color: "primary.main",
                            },
                          }}
                          onClick={() => handleStartRename("section", section.id, section.title)}>
                          {section.title}
                        </Typography>
                      )}
                      <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<TableChartIcon />}
                          onClick={() => {
                            setSelectedSectionId(section.id)
                          }}>
                          Add Table
                        </Button>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteSection(section.id)}
                          sx={{
                            color:
                              theme.palette.mode === "dark"
                                ? "rgba(255, 255, 255, 0.7)"
                                : "rgba(0, 0, 0, 0.54)",
                            "&:hover": {
                              color: "error.main",
                              backgroundColor:
                                theme.palette.mode === "dark"
                                  ? "rgba(211, 47, 47, 0.12)"
                                  : "rgba(211, 47, 47, 0.04)",
                            },
                          }}>
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>

                    {section.tables.map((table) => (
                      <Paper
                        key={table.id}
                        sx={{
                          mb: 3,
                          p: 2,
                          border: "1px solid",
                          borderColor: "divider",
                          boxShadow: "none",
                        }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            mb: 2,
                            pb: 1,
                            borderBottom: "2px solid",
                            borderColor: "primary.main",
                            justifyContent: "space-between",
                          }}>
                          {editingName?.type === "table" && editingName.id === table.id ? (
                            <TextField
                              autoFocus
                              value={newName}
                              name="rename-field"
                              onChange={(e) => setNewName(e.target.value)}
                              onBlur={handleFinishRename}
                              onKeyPress={(e) => e.key === "Enter" && handleFinishRename()}
                              variant="standard"
                              sx={{
                                minWidth: 200,
                                "& .MuiInput-underline:before": { borderBottom: "none" },
                                "& .MuiInput-underline:after": { borderBottom: "none" },
                                "& .MuiInput-underline:hover:not(.Mui-disabled):before": {
                                  borderBottom: "none",
                                },
                              }}
                            />
                          ) : (
                            <Typography
                              variant="h6"
                              sx={{
                                color: "primary.main",
                                fontWeight: 500,
                                cursor: "pointer",
                                "&:hover": {
                                  opacity: 0.8,
                                },
                              }}
                              onClick={() => handleStartRename("table", table.id, table.title)}>
                              {table.title}
                            </Typography>
                          )}
                          <Box sx={{ display: "flex", gap: 1 }}>
                            {(hasUnfilledVariables(table) || hasGeneratedContent(table)) && (
                              <Button
                                variant="outlined"
                                size="small"
                                startIcon={<AutoAwesomeIcon />}
                                onClick={(e) => {
                                  setFillMenuAnchorEl(e.currentTarget)
                                  setActiveTableId(table.id)
                                }}
                                disabled={isGenerating}>
                                AI Actions
                              </Button>
                            )}
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteTable(section.id, table.id)}
                              sx={{
                                color:
                                  theme.palette.mode === "dark"
                                    ? "rgba(255, 255, 255, 0.7)"
                                    : "rgba(0, 0, 0, 0.54)",
                                "&:hover": {
                                  color: "error.main",
                                  backgroundColor:
                                    theme.palette.mode === "dark"
                                      ? "rgba(211, 47, 47, 0.12)"
                                      : "rgba(211, 47, 47, 0.04)",
                                },
                              }}>
                              <CloseIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>

                        <MuiTableContainer
                          sx={{
                            border: "1px solid",
                            borderColor: "divider",
                            borderRadius: 1,
                            mb: 2,
                          }}>
                          <MuiTable size="small">
                            <MuiTableBody>
                              {table.rows.map((row, rowIndex) => (
                                <MuiTableRow key={row.id}>
                                  {row.cells.map((cell) => (
                                    <MuiTableCell
                                      key={cell.id}
                                      sx={{
                                        padding: "12px 8px",
                                        borderColor: "divider",
                                        position: "relative",
                                        width: `${100 / table.columns}%`,
                                        ...(table.hasHeader &&
                                          rowIndex === 0 && {
                                            backgroundColor: "grey.100",
                                            fontWeight: 500,
                                          }),
                                        ...(cell.isAIGenerated &&
                                          generatedFields.has(cell.id) && {
                                            backgroundColor: "rgba(0, 150, 136, 0.08)",
                                            "&:hover": {
                                              backgroundColor: "rgba(0, 150, 136, 0.12)",
                                            },
                                          }),
                                        ...(cell.isLocked && {
                                          backgroundColor: "rgba(25, 118, 210, 0.08)",
                                          borderLeft: "2px solid",
                                          borderLeftColor: "primary.main",
                                          paddingLeft: "1px",
                                          "&:hover": {
                                            backgroundColor: "rgba(25, 118, 210, 0.12)",
                                          },
                                        }),
                                      }}>
                                      <Box
                                        sx={{
                                          display: "flex",
                                          alignItems: "center",
                                          gap: 2,
                                          minHeight: "2rem",
                                          position: "relative",
                                          zIndex: 0,
                                        }}
                                        onDragOver={(e) => {
                                          e.preventDefault()
                                          e.stopPropagation()
                                          setSelectedCellId(cell.id)
                                        }}
                                        onDrop={async (e) => {
                                          e.preventDefault()
                                          e.stopPropagation()

                                          const file = e.dataTransfer.files[0]
                                          if (file && file.type.startsWith("image/")) {
                                            const reader = new FileReader()
                                            reader.onload = async () => {
                                              try {
                                                const imageUrl = reader.result as string
                                                const processedUrl = await processImage(imageUrl)

                                                // Just pass the existing images and the new one
                                                handleImageSelect([
                                                  ...(cell.imageUrls || []),
                                                  processedUrl,
                                                ])
                                              } catch (error) {
                                                console.error(
                                                  "Error processing dropped image:",
                                                  error
                                                )
                                              }
                                            }
                                            reader.readAsDataURL(file)
                                          }
                                        }}>
                                        {(cell.content.includes("{") ||
                                          (cell.isAIGenerated && generatedFields.has(cell.id))) &&
                                          (attemptedFields.has(cell.id) &&
                                          !isValidVariableFormat(cell.content) ? (
                                            <Tooltip
                                              title={
                                                getVariableFormatError(cell.content) ||
                                                "Invalid variable format"
                                              }>
                                              <Box
                                                sx={{
                                                  display: "flex",
                                                  alignItems: "center",
                                                  justifyContent: "center",
                                                  backgroundColor: "error.main",
                                                  color: "white",
                                                  borderRadius: "4px",
                                                  padding: "2px 4px",
                                                  height: "20px",
                                                  flexShrink: 0,
                                                  cursor: "not-allowed",
                                                }}>
                                                <CloseIcon sx={{ fontSize: "0.875rem" }} />
                                              </Box>
                                            </Tooltip>
                                          ) : (
                                              <Box
                                              sx={{
                                                  position: "relative",
                                                  display: "flex",
                                                  gap: 0.5,
                                                  "&:hover .button-popup, .button-popup:hover": {
                                                    opacity: 1,
                                                    visibility: "visible",
                                                    transform: "translateX(0)",
                                                  },
                                                }}>
                                              <Tooltip
                                                  title={
                                                  generatedFields.has(cell.id)
                                                    ? "This field was generated with AI"
                                                    : "Click to fill this field with AI"
                                                }>
                                                  <Box
                                                  sx={{
                                                      display: "flex",
                                                      alignItems: "center",
                                                      justifyContent: "center",
                                                      backgroundColor: "rgb(0, 150, 136)",
                                                      color: "white",
                                                      borderRadius: "4px",
                                                      padding: "2px 4px",
                                                      height: "20px",
                                                      width: "24px",
                                                      flexShrink: 0,
                                                      cursor: "pointer",
                                                      transition: "all 0.1s ease-in-out",
                                                      "&:hover": {
                                                        backgroundColor: "rgb(0, 137, 123)",
                                                        transform: "scale(1.05)",
                                                      },
                                                    }}
                                                  onClick={() => handleGenerateFieldContent(
                                                        table.id,
                                                        row.id,
                                                      cell.id,
                                                        cell.content,
                                                      )
                                                  }>
                                                  <SmartToyIcon sx={{ fontSize: "0.875rem" }} />
                                                </Box>
                                                </Tooltip>
                                              {generatedFields.has(cell.id) && (
                                                <Box
                                                  className="button-popup"
                                                  sx={{
                                                    position: "absolute",
                                                    top: "-5px",
                                                    left: "100%",
                                                    marginLeft: "4px",
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    gap: "4px",
                                                    opacity: 0,
                                                    visibility: "hidden",
                                                    transform: "translateX(-10px)",
                                                    transition: "all 0.2s ease-in-out",
                                                    zIndex: 2,
                                                    bgcolor: "background.paper",
                                                    boxShadow: 1,
                                                    p: 0.5,
                                                    borderRadius: 1,
                                                    "&::before": {
                                                      content: '""',
                                                      position: "absolute",
                                                      left: "-4px",
                                                      top: 0,
                                                      bottom: 0,
                                                      width: "4px",
                                                    },
                                                  }}>
                                                  <Tooltip
                                                    title={
                                                      lockedFields.get(cell.id)
                                                        ? "Unlock Field"
                                                        : "Lock Field"
                                                    }>
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        backgroundColor: lockedFields.get(cell.id)
                                                          ? "rgb(0, 150, 255)"
                                                          : "rgb(255, 69, 58)",
                                                        color: "white",
                                                        borderRadius: "4px",
                                                        padding: "2px 4px",
                                                        height: "20px",
                                                        width: "24px",
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                          backgroundColor: lockedFields.get(cell.id)
                                                            ? "rgb(0, 122, 255)"
                                                            : "rgb(220, 50, 50)",
                                                          transform: "scale(1.05)",
                                                        },
                                                      }}
                                                      onClick={() => toggleLockField(cell.id)}>
                                                      {lockedFields.get(cell.id) ? (
                                                        <LockRoundedIcon
                                                          sx={{ fontSize: "1rem" }}
                                                        />
                                                      ) : (
                                                        <LockOpenOutlinedIcon
                                                          sx={{ fontSize: "1rem" }}
                                                        />
                                                      )}
                                                    </Box>
                                                  </Tooltip>

                                                  <Tooltip title="Regenerate content">
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        backgroundColor: "rgb(255, 152, 0)",
                                                        color: "white",
                                                        borderRadius: "4px",
                                                        padding: "2px 4px",
                                                        height: "20px",
                                                        width: "24px",
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                          backgroundColor: "rgb(245, 124, 0)",
                                                          transform: "scale(1.05)",
                                                        },
                                                      }}
                                                      onClick={() =>
                                                        handleRegenerateField(
                                                        table.id,
                                                        row.id,
                                                        cell.id
                                                        )
                                                      }>
                                                      <RefreshIcon sx={{ fontSize: "0.875rem" }} />
                                                    </Box>
                                                  </Tooltip>
                                                  <Tooltip title="Clear field">
                                                    <Box
                                                      sx={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        backgroundColor: "rgb(211, 47, 47)",
                                                        color: "white",
                                                        borderRadius: "4px",
                                                        padding: "2px 4px",
                                                        height: "20px",
                                                        width: "24px",
                                                        cursor: "pointer",
                                                        "&:hover": {
                                                          backgroundColor: "rgb(198, 40, 40)",
                                                          transform: "scale(1.05)",
                                                        },
                                                      }}
                                                      onClick={() =>
                                                        handleClearField(table.id, row.id, cell.id)
                                                      }>
                                                      <CloseIcon sx={{ fontSize: "0.875rem" }} />
                                                    </Box>
                                                  </Tooltip>
                                                </Box>
                                                )}
                                            </Box>
                                          ))}

                                        <EditableCell
                                          cell={cell}
                                          tableId={table.id}
                                          rowId={row.id}
                                          onCellChange={handleCellChange}
                                          attemptedFields={attemptedFields}
                                          isValidVariableFormat={isValidVariableFormat}
                                          onRemoveImage={handleRemoveImage}
                                          onOpenGoogleCloud={(cellId) => {
                                            setSelectedCellId(cellId)
                                            setGoogleCloudModalOpen(true)
                                          }}
                                        />
                                      </Box>
                                    </MuiTableCell>
                                  ))}
                                  <MuiTableCell
                                    padding="none"
                                    sx={{
                                      width: "48px",
                                      textAlign: "center",
                                      pr: 1.5,
                                      ...(table.hasHeader &&
                                        rowIndex === 0 && {
                                          backgroundColor: "grey.100",
                                        }),
                                      ...(row.cells.some((cell) => cell.isLocked) && {
                                        backgroundColor: "rgba(0, 150, 255, 0.1)",
                                      }),
                                      ...(row.cells.some((cell) => cell.isAIGenerated) &&
                                        !row.cells.some((cell) => cell.isLocked) && {
                                          backgroundColor: "rgba(0, 150, 136, 0.08)",
                                        }),
                                    }}>
                                    <IconButton
                                      size="small"
                                      onClick={() => handleDeleteRow(table.id, row.id)}
                                      disabled={
                                        table.rows.length <= 1 ||
                                        (table.hasHeader && table.rows.length <= 2)
                                      }
                                      sx={{
                                        color: row.cells[row.cells.length - 1]?.isAIGenerated
                                          ? "success.main"
                                          : theme.palette.mode === "dark"
                                            ? "rgba(255, 255, 255, 0.7)"
                                            : "rgba(0, 0, 0, 0.54)",
                                        "&:hover": {
                                          color: "error.main",
                                          backgroundColor:
                                            theme.palette.mode === "dark"
                                              ? "rgba(211, 47, 47, 0.12)"
                                              : "rgba(211, 47, 47, 0.04)",
                                        },
                                        "&.Mui-disabled": {
                                          opacity: 0.3,
                                        },
                                      }}>
                                      <CloseIcon fontSize="small" />
                                    </IconButton>
                                  </MuiTableCell>
                                </MuiTableRow>
                              ))}
                            </MuiTableBody>
                          </MuiTable>
                        </MuiTableContainer>

                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "flex-end",
                            mt: 2,
                            gap: 2,
                          }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                              Rows:
                              {" "}
                              {table.rows.length}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAddRow(table.id)}
                              disabled={table.rows.length >= 10}
                              sx={{
                                "&:hover": { color: "primary.main" },
                                "&.Mui-disabled": {
                                  opacity: 0.3,
                                },
                              }}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => {
                                const lastRow = table.rows[table.rows.length - 1]
                                if (lastRow && !lastRow.cells[0]?.isHeader) {
                                  handleDeleteRow(table.id, lastRow.id)
                                }
                              }}
                              disabled={
                                table.rows.length <= 1 ||
                                (table.hasHeader && table.rows.length <= 2)
                              }
                              sx={{
                                "&:hover": { color: "error.main" },
                                "&.Mui-disabled": {
                                  opacity: 0.3,
                                },
                              }}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                          </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Typography variant="body2" color="textSecondary">
                              Columns:{" "}
                              {typeof table.columns === "number"
                                ? table.columns
                                : table.columns.length}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAddColumn(table.id)}
                              disabled={
                                (typeof table.columns === "number"
                                  ? table.columns
                                  : table.columns.length) >= 10
                              }
                              sx={{
                                "&:hover": { color: "primary.main" },
                                "&.Mui-disabled": {
                                  opacity: 0.3,
                                },
                              }}>
                              <AddIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() =>
                                handleDeleteColumn(
                                table.id,
                                (typeof table.columns === "number"
                                  ? table.columns
                                  : table.columns.length) - 1
                                )
                              }
                              disabled={
                                (typeof table.columns === "number"
                                  ? table.columns
                                  : table.columns.length) <= 1
                              }
                              sx={{
                                "&:hover": { color: "error.main" },
                                "&.Mui-disabled": {
                                  opacity: 0.3,
                                },
                              }}>
                              <RemoveIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Paper>
                ))}
              </Box>
            )}

            <AddTableDialog
              open={selectedSectionId !== null}
              onClose={() => {
                setSelectedSectionId(null)
                setNewTableData({
                  title: "",
                  rows: 2,
                  columns: 2,
                  hasHeader: false,
                })
              }}
              data={newTableData}
              onDataChange={setNewTableData}
              onAdd={() =>
                selectedSectionId &&
                handleAddTable(selectedSectionId, () => setSelectedSectionId(null))
              }
              isValid={isTableDataValid(newTableData)}
            />

            <AddSectionDialog
              open={isAddingSectionDialog}
              onClose={() => setIsAddingSectionDialog(false)}
              newSectionTitle={newSectionTitle}
              onTitleChange={setNewSectionTitle}
              onAdd={handleAddSection}
            />

            <UploadDialog
              open={isUploadDialogOpen}
              onClose={() => {
                setIsUploadDialogOpen(false)
                setUploadedContent(null)
              }}
              uploadedCasesCount={uploadedContent?.cases.length || 0}
              existingCasesCount={cases.length}
              onMerge={handleMergeCases}
              onReplace={handleReplaceCases}
            />

            <DeleteConfirmDialog
              open={deleteConfirmationOpen}
              onClose={() => {
                setDeleteConfirmationOpen(false)
                setCaseToDelete(null)
              }}
              onConfirm={confirmDelete}
              title="Delete Case"
              message="Are you sure you want to delete this case? This action cannot be undone."
            />

            <DeleteConfirmDialog
              open={clearAllConfirmationOpen}
              onClose={() => setClearAllConfirmationOpen(false)}
              onConfirm={confirmClearAll}
              title="Clear All Content"
              message="Are you sure you want to clear all content? This action cannot be undone."
            />

            <DeleteConfirmDialog
              open={deleteTableConfirmationOpen}
              onClose={() => {
                setDeleteTableConfirmationOpen(false)
                setTableToDelete(null)
              }}
              onConfirm={confirmDeleteTable}
              title="Delete Table"
              message="Are you sure you want to delete this table? This action cannot be undone."
            />

            <DeleteConfirmDialog
              open={deleteSectionConfirmationOpen}
              onClose={() => {
                setDeleteSectionConfirmationOpen(false)
                setSectionToDelete(null)
              }}
              onConfirm={confirmDeleteSection}
              title="Delete Section"
              message="Are you sure you want to delete this section and all its tables? This action cannot be undone."
            />

            <DownloadDialog
              open={isDownloadDialogOpen}
              onClose={() => setIsDownloadDialogOpen(false)}
              fileName={downloadFileName}
              onFileNameChange={setDownloadFileName}
              onDownload={
                downloadType === "cases" ? handleDownloadMedicalCases : handleDownloadFormat
              }
              downloadType={downloadType}
            />

            <MainMenu
              anchorEl={menuAnchorEl}
              onClose={() => setMenuAnchorEl(null)}
              onDownloadFormat={() => {
                handleStartDownload("format")
                setMenuAnchorEl(null)
              }}
              onUploadFormat={(event) => {
                handleUploadFormat(event)
                setMenuAnchorEl(null)
              }}
              onClearAll={() => {
                handleClearAll()
                setMenuAnchorEl(null)
              }}
            />

            <FillMenu
              anchorEl={fillMenuAnchorEl}
              onClose={() => {
                setFillMenuAnchorEl(null)
                setActiveTableId(null)
              }}
              hasUnfilledVariables={
                activeTableId
                  ? hasUnfilledVariables(
                      currentCase?.sections
                        .flatMap((s) => s.tables)
                        .find((t) => t.id === activeTableId)!
                    )
                  : false
              }
              hasGeneratedContent={
                activeTableId
                  ? hasGeneratedContent(
                      currentCase?.sections
                        .flatMap((s) => s.tables)
                        .find((t) => t.id === activeTableId)!
                    )
                  : false
              }
              onFillEmpty={() => {
                activeTableId && handleFillEmpty(activeTableId)
                setFillMenuAnchorEl(null)
              }}
              onRegenerateAll={() => {
                activeTableId && handleRegenerateAll(activeTableId)
                setFillMenuAnchorEl(null)
              }}
              onResetAll={() => {
                activeTableId && handleResetAll(activeTableId)
                setFillMenuAnchorEl(null)
              }}
            />

            <FormActionsMenu
              anchorEl={formActionsAnchorEl}
              onClose={() => setFormActionsAnchorEl(null)}
              hasUnfilledVariables={hasUnfilledVariablesInForm()}
              hasGeneratedContent={hasGeneratedContentInForm()}
              onFillEmpty={() => {
                handleFormFillEmpty()
                setFormActionsAnchorEl(null)
              }}
              onRegenerateAll={() => {
                handleFormRegenerateAll()
                setFormActionsAnchorEl(null)
              }}
              onResetAll={() => {
                handleFormResetAll()
                setFormActionsAnchorEl(null)
              }}
            />

            <GoogleCloudModal
              open={googleCloudModalOpen}
              onClose={() => setGoogleCloudModalOpen(false)}
              onImageSelect={handleImageSelect}
              existingImages={
                currentCase?.sections
                  .flatMap((section) => section.tables)
                  .flatMap((table) => table.rows)
                  .flatMap((row) => row.cells)
                  .find((cell) => cell.id === selectedCellId)?.imageUrls || []
              }
            />
          </CardContent>
        </Card>
      )}
    </>
  )
}

export default FormBuilder
