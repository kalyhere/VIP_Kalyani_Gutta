import { useRef } from "react"
import { useMCCStore } from "../../../stores/mccStore"
import { Case } from "../../../shared/types"
import {
  downloadCases,
  downloadFormat,
  uploadFile,
  getDefaultDownloadFileName,
} from "../../../shared/utils/fileOperations"

export const useFileOperations = () => {
  // Get state from store
  const cases = useMCCStore((state) => state.cases)
  const currentCase = useMCCStore((state) => state.currentCase)
  const isUploadDialogOpen = useMCCStore((state) => state.isUploadDialogOpen)
  const uploadedContent = useMCCStore((state) => state.uploadedContent)
  const isDownloadDialogOpen = useMCCStore((state) => state.isDownloadDialogOpen)
  const downloadFileName = useMCCStore((state) => state.downloadFileName)
  const downloadType = useMCCStore((state) => state.downloadType)

  // Get actions from store
  const setCases = useMCCStore((state) => state.setCases)
  const setCurrentCase = useMCCStore((state) => state.setCurrentCase)
  const setIsUploadDialogOpen = useMCCStore((state) => state.setIsUploadDialogOpen)
  const setUploadedContent = useMCCStore((state) => state.setUploadedContent)
  const setIsDownloadDialogOpen = useMCCStore((state) => state.setIsDownloadDialogOpen)
  const setDownloadFileName = useMCCStore((state) => state.setDownloadFileName)
  const setDownloadType = useMCCStore((state) => state.setDownloadType)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleStartDownload = (type: "cases" | "format") => {
    setDownloadFileName(getDefaultDownloadFileName(type))
    setDownloadType(type)
    setIsDownloadDialogOpen(true)
  }

  const handleDownloadFormat = () => {
    downloadFormat(currentCase, downloadFileName)
    setIsDownloadDialogOpen(false)
  }

  const handleDownloadMedicalCases = () => {
    downloadCases(cases, downloadFileName)
    setIsDownloadDialogOpen(false)
  }

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const content = await uploadFile(file)

      if (cases.length === 0) {
        // If there are no existing cases, just set the uploaded cases directly
        setCases(content.cases)
        localStorage.setItem("medicalCases", JSON.stringify(content.cases))
      } else {
        // Only show merge dialog if there are existing cases
        setUploadedContent(content)
        setIsUploadDialogOpen(true)
      }
    } catch (error) {
      console.error("Error parsing file:", error)
      alert("Invalid file format")
    }
    event.target.value = ""
  }

  const handleUploadFormat = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentCase) return

    uploadFile(file)
      .then(({ cases }) => {
        if (cases.length > 0) {
          setCurrentCase({
            ...currentCase,
            sections: cases[0].sections,
          })
        }
      })
      .catch((error) => {
        console.error("Error parsing format file:", error)
        alert("Invalid format file")
      })
  }

  const handleMergeCases = () => {
    if (!uploadedContent) return
    setCases((prevCases) => {
      // Check both ID and name for duplicates
      const existingIds = new Set(prevCases.map((c) => c.id))
      const existingNames = new Set(prevCases.map((c) => c.name))

      const newCases = uploadedContent.cases.filter(
        (c) => !existingIds.has(c.id) && !existingNames.has(c.name)
      )

      const mergedCases = [...prevCases, ...newCases]
      localStorage.setItem("medicalCases", JSON.stringify(mergedCases))
      return mergedCases
    })
    setIsUploadDialogOpen(false)
    setUploadedContent(null)
  }

  const handleReplaceCases = () => {
    if (!uploadedContent) return
    setCases(uploadedContent.cases)
    localStorage.setItem("medicalCases", JSON.stringify(uploadedContent.cases))
    setIsUploadDialogOpen(false)
    setUploadedContent(null)
  }

  return {
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
  }
}
