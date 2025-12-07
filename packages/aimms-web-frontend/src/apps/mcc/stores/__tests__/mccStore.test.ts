/**
 * MCC Store Tests
 * Tests for Zustand state management in Medical Case Creator
 */

import { describe, it, expect, beforeEach } from "vitest"
import { useMCCStore } from "../mccStore"
import { Case, Section, Table } from "../../shared/types"

describe("mccStore", () => {
  // Reset store before each test
  beforeEach(() => {
    useMCCStore.getState().reset()
  })

  describe("Case Operations", () => {
    it("should initialize with empty cases array", () => {
      const { cases } = useMCCStore.getState()
      expect(cases).toEqual([])
    })

    it("should add a case", () => {
      const newCase: Case = {
        id: "case-1",
        name: "Test Case",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().addCase(newCase)
      const { cases } = useMCCStore.getState()

      expect(cases).toHaveLength(1)
      expect(cases[0]).toEqual(newCase)
    })

    it("should set current case", () => {
      const testCase: Case = {
        id: "case-1",
        name: "Test Case",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().setCurrentCase(testCase)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase).toEqual(testCase)
    })

    it("should update a case", () => {
      const testCase: Case = {
        id: "case-1",
        name: "Original Name",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().addCase(testCase)
      useMCCStore.getState().setCurrentCase(testCase)

      const updatedCase: Case = {
        ...testCase,
        name: "Updated Name",
      }

      useMCCStore.getState().updateCase("case-1", updatedCase)
      const { cases, currentCase } = useMCCStore.getState()

      expect(cases[0].name).toBe("Updated Name")
      expect(currentCase?.name).toBe("Updated Name")
    })

    it("should delete a case", () => {
      const testCase: Case = {
        id: "case-1",
        name: "Test Case",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().addCase(testCase)
      useMCCStore.getState().setCurrentCase(testCase)
      useMCCStore.getState().deleteCase("case-1")

      const { cases, currentCase } = useMCCStore.getState()

      expect(cases).toHaveLength(0)
      expect(currentCase).toBeNull()
    })

    it("should set cases with array", () => {
      const testCases: Case[] = [
        {
          id: "case-1",
          name: "Case 1",
          sections: [],
          lastModified: new Date().toISOString(),
        },
        {
          id: "case-2",
          name: "Case 2",
          sections: [],
          lastModified: new Date().toISOString(),
        },
      ]

      useMCCStore.getState().setCases(testCases)
      const { cases } = useMCCStore.getState()

      expect(cases).toHaveLength(2)
      expect(cases).toEqual(testCases)
    })

    it("should set cases with updater function", () => {
      const initialCase: Case = {
        id: "case-1",
        name: "Initial",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().setCases([initialCase])
      useMCCStore.getState().setCases((prev) => [
        ...prev,
        {
          id: "case-2",
          name: "Added",
          sections: [],
          lastModified: new Date().toISOString(),
        },
      ])

      const { cases } = useMCCStore.getState()
      expect(cases).toHaveLength(2)
    })
  })

  describe("Section Operations", () => {
    beforeEach(() => {
      const testCase: Case = {
        id: "case-1",
        name: "Test Case",
        sections: [],
        lastModified: new Date().toISOString(),
      }
      useMCCStore.getState().setCurrentCase(testCase)
    })

    it("should add a section to current case", () => {
      const newSection: Section = {
        id: "section-1",
        title: "Test Section",
        tables: [],
      }

      useMCCStore.getState().addSection(newSection)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase?.sections).toHaveLength(1)
      expect(currentCase?.sections[0]).toEqual(newSection)
    })

    it("should update a section", () => {
      const section: Section = {
        id: "section-1",
        title: "Original Title",
        tables: [],
      }

      useMCCStore.getState().addSection(section)

      const updatedSection: Section = {
        ...section,
        title: "Updated Title",
      }

      useMCCStore.getState().updateSection("section-1", updatedSection)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase?.sections[0].title).toBe("Updated Title")
    })

    it("should delete a section", () => {
      const section: Section = {
        id: "section-1",
        title: "Test Section",
        tables: [],
      }

      useMCCStore.getState().addSection(section)
      useMCCStore.getState().deleteSection("section-1")

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections).toHaveLength(0)
    })

    it("should not add section if no current case", () => {
      useMCCStore.getState().setCurrentCase(null)

      const newSection: Section = {
        id: "section-1",
        title: "Test Section",
        tables: [],
      }

      useMCCStore.getState().addSection(newSection)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase).toBeNull()
    })
  })

  describe("Table Operations", () => {
    beforeEach(() => {
      const testCase: Case = {
        id: "case-1",
        name: "Test Case",
        sections: [
          {
            id: "section-1",
            title: "Test Section",
            tables: [],
          },
        ],
        lastModified: new Date().toISOString(),
      }
      useMCCStore.getState().setCurrentCase(testCase)
    })

    it("should add a table to a section", () => {
      const newTable: Table = {
        id: "table-1",
        title: "Test Table",
        columns: 2,
        rows: [],
        hasHeader: false,
      }

      useMCCStore.getState().addTable("section-1", newTable)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase?.sections[0].tables).toHaveLength(1)
      expect(currentCase?.sections[0].tables[0]).toEqual(newTable)
    })

    it("should update a table", () => {
      const table: Table = {
        id: "table-1",
        title: "Original Title",
        columns: 2,
        rows: [],
        hasHeader: false,
      }

      useMCCStore.getState().addTable("section-1", table)

      const updatedTable: Table = {
        ...table,
        title: "Updated Title",
      }

      useMCCStore.getState().updateTable("section-1", "table-1", updatedTable)
      const { currentCase } = useMCCStore.getState()

      expect(currentCase?.sections[0].tables[0].title).toBe("Updated Title")
    })

    it("should delete a table", () => {
      const table: Table = {
        id: "table-1",
        title: "Test Table",
        columns: 2,
        rows: [],
        hasHeader: false,
      }

      useMCCStore.getState().addTable("section-1", table)
      useMCCStore.getState().deleteTable("section-1", "table-1")

      const { currentCase } = useMCCStore.getState()
      expect(currentCase?.sections[0].tables).toHaveLength(0)
    })
  })

  describe("AI Generation State", () => {
    it("should set isGenerating flag", () => {
      useMCCStore.getState().setIsGenerating(true)
      expect(useMCCStore.getState().isGenerating).toBe(true)

      useMCCStore.getState().setIsGenerating(false)
      expect(useMCCStore.getState().isGenerating).toBe(false)
    })

    it("should set temperature", () => {
      useMCCStore.getState().setTemperature(0.8)
      expect(useMCCStore.getState().temperature).toBe(0.8)
    })

    it("should update attemptedFields with Set", () => {
      const fields = new Set(["cell-1", "cell-2"])
      useMCCStore.getState().setAttemptedFields(fields)

      const { attemptedFieldsArray } = useMCCStore.getState()
      expect(attemptedFieldsArray).toHaveLength(2)
      expect(attemptedFieldsArray).toContain("cell-1")
      expect(attemptedFieldsArray).toContain("cell-2")
    })

    it("should update attemptedFields with updater function", () => {
      useMCCStore.getState().setAttemptedFields(new Set(["cell-1"]))
      useMCCStore.getState().setAttemptedFields((prev) => {
        const next = new Set(prev)
        next.add("cell-2")
        return next
      })

      const { attemptedFieldsArray } = useMCCStore.getState()
      expect(attemptedFieldsArray).toHaveLength(2)
    })

    it("should update generatedFields with Map", () => {
      const fields = new Map([
        ["cell-1", "variable1"],
        ["cell-2", "variable2"],
      ])
      useMCCStore.getState().setGeneratedFields(fields)

      const { generatedFieldsMap } = useMCCStore.getState()
      expect(Object.keys(generatedFieldsMap)).toHaveLength(2)
      expect(generatedFieldsMap["cell-1"]).toBe("variable1")
      expect(generatedFieldsMap["cell-2"]).toBe("variable2")
    })

    it("should update generatedFields with updater function", () => {
      useMCCStore.getState().setGeneratedFields(new Map([["cell-1", "var1"]]))
      useMCCStore.getState().setGeneratedFields((prev) => {
        const next = new Map(prev)
        next.set("cell-2", "var2")
        return next
      })

      const { generatedFieldsMap } = useMCCStore.getState()
      expect(Object.keys(generatedFieldsMap)).toHaveLength(2)
    })
  })

  describe("Dialog State Management", () => {
    it("should manage delete confirmation dialog", () => {
      useMCCStore.getState().setDeleteConfirmationOpen(true)
      useMCCStore.getState().setCaseToDelete("case-1")

      const { deleteConfirmationOpen, caseToDelete } = useMCCStore.getState()
      expect(deleteConfirmationOpen).toBe(true)
      expect(caseToDelete).toBe("case-1")
    })

    it("should manage upload dialog", () => {
      const uploadContent = {
        cases: [
          {
            id: "case-1",
            name: "Uploaded Case",
            sections: [],
            lastModified: new Date().toISOString(),
          },
        ],
      }

      useMCCStore.getState().setIsUploadDialogOpen(true)
      useMCCStore.getState().setUploadedContent(uploadContent)

      const { isUploadDialogOpen, uploadedContent } = useMCCStore.getState()
      expect(isUploadDialogOpen).toBe(true)
      expect(uploadedContent).toEqual(uploadContent)
    })

    it("should manage download dialog", () => {
      useMCCStore.getState().setIsDownloadDialogOpen(true)
      useMCCStore.getState().setDownloadFileName("test.json")
      useMCCStore.getState().setDownloadType("cases")

      const { isDownloadDialogOpen, downloadFileName, downloadType } = useMCCStore.getState()
      expect(isDownloadDialogOpen).toBe(true)
      expect(downloadFileName).toBe("test.json")
      expect(downloadType).toBe("cases")
    })

    it("should manage table delete confirmation", () => {
      useMCCStore.getState().setDeleteTableConfirmationOpen(true)
      useMCCStore.getState().setTableToDelete({ sectionId: "section-1", tableId: "table-1" })

      const { deleteTableConfirmationOpen, tableToDelete } = useMCCStore.getState()
      expect(deleteTableConfirmationOpen).toBe(true)
      expect(tableToDelete).toEqual({ sectionId: "section-1", tableId: "table-1" })
    })
  })

  describe("Menu State Management", () => {
    it("should manage fill menu anchor", () => {
      const mockElement = document.createElement("div")
      useMCCStore.getState().setFillMenuAnchorEl(mockElement)

      const { fillMenuAnchorEl } = useMCCStore.getState()
      expect(fillMenuAnchorEl).toBe(mockElement)
    })

    it("should manage active table", () => {
      useMCCStore.getState().setActiveTableId("table-1")
      expect(useMCCStore.getState().activeTableId).toBe("table-1")
    })
  })

  describe("Rename Operations", () => {
    it("should set editing name state", () => {
      const editingName = {
        type: "case" as const,
        id: "case-1",
        name: "Test Case",
      }

      useMCCStore.getState().setEditingName(editingName)
      expect(useMCCStore.getState().editingName).toEqual(editingName)
    })

    it("should set new name", () => {
      useMCCStore.getState().setNewName("New Name")
      expect(useMCCStore.getState().newName).toBe("New Name")
    })

    it("should clear editing name", () => {
      useMCCStore.getState().setEditingName({ type: "case", id: "case-1", name: "Test" })
      useMCCStore.getState().setEditingName(null)
      expect(useMCCStore.getState().editingName).toBeNull()
    })
  })

  describe("Reset Functionality", () => {
    it("should reset all state to initial values", () => {
      // Modify various state
      const testCase: Case = {
        id: "case-1",
        name: "Test",
        sections: [],
        lastModified: new Date().toISOString(),
      }
      useMCCStore.getState().addCase(testCase)
      useMCCStore.getState().setCurrentCase(testCase)
      useMCCStore.getState().setIsGenerating(true)
      useMCCStore.getState().setTemperature(0.9)
      useMCCStore.getState().setDeleteConfirmationOpen(true)

      // Reset
      useMCCStore.getState().reset()

      // Verify all state is reset
      const state = useMCCStore.getState()
      expect(state.cases).toEqual([])
      expect(state.currentCase).toBeNull()
      expect(state.isGenerating).toBe(false)
      expect(state.temperature).toBe(0.7)
      expect(state.deleteConfirmationOpen).toBe(false)
    })
  })

  describe("Updater Functions", () => {
    it("should support updater function for setCurrentCase", () => {
      const testCase: Case = {
        id: "case-1",
        name: "Original",
        sections: [],
        lastModified: new Date().toISOString(),
      }

      useMCCStore.getState().setCurrentCase(testCase)
      useMCCStore.getState().setCurrentCase((prev) => {
        if (!prev) return null
        return { ...prev, name: "Updated" }
      })

      expect(useMCCStore.getState().currentCase?.name).toBe("Updated")
    })

    it("should support updater function for setNewTableData", () => {
      useMCCStore.getState().setNewTableData((prev) => ({
        ...prev,
        rows: 5,
      }))

      expect(useMCCStore.getState().newTableData.rows).toBe(5)
    })
  })
})
