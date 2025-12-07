import OpenAI from "openai"
import { useMCCStore } from "../../../stores/mccStore"
import { SYSTEM_PROMPTS, USER_PROMPTS } from "../../../shared/constants/prompts"

// Initialize OpenAI client conditionally
const getOpenAIClient = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    return null // Return null instead of throwing error
  }
  return new OpenAI({
    apiKey,
    dangerouslyAllowBrowser: true,
  })
}

const DEBUG = import.meta.env.VITE_DEBUG === "true" || false

export const useAIGeneration = () => {
  // Get state from store
  const currentCase = useMCCStore((state) => state.currentCase)
  const temperature = useMCCStore((state) => state.temperature)
  const isGenerating = useMCCStore((state) => state.isGenerating)

  // Get actions from store
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setGeneratedFields = useMCCStore((state) => state.setGeneratedFields)
  const setIsGenerating = useMCCStore((state) => state.setIsGenerating)

  const collectCellContext = (
    tableId: string,
    rowId: string,
    cellId: string,
    isRegeneration: boolean = false
  ): Record<string, string> => {
    if (!currentCase) return {}

    const existingContent: Record<string, string> = {}
    let assignedRowHeader = ""

    // Collect all relevant content for context
    // For regeneration, include AI-generated content too
    // Read key:value content, headers/key in odd-numbered columns and values in even-numbered columns
    currentCase.sections.forEach((section) => {
      section.tables.forEach((table) => {
        table.rows.forEach((row, rowIndex) => {
          // Handling pair of key and value
          for (let i = 0; i < row.cells.length; i += 2) {
            if (row.cells[i] && row.cells[i + 1]) {
              const header = row.cells[i].content
              const value = row.cells[i + 1].content
              const contextKey = `${section.title} - ${table.title} - ${header}`
              existingContent[contextKey] = `"${value}"`
            }
          }
        })
      })
    })

    // Find the current cell's context
    const currentSection = currentCase.sections.find((section) =>
      section.tables.some((t) => t.id === tableId)
    )
    const currentTable = currentSection?.tables.find((t) => t.id === tableId)
    const currentRow = currentTable?.rows.find((r) => r.id === rowId)
    const currentCell = currentRow?.cells.find((c) => c.id === cellId)
    const currentColumnIndex =
      currentCell && currentRow?.cells ? currentRow.cells.indexOf(currentCell) : -1

    // Add column header to context if available
    if (currentTable?.hasHeader && currentColumnIndex !== -1 && currentTable.rows.length > 0) {
      const headerRow = currentTable.rows[0]
      if (headerRow && headerRow.cells.length > currentColumnIndex) {
        const headerContent = headerRow.cells[currentColumnIndex].content
        if (headerContent && !headerContent.includes("{")) {
          existingContent["Current Column Header"] = headerContent
        }
      }
    }

    // Add row header to context if available
    if (currentRow?.cells && currentRow.cells.length > 0) {
      const headerContent = currentRow.cells[0].content
      if (headerContent && !headerContent.includes("{")) {
        existingContent["Current Row Header"] = headerContent
        assignedRowHeader = headerContent
      }
    }

    // For regeneration, explicitly add the current cell's content as "Previous Value"
    if (isRegeneration && currentCell?.content && currentCell.isAIGenerated) {
      existingContent["Previous Generated Value"] = currentCell.content
    }

    if (DEBUG) console.log(`🧐 Debugging collectCellContext() for cell ${cellId}`)
    if (DEBUG) console.log("📌 Assigned Row Header:", assignedRowHeader)
    if (DEBUG) console.log("📜 Full Context Object:", existingContent)
    if (isRegeneration) {
      if (DEBUG) {
        console.log(
          "🔄 Previous Generated Value:",
          existingContent["Previous Generated Value"] || "None found"
        )
      }
    }

    return existingContent
  }

  const generateContent = async (
    tableId: string,
    rowId: string,
    cellId: string,
    originalVariable: string,
    isRegeneration: boolean = false
  ): Promise<string> => {
    // Pass isRegeneration flag to collectCellContext to include AI-generated content
    const existingContent = collectCellContext(tableId, rowId, cellId, isRegeneration)

    const rowHeader = existingContent["Current Row Header"] || ""
    const previousValue = existingContent["Previous Generated Value"] || ""

    if (DEBUG) console.log("🚀 AI Generation Triggered!")
    if (DEBUG) console.log("🔎 AI Generating for:", originalVariable)
    if (DEBUG) console.log("📜 Full Context Passed to AI:", existingContent)
    if (DEBUG) console.log("📌 Correct Row Header Being Sent to AI:", rowHeader)
    if (isRegeneration) {
      if (DEBUG) console.log("🔄 Regenerating from previous value:", previousValue)
    }

    // Modify prompt structure to reduce row header bias
    let rowHeaderText = ""
    if (rowHeader && rowHeader !== originalVariable) {
      rowHeaderText = `\nNote: The following values belong to the same category as "${rowHeader}", However, "${originalVariable}" is an **independent and unrelated measurement**. Ensure no assumptions are made based on "${rowHeader}".`
    }

    // Add specific regeneration instructions
    let regenerationText = ""
    if (isRegeneration && previousValue) {
      regenerationText = `\nThe previous value was "${previousValue}". Please generate a DIFFERENT appropriate value that maintains medical accuracy but provides variety. Avoid repeating the exact same value.`
    }

    // Construct AI prompt
    const prompt = `${isRegeneration ? USER_PROMPTS.REGENERATE : USER_PROMPTS.GENERATE} ${originalVariable}.

Important: Use the following context to ensure the generated value is consistent with the existing information:
${Object.entries(existingContent)
  .filter(([key]) => key !== "Previous Generated Value")
  .map(([key, value]) => `- ${key}: ${value}`)
  .join("\n")}

    SYSTEM_PROMPTS.MAINTAIN_CONTEXT_INSTRUCTIONS

${rowHeaderText} ${regenerationText}

Generate a medically accurate value for: ${originalVariable}`

    if (DEBUG) console.log("---- Final AI Prompt Sent:", prompt)

    // Add system message specific to regeneration if applicable
    const systemMessage = isRegeneration
      ? `${SYSTEM_PROMPTS.MEDICAL_CASE_GENERATOR}\n\nThis is a regeneration request. The previous generated value "${previousValue}" needs to be replaced with a different appropriate value. Provide variety while maintaining medical realism and consistency with the context. For patient identifiers like names, preserve any specific names mentioned in the context.`
      : `${SYSTEM_PROMPTS.MEDICAL_CASE_GENERATOR}\n\nYou are generating medical case values. Your primary goal is to ensure all generated values are consistent with the provided context and maintain medical realism. Pay special attention to:
1. Patient identifiers (names, etc.) - if mentioned in context, use EXACTLY those values
2. Relationships between different medical values
3. Forming a coherent clinical picture`

    if (DEBUG) console.log("📄 System Message:", systemMessage)

    const openai = getOpenAIClient()
    if (!openai) {
      throw new Error(
        "AI features are not available. Please configure your OpenAI API key in the environment variables."
      )
    }
    const completion = await openai.chat.completions.create({
      model: "gpt-4-0125-preview",
      messages: [
        {
          role: "system",
          content: systemMessage,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      // Increase temperature for regeneration to ensure variety
      temperature: isRegeneration ? Math.max(0.9, temperature + 0.3) : temperature,
    })

    if (DEBUG) {
      console.log(
        "🌡️ Temperature used:",
        isRegeneration ? Math.max(0.9, temperature + 0.3) : temperature
      )
    }
    if (DEBUG) console.log("🔍 AI Raw Response:", completion.choices[0]?.message?.content?.trim())

    return completion.choices[0]?.message?.content?.trim() || ""
  }

  const updateCellContent = (
    tableId: string,
    rowId: string,
    cellId: string,
    content: string,
    originalVariable: string
  ) => {
    if (DEBUG) {
      console.log("✅ Updating Cell Content:")
      console.log("📝 Original Variable:", originalVariable)
      console.log("🆕 New Content:", content)
    }

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
                  const oldContent = cell.content
                  if (DEBUG) console.log("🔄 Replacing:", oldContent, "→", content)
                  return {
                    ...cell,
                    content,
                    isAIGenerated: true,
                    originalVariable,
                  }
                }
                return cell
              }),
            })),
          })),
        })),
      }
    })

    setGeneratedFields((prev) => new Map(prev.set(cellId, originalVariable)))
  }

  const generateFieldContent = async (
    tableId: string,
    rowId: string,
    cellId: string,
    content: string
  ) => {
    if (!currentCase) return

    const varPattern = /\{([^}]+)\}/
    const match = content.match(varPattern)
    if (!match) return

    const originalVariable = match[1].trim()

    if (DEBUG) console.log("🎬 Starting Initial Generation for:", originalVariable)
    setIsGenerating(true)
    try {
      const generatedContent = await generateContent(
        tableId,
        rowId,
        cellId,
        originalVariable,
        false
      )
      updateCellContent(tableId, rowId, cellId, generatedContent, originalVariable)
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateField = async (tableId: string, rowId: string, cellId: string) => {
    if (!currentCase) return

    const cell = currentCase.sections
      .flatMap((s) => s.tables)
      .find((t) => t.id === tableId)
      ?.rows.find((r) => r.id === rowId)
      ?.cells.find((c) => c.id === cellId)

    const originalVariable = cell?.originalVariable

    if (!originalVariable) {
      if (DEBUG) console.log("⚠️ Cannot regenerate: No original variable found for this cell")
      return
    }

    if (DEBUG) console.log("🔁 Starting Regeneration for field:", originalVariable)
    if (DEBUG) console.log("📊 Current content:", cell?.content)

    setIsGenerating(true)
    try {
      const generatedContent = await generateContent(tableId, rowId, cellId, originalVariable, true)
      updateCellContent(tableId, rowId, cellId, generatedContent, originalVariable)
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateTable = async (tableId: string) => {
    if (!currentCase) return

    const table = currentCase.sections.flatMap((s) => s.tables).find((t) => t.id === tableId)

    if (!table) {
      if (DEBUG) console.log("⚠️ Table not found:", tableId)
      return
    }

    if (DEBUG) console.log("🔁 Starting Table Regeneration for:", table.title)

    setIsGenerating(true)
    try {
      for (const row of table.rows) {
        for (const cell of row.cells) {
          if (cell.isAIGenerated && cell.originalVariable) {
            if (DEBUG) {
              console.log(
                `🔄 Regenerating cell: ${cell.originalVariable} (current: ${cell.content})`
              )
            }
            await regenerateField(table.id, row.id, cell.id)
          }
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  const regenerateForm = async () => {
    if (!currentCase) return

    if (DEBUG) console.log("🔁 Starting Full Form Regeneration")
    setIsGenerating(true)
    try {
      for (const section of currentCase.sections) {
        for (const table of section.tables) {
          if (DEBUG) console.log(`🔄 Regenerating table: ${table.title}`)
          for (const row of table.rows) {
            for (const cell of row.cells) {
              if (cell.isAIGenerated && cell.originalVariable) {
                if (DEBUG) {
                  console.log(
                    `🔄 Regenerating cell: ${cell.originalVariable} (current: ${cell.content})`
                  )
                }
                await regenerateField(table.id, row.id, cell.id)
              }
            }
          }
        }
      }
    } finally {
      setIsGenerating(false)
    }
  }

  return {
    isGenerating,
    generateFieldContent,
    regenerateField,
    regenerateTable,
    regenerateForm,
  }
}
