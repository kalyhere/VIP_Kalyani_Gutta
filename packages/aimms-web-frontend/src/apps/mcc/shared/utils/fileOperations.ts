import { Case } from "../../types"
import { downloadJson } from "@/lib/fileUtils"

interface CasesData {
  version: string
  timestamp: string
  cases: Case[]
}

interface FormatData {
  version: string
  timestamp: string
  name: string
  sections: Case["sections"]
}

export const getDefaultDownloadFileName = (type: "cases" | "format"): string => {
  const date = new Date().toISOString().split("T")[0]
  return type === "cases" ? `medical-cases-${date}` : `medical-case-format-${date}`
}

export const downloadCases = (cases: Case[], fileName: string) => {
  const casesData: CasesData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    cases,
  }

  downloadJson(casesData, fileName)
}

export const downloadFormat = (currentCase: Case | null, fileName: string) => {
  const formatData: FormatData = {
    version: "1.0",
    timestamp: new Date().toISOString(),
    name: currentCase?.name || "",
    sections: currentCase?.sections || [],
  }

  downloadJson(formatData, fileName)
}

export const uploadFile = async (file: File): Promise<{ cases: Case[] }> =>
  new Promise((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = JSON.parse(e.target?.result as string)

      // Check if it's a valid cases file
      if (content.cases && Array.isArray(content.cases)) {
        resolve({ cases: content.cases })
      } else if (content.sections && Array.isArray(content.sections)) {
        // This is a format file, convert it to a case
        const newCase: Case = {
          id: `case-${Date.now()}`,
          name: content.name || "Imported Format",
          sections: content.sections,
          lastModified: new Date().toISOString(),
        }
        resolve({ cases: [newCase] })
      } else {
        reject(new Error("Invalid file format"))
      }
    } catch (error) {
      reject(new Error("Error parsing JSON file"))
    }
  }
  reader.onerror = () => reject(new Error("Error reading file"))
  reader.readAsText(file)
})
