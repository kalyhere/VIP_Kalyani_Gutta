import { describe, it, expect } from "vitest"
import { hasUnfilledVariables, hasGeneratedContent, isTableDataValid } from "../../utils/tableUtils"
import { TableSection, TableDialogData } from "../../types"

describe("tableUtils", () => {
  describe("hasUnfilledVariables", () => {
    it("should return false if table is undefined", () => {
      expect(hasUnfilledVariables(undefined)).toBe(false)
    })

    it("should return true if table has unfilled variables", () => {
      const table: TableSection = {
        id: "table-1",
        title: "Test Table",
        hasHeader: true,
        columns: 2,
        rows: [
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1",
                content: "Header",
                isHeader: true,
              },
              {
                id: "cell-2",
                content: "{variable}",
                isHeader: false,
              },
            ],
          },
        ],
      }
      expect(hasUnfilledVariables(table)).toBe(true)
    })

    it("should return false if table has no unfilled variables", () => {
      const table: TableSection = {
        id: "table-1",
        title: "Test Table",
        hasHeader: true,
        columns: 2,
        rows: [
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1",
                content: "Header",
                isHeader: true,
              },
              {
                id: "cell-2",
                content: "Content",
                isHeader: false,
              },
            ],
          },
        ],
      }
      expect(hasUnfilledVariables(table)).toBe(false)
    })

    it("should return false if variable is already AI generated", () => {
      const table: TableSection = {
        id: "table-1",
        title: "Test Table",
        hasHeader: true,
        columns: 2,
        rows: [
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1",
                content: "Header",
                isHeader: true,
              },
              {
                id: "cell-2",
                content: "{variable}",
                isHeader: false,
                isAIGenerated: true,
              },
            ],
          },
        ],
      }
      expect(hasUnfilledVariables(table)).toBe(false)
    })
  })

  describe("hasGeneratedContent", () => {
    it("should return false if table is undefined", () => {
      expect(hasGeneratedContent(undefined)).toBe(false)
    })

    it("should return true if table has AI generated content", () => {
      const table: TableSection = {
        id: "table-1",
        title: "Test Table",
        hasHeader: true,
        columns: 2,
        rows: [
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1",
                content: "Header",
                isHeader: true,
              },
              {
                id: "cell-2",
                content: "AI Generated Content",
                isHeader: false,
                isAIGenerated: true,
              },
            ],
          },
        ],
      }
      expect(hasGeneratedContent(table)).toBe(true)
    })

    it("should return false if table has no AI generated content", () => {
      const table: TableSection = {
        id: "table-1",
        title: "Test Table",
        hasHeader: true,
        columns: 2,
        rows: [
          {
            id: "row-1",
            cells: [
              {
                id: "cell-1",
                content: "Header",
                isHeader: true,
              },
              {
                id: "cell-2",
                content: "Content",
                isHeader: false,
              },
            ],
          },
        ],
      }
      expect(hasGeneratedContent(table)).toBe(false)
    })
  })

  describe("isTableDataValid", () => {
    it("should return true for valid table data", () => {
      const data: TableDialogData = {
        title: "Valid Table",
        rows: 3,
        columns: 3,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(true)
    })

    it("should return false if title is empty", () => {
      const data: TableDialogData = {
        title: "",
        rows: 3,
        columns: 3,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(false)
    })

    it("should return false if rows is less than 1", () => {
      const data: TableDialogData = {
        title: "Invalid Table",
        rows: 0,
        columns: 3,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(false)
    })

    it("should return false if rows is greater than 10", () => {
      const data: TableDialogData = {
        title: "Invalid Table",
        rows: 11,
        columns: 3,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(false)
    })

    it("should return false if columns is less than 1", () => {
      const data: TableDialogData = {
        title: "Invalid Table",
        rows: 3,
        columns: 0,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(false)
    })

    it("should return false if columns is greater than 10", () => {
      const data: TableDialogData = {
        title: "Invalid Table",
        rows: 3,
        columns: 11,
        hasHeader: true,
      }
      expect(isTableDataValid(data)).toBe(false)
    })
  })
})
