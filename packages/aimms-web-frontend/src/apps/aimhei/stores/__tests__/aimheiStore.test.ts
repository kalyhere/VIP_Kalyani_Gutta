/**
 * AIMHEI Store Tests
 */

import { describe, it, expect, beforeEach } from "vitest"
import {
  useAIMHEIStore,
  useProcessingState,
  useProcessingActions,
  useUIStateFromStore,
  useUIActions,
} from "../aimheiStore"

describe("AIMHEIStore", () => {
  beforeEach(() => {
    // Reset store before each test
    useAIMHEIStore.getState().reset()
  })

  describe("Initial State", () => {
    it("should have correct initial view state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.mainView).toBe("upload")
      expect(state.selectedReportId).toBeNull()
    })

    it("should have correct initial processing state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingProgress).toBe(0)
      expect(state.processingMessage).toBe("")
      expect(state.processingStatus).toBe("idle")
      expect(state.jobId).toBeNull()
      expect(state.result).toBeNull()
      expect(state.error).toBeNull()
    })

    it("should have correct initial UI state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.loadingTile).toBeNull()
      expect(state.expandedCardsArray).toEqual([])
      expect(state.exportMode).toBe(false)
      expect(state.selectedReportIdsArray).toEqual([])
      expect(state.exportingCSV).toBe(false)
    })

    it("should have correct initial dialog state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.deleteDialogOpen).toBe(false)
      expect(state.shareDialogOpen).toBe(false)
      expect(state.selectedReportIdForAction).toBeNull()
    })

    it("should have correct initial snackbar state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.snackbarOpen).toBe(false)
      expect(state.snackbarMessage).toBe("")
      expect(state.snackbarSeverity).toBe("info")
    })
  })

  describe("View Management Actions", () => {
    it("should set main view", () => {
      const { setMainView } = useAIMHEIStore.getState()
      setMainView("reportReview")

      expect(useAIMHEIStore.getState().mainView).toBe("reportReview")
    })

    it("should set selected report ID", () => {
      const { setSelectedReportId } = useAIMHEIStore.getState()
      setSelectedReportId(42)

      expect(useAIMHEIStore.getState().selectedReportId).toBe(42)
    })

    it("should clear selected report ID", () => {
      const { setSelectedReportId } = useAIMHEIStore.getState()
      setSelectedReportId(42)
      setSelectedReportId(null)

      expect(useAIMHEIStore.getState().selectedReportId).toBeNull()
    })
  })

  describe("Processing Actions", () => {
    it("should start processing", () => {
      const { startProcessing } = useAIMHEIStore.getState()
      startProcessing("job-123")

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(true)
      expect(state.processingStatus).toBe("running")
      expect(state.jobId).toBe("job-123")
      expect(state.processingProgress).toBe(0)
      expect(state.processingMessage).toBe("Starting...")
      expect(state.error).toBeNull()
    })

    it("should update processing progress", () => {
      const { startProcessing, updateProcessingProgress, setLoadingTile } =        useAIMHEIStore.getState()
      setLoadingTile({ title: "Test Report", progress: 0, message: "Starting..." })
      startProcessing("job-123")
      updateProcessingProgress(50, "Processing...")

      const state = useAIMHEIStore.getState()
      expect(state.processingProgress).toBe(50)
      expect(state.processingMessage).toBe("Processing...")
      expect(state.loadingTile).toEqual({
        title: "Test Report",
        progress: 50,
        message: "Processing...",
      })
    })

    it("should complete processing", () => {
      const { startProcessing, completeProcessing } = useAIMHEIStore.getState()
      const result = { reportId: 1, score: 85 }

      startProcessing("job-123")
      completeProcessing(result)

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingStatus).toBe("complete")
      expect(state.processingProgress).toBe(100)
      expect(state.result).toEqual(result)
      expect(state.loadingTile).toBeNull()
    })

    it("should set processing error", () => {
      const { startProcessing, setProcessingError } = useAIMHEIStore.getState()

      startProcessing("job-123")
      setProcessingError("Processing failed")

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingStatus).toBe("error")
      expect(state.error).toBe("Processing failed")
      expect(state.loadingTile).toBeNull()
    })

    it("should reset processing", () => {
      const { startProcessing, updateProcessingProgress, resetProcessing } =
        useAIMHEIStore.getState()

      startProcessing("job-123")
      updateProcessingProgress(75, "Almost done")
      resetProcessing()

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingProgress).toBe(0)
      expect(state.processingMessage).toBe("")
      expect(state.processingStatus).toBe("idle")
      expect(state.jobId).toBeNull()
      expect(state.result).toBeNull()
      expect(state.error).toBeNull()
      expect(state.loadingTile).toBeNull()
    })
  })

  describe("UI State Actions", () => {
    it("should set loading tile", () => {
      const { setLoadingTile } = useAIMHEIStore.getState()
      const tile = { progress: 30, message: "Loading..." }

      setLoadingTile(tile)
      expect(useAIMHEIStore.getState().loadingTile).toEqual(tile)
    })

    it("should clear loading tile", () => {
      const { setLoadingTile } = useAIMHEIStore.getState()

      setLoadingTile({ progress: 30, message: "Loading..." })
      setLoadingTile(null)

      expect(useAIMHEIStore.getState().loadingTile).toBeNull()
    })

    it("should toggle card expansion", () => {
      const { toggleCardExpansion } = useAIMHEIStore.getState()

      toggleCardExpansion(1)
      expect(useAIMHEIStore.getState().expandedCardsArray).toContain(1)

      toggleCardExpansion(1)
      expect(useAIMHEIStore.getState().expandedCardsArray).not.toContain(1)
    })

    it("should handle multiple card expansions", () => {
      const { toggleCardExpansion } = useAIMHEIStore.getState()

      toggleCardExpansion(1)
      toggleCardExpansion(2)

      const { expandedCardsArray } = useAIMHEIStore.getState()
      expect(expandedCardsArray).toContain(1)
      expect(expandedCardsArray).toContain(2)
    })

    it("should enable export mode", () => {
      const { setExportMode } = useAIMHEIStore.getState()

      setExportMode(true)
      expect(useAIMHEIStore.getState().exportMode).toBe(true)
    })

    it("should disable export mode and clear selections", () => {
      const { setExportMode, setSelectedReportIds } = useAIMHEIStore.getState()

      setSelectedReportIds([1, 2, 3])
      setExportMode(false)

      const state = useAIMHEIStore.getState()
      expect(state.exportMode).toBe(false)
      expect(state.selectedReportIdsArray).toEqual([])
    })

    it("should set selected report IDs", () => {
      const { setSelectedReportIds } = useAIMHEIStore.getState()

      setSelectedReportIds([1, 2, 3])
      expect(useAIMHEIStore.getState().selectedReportIdsArray).toEqual([1, 2, 3])
    })

    it("should set exporting CSV", () => {
      const { setExportingCSV } = useAIMHEIStore.getState()

      setExportingCSV(true)
      expect(useAIMHEIStore.getState().exportingCSV).toBe(true)

      setExportingCSV(false)
      expect(useAIMHEIStore.getState().exportingCSV).toBe(false)
    })
  })

  describe("Dialog Actions", () => {
    it("should open delete dialog", () => {
      const { setDeleteDialogOpen } = useAIMHEIStore.getState()

      setDeleteDialogOpen(true)
      expect(useAIMHEIStore.getState().deleteDialogOpen).toBe(true)
    })

    it("should close delete dialog", () => {
      const { setDeleteDialogOpen } = useAIMHEIStore.getState()

      setDeleteDialogOpen(true)
      setDeleteDialogOpen(false)
      expect(useAIMHEIStore.getState().deleteDialogOpen).toBe(false)
    })

    it("should open share dialog", () => {
      const { setShareDialogOpen } = useAIMHEIStore.getState()

      setShareDialogOpen(true)
      expect(useAIMHEIStore.getState().shareDialogOpen).toBe(true)
    })

    it("should close share dialog", () => {
      const { setShareDialogOpen } = useAIMHEIStore.getState()

      setShareDialogOpen(true)
      setShareDialogOpen(false)
      expect(useAIMHEIStore.getState().shareDialogOpen).toBe(false)
    })

    it("should set selected report ID for action", () => {
      const { setSelectedReportIdForAction } = useAIMHEIStore.getState()

      setSelectedReportIdForAction(42)
      expect(useAIMHEIStore.getState().selectedReportIdForAction).toBe(42)
    })

    it("should clear selected report ID for action", () => {
      const { setSelectedReportIdForAction } = useAIMHEIStore.getState()

      setSelectedReportIdForAction(42)
      setSelectedReportIdForAction(null)
      expect(useAIMHEIStore.getState().selectedReportIdForAction).toBeNull()
    })
  })

  describe("Snackbar Actions", () => {
    it("should show success snackbar", () => {
      const { showSnackbar } = useAIMHEIStore.getState()

      showSnackbar("Success!", "success")

      const state = useAIMHEIStore.getState()
      expect(state.snackbarOpen).toBe(true)
      expect(state.snackbarMessage).toBe("Success!")
      expect(state.snackbarSeverity).toBe("success")
    })

    it("should show error snackbar", () => {
      const { showSnackbar } = useAIMHEIStore.getState()

      showSnackbar("Error occurred", "error")

      const state = useAIMHEIStore.getState()
      expect(state.snackbarOpen).toBe(true)
      expect(state.snackbarMessage).toBe("Error occurred")
      expect(state.snackbarSeverity).toBe("error")
    })

    it("should show warning snackbar", () => {
      const { showSnackbar } = useAIMHEIStore.getState()

      showSnackbar("Warning!", "warning")

      const state = useAIMHEIStore.getState()
      expect(state.snackbarMessage).toBe("Warning!")
      expect(state.snackbarSeverity).toBe("warning")
    })

    it("should show info snackbar", () => {
      const { showSnackbar } = useAIMHEIStore.getState()

      showSnackbar("Info message", "info")

      const state = useAIMHEIStore.getState()
      expect(state.snackbarMessage).toBe("Info message")
      expect(state.snackbarSeverity).toBe("info")
    })

    it("should hide snackbar", () => {
      const { showSnackbar, hideSnackbar } = useAIMHEIStore.getState()

      showSnackbar("Test", "info")
      hideSnackbar()

      expect(useAIMHEIStore.getState().snackbarOpen).toBe(false)
    })
  })

  describe("Reset Action", () => {
    it("should reset all state to initial values", () => {
      const store = useAIMHEIStore.getState()

      // Modify all state
      store.setMainView("reportReview")
      store.setSelectedReportId(42)
      store.startProcessing("job-123")
      store.updateProcessingProgress(50, "Processing...")
      store.setLoadingTile({ progress: 50, message: "Loading..." })
      store.toggleCardExpansion("card-1")
      store.setExportMode(true)
      store.setSelectedReportIds([1, 2, 3])
      store.setDeleteDialogOpen(true)
      store.showSnackbar("Test", "success")

      // Reset
      store.reset()

      // Verify all state is reset
      const state = useAIMHEIStore.getState()
      expect(state.mainView).toBe("upload")
      expect(state.selectedReportId).toBeNull()
      expect(state.processing).toBe(false)
      expect(state.processingProgress).toBe(0)
      expect(state.loadingTile).toBeNull()
      expect(state.expandedCardsArray).toEqual([])
      expect(state.exportMode).toBe(false)
      expect(state.selectedReportIdsArray).toEqual([])
      expect(state.deleteDialogOpen).toBe(false)
      expect(state.snackbarOpen).toBe(false)
    })
  })

  describe("Convenience Hooks", () => {
    it("should export useProcessingState hook", () => {
      // Hooks can only be tested in React components
      // Just verify the export exists
      expect(typeof useProcessingState).toBe("function")
    })

    it("should export useProcessingActions hook", () => {
      expect(typeof useProcessingActions).toBe("function")
    })

    it("should export useUIStateFromStore hook", () => {
      expect(typeof useUIStateFromStore).toBe("function")
    })

    it("should export useUIActions hook", () => {
      expect(typeof useUIActions).toBe("function")
    })

    it("should be able to access all store state via getState()", () => {
      const { startProcessing, setExportMode } = useAIMHEIStore.getState()

      startProcessing("job-123")
      setExportMode(true)

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(true)
      expect(state.jobId).toBe("job-123")
      expect(state.exportMode).toBe(true)
    })
  })

  describe("State Transitions", () => {
    it("should handle complete processing workflow", () => {
      const { startProcessing, updateProcessingProgress, completeProcessing } =
        useAIMHEIStore.getState()

      // Start processing
      startProcessing("job-123")
      expect(useAIMHEIStore.getState().processing).toBe(true)

      // Update progress
      updateProcessingProgress(25, "Analyzing...")
      expect(useAIMHEIStore.getState().processingProgress).toBe(25)

      updateProcessingProgress(50, "Processing...")
      expect(useAIMHEIStore.getState().processingProgress).toBe(50)

      updateProcessingProgress(75, "Finalizing...")
      expect(useAIMHEIStore.getState().processingProgress).toBe(75)

      // Complete
      const result = { reportId: 1, score: 85 }
      completeProcessing(result)

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingStatus).toBe("complete")
      expect(state.result).toEqual(result)
    })

    it("should handle processing failure workflow", () => {
      const { startProcessing, updateProcessingProgress, setProcessingError } =
        useAIMHEIStore.getState()

      // Start processing
      startProcessing("job-123")

      // Progress partway
      updateProcessingProgress(30, "Processing...")

      // Error occurs
      setProcessingError("Network timeout")

      const state = useAIMHEIStore.getState()
      expect(state.processing).toBe(false)
      expect(state.processingStatus).toBe("error")
      expect(state.error).toBe("Network timeout")
    })

    it("should handle export workflow", () => {
      const { setExportMode, setSelectedReportIds, setExportingCSV } = useAIMHEIStore.getState()

      // Enable export mode
      setExportMode(true)
      expect(useAIMHEIStore.getState().exportMode).toBe(true)

      // Select reports
      setSelectedReportIds([1, 2, 3])
      expect(useAIMHEIStore.getState().selectedReportIdsArray).toEqual([1, 2, 3])

      // Start exporting
      setExportingCSV(true)
      expect(useAIMHEIStore.getState().exportingCSV).toBe(true)

      // Finish exporting
      setExportingCSV(false)
      setExportMode(false)

      const state = useAIMHEIStore.getState()
      expect(state.exportMode).toBe(false)
      expect(state.exportingCSV).toBe(false)
      expect(state.selectedReportIdsArray).toEqual([])
    })
  })

  describe("Folder Management", () => {
    beforeEach(() => {
      useAIMHEIStore.getState().reset()
    })

    it("should have correct initial folder state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.availableFolders).toEqual([])
      expect(state.folderCounts).toEqual({})
      expect(state.unorganizedCount).toBe(0)
      expect(state.actualTotalReports).toBe(0)
      expect(state.selectedFolder).toBeNull()
    })

    it("should set available folders", () => {
      const { setAvailableFolders } = useAIMHEIStore.getState()

      setAvailableFolders(["Folder A", "Folder B", "Folder C"])

      expect(useAIMHEIStore.getState().availableFolders).toEqual([
        "Folder A",
        "Folder B",
        "Folder C",
      ])
    })

    it("should set folder counts", () => {
      const { setFolderCounts } = useAIMHEIStore.getState()

      setFolderCounts({ "Folder A": 5, "Folder B": 3 })

      expect(useAIMHEIStore.getState().folderCounts).toEqual({
        "Folder A": 5,
        "Folder B": 3,
      })
    })

    it("should set unorganized count", () => {
      const { setUnorganizedCount } = useAIMHEIStore.getState()

      setUnorganizedCount(10)

      expect(useAIMHEIStore.getState().unorganizedCount).toBe(10)
    })

    it("should set actual total reports", () => {
      const { setActualTotalReports } = useAIMHEIStore.getState()

      setActualTotalReports(20)

      expect(useAIMHEIStore.getState().actualTotalReports).toBe(20)
    })

    it("should set selected folder", () => {
      const { setSelectedFolder } = useAIMHEIStore.getState()

      setSelectedFolder("Folder A")

      expect(useAIMHEIStore.getState().selectedFolder).toBe("Folder A")
    })

    it("should clear selected folder", () => {
      const { setSelectedFolder } = useAIMHEIStore.getState()

      setSelectedFolder("Folder A")
      setSelectedFolder(null)

      expect(useAIMHEIStore.getState().selectedFolder).toBeNull()
    })
  })

  describe("Folder Deletion Dialog", () => {
    it("should open delete folder dialog", () => {
      const { setDeleteFolderDialogOpen, setFolderToDelete, setReportsInFolderToDelete } =
        useAIMHEIStore.getState()

      const mockReports = [
        { report_id: 1, case_title: "Report 1" },
        { report_id: 2, case_title: "Report 2" },
      ]

      setFolderToDelete("Folder A")
      setReportsInFolderToDelete(mockReports)
      setDeleteFolderDialogOpen(true)

      const state = useAIMHEIStore.getState()
      expect(state.deleteFolderDialogOpen).toBe(true)
      expect(state.folderToDelete).toBe("Folder A")
      expect(state.reportsInFolderToDelete).toEqual(mockReports)
    })

    it("should close delete folder dialog", () => {
      const { setDeleteFolderDialogOpen, setFolderToDelete, setReportsInFolderToDelete } =
        useAIMHEIStore.getState()

      setFolderToDelete("Folder A")
      setReportsInFolderToDelete([{ report_id: 1, case_title: "Report 1" }])
      setDeleteFolderDialogOpen(true)

      setDeleteFolderDialogOpen(false)

      expect(useAIMHEIStore.getState().deleteFolderDialogOpen).toBe(false)
    })
  })

  describe("Bulk Selection / Organize Mode", () => {
    beforeEach(() => {
      const { setReports } = useAIMHEIStore.getState()
      setReports([
        { report_id: 1, case_title: "Report 1" },
        { report_id: 2, case_title: "Report 2" },
        { report_id: 3, case_title: "Report 3" },
        { report_id: 4, case_title: "Report 4" },
        { report_id: 5, case_title: "Report 5" },
      ])
    })

    it("should have correct initial organize mode state", () => {
      const state = useAIMHEIStore.getState()
      expect(state.bulkOperationMode).toBe(false)
      expect(state.bulkSelectedReportIds).toEqual(new Set())
    })

    it("should enable bulk operation mode", () => {
      const { setBulkOperationMode } = useAIMHEIStore.getState()

      setBulkOperationMode(true)

      expect(useAIMHEIStore.getState().bulkOperationMode).toBe(true)
    })

    it("should disable bulk operation mode and clear selection", () => {
      const { setBulkOperationMode, toggleReportSelection } = useAIMHEIStore.getState()

      // Enable mode and select reports
      setBulkOperationMode(true)
      toggleReportSelection(1)
      toggleReportSelection(2)

      // Disable mode
      setBulkOperationMode(false)

      const state = useAIMHEIStore.getState()
      expect(state.bulkOperationMode).toBe(false)
      expect(state.bulkSelectedReportIds).toEqual(new Set())
    })

    it("should toggle report selection", () => {
      const { setBulkOperationMode, toggleReportSelection } = useAIMHEIStore.getState()

      setBulkOperationMode(true)

      // Add report
      toggleReportSelection(1)
      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set([1]))

      // Add another
      toggleReportSelection(2)
      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set([1, 2]))

      // Remove report
      toggleReportSelection(1)
      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set([2]))
    })

    it("should select all reports", () => {
      const { setBulkOperationMode, selectAllReports } = useAIMHEIStore.getState()

      setBulkOperationMode(true)
      selectAllReports()

      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set([1, 2, 3, 4, 5]))
    })

    it("should clear selection", () => {
      const { setBulkOperationMode, selectAllReports, clearSelection } =
        useAIMHEIStore.getState()

      setBulkOperationMode(true)
      selectAllReports()
      clearSelection()

      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set())
    })

    it("should not select reports when organize mode disabled", () => {
      const { toggleReportSelection } = useAIMHEIStore.getState()

      // Try to select without enabling mode
      toggleReportSelection(1)

      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set())
    })

    it("should select all based on current reports in store", () => {
      const { setBulkOperationMode, selectAllReports, setReports } = useAIMHEIStore.getState()

      // Update reports
      setReports([
        { report_id: 10, case_title: "New Report 1" },
        { report_id: 20, case_title: "New Report 2" },
      ])

      setBulkOperationMode(true)
      selectAllReports()

      expect(useAIMHEIStore.getState().bulkSelectedReportIds).toEqual(new Set([10, 20]))
    })
  })
})

