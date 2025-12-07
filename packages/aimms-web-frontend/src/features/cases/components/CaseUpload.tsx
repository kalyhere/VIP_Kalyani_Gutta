import React, { useState } from "react"
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Typography,
  FormControlLabel,
  Switch,
  CircularProgress,
} from "@mui/material"
import { Upload as UploadIcon } from "@mui/icons-material"
import { MedicalCase, MedicalCaseCreate } from "@/types/medical-cases"

interface CaseUploadProps {
  onCaseUploaded: (newCase: MedicalCase) => void
}

export const CaseUpload: React.FC<CaseUploadProps> = ({ onCaseUploaded }) => {
  const [open, setOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [isPublic, setIsPublic] = useState(false)
  const [description, setDescription] = useState("")
  const [duration, setDuration] = useState("")
  const userRole = localStorage.getItem("user_role")
  const isAdmin = userRole === "admin"

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file")
      return
    }

    if (!description) {
      setError("Please provide a description")
      return
    }

    if (!duration) {
      setError("Please provide an estimated duration")
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Read and validate the MCC JSON file
      const fileContent = await file.text()
      const caseContent = JSON.parse(fileContent)

      // Validate that this is an MCC case file
      if (!caseContent.sections || !Array.isArray(caseContent.sections)) {
        throw new Error("Invalid MCC case format: missing sections array")
      }

      // Create the medical case data
      const caseData: MedicalCaseCreate = {
        title: caseContent.name || file.name.replace(".json", ""),
        description,
        difficulty: "Beginner", // Default to beginner, can be updated later
        duration,
        topics: [], // Can be added later
        content: caseContent,
        is_public: isAdmin ? isPublic : undefined,
      }

      // Send to backend
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/medical-cases/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(caseData),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to parse error response" }))
        throw new Error(errorData.detail || "Failed to upload case to server")
      }

      const newCase = await response.json()
      onCaseUploaded(newCase)

      // Reset form and close dialog
      setFile(null)
      setIsPublic(false)
      setDescription("")
      setDuration("")
      setOpen(false)
    } catch (error) {
      console.error("Error uploading case:", error)
      setError(error instanceof Error ? error.message : "Failed to upload case")
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        variant="contained"
        startIcon={<UploadIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}>
        Upload MCC Case
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Upload MCC Case</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <input
              type="file"
              accept=".json"
              onChange={handleFileChange}
              style={{ display: "none" }}
              id="case-file-input"
            />
            <label htmlFor="case-file-input">
              <Button
                variant="outlined"
                component="span"
                fullWidth
                sx={{ height: 100, borderStyle: "dashed" }}>
                {file ? file.name : "Click to select or drop a JSON file"}
              </Button>
            </label>

            <TextField
              label="Description"
              multiline
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />

            <TextField
              label="Estimated Duration"
              placeholder="e.g., 30 minutes"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              required
            />

            {isAdmin && (
              <FormControlLabel
                control={
                  <Switch checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} />
                }
                label="Make this case public (visible to all faculty)"
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={handleUpload}
            disabled={!file || !description || !duration || loading}
            variant="contained">
            {loading ? <CircularProgress size={24} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}
