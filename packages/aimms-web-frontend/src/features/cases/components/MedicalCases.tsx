import React, { useState, useEffect } from "react"
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
} from "@mui/material"
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as AssignIcon,
  Public as PublicIcon,
  Lock as LockIcon,
} from "@mui/icons-material"
import { MedicalCase, MedicalCaseUpdate } from "@/types/medical-cases"
import { CaseUpload } from "./CaseUpload"
import { AssignCase } from "@/features/assignments"

export const MedicalCases: React.FC = () => {
  const [cases, setCases] = useState<MedicalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editCase, setEditCase] = useState<MedicalCase | null>(null)
  const [assignCase, setAssignCase] = useState<MedicalCase | null>(null)
  const [editedFields, setEditedFields] = useState<MedicalCaseUpdate>({})
  const userRole = localStorage.getItem("user_role")
  const isAdmin = userRole === "admin"
  const isFaculty = userRole === "faculty"

  const fetchCases = async () => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/medical-cases/`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })
      if (!response.ok) throw new Error("Failed to fetch cases")
      const data = await response.json()
      setCases(data)
    } catch (error) {
      setError("Failed to load medical cases")
      console.error("Error fetching cases:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const handleUpdateCase = async () => {
    if (!editCase) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/medical-cases/${editCase.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(editedFields),
      })

      if (!response.ok) throw new Error("Failed to update case")

      const updatedCase = await response.json()
      setCases(cases.map((c) => (c.id === updatedCase.id ? updatedCase : c)))
      setEditCase(null)
      setEditedFields({})
    } catch (error) {
      setError("Failed to update case")
      console.error("Error updating case:", error)
    }
  }

  const handleDeleteCase = async (caseId: number) => {
    if (!window.confirm("Are you sure you want to delete this case?")) return

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/medical-cases/${caseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) throw new Error("Failed to delete case")
      setCases(cases.filter((c) => c.id !== caseId))
    } catch (error) {
      setError("Failed to delete case")
      console.error("Error deleting case:", error)
    }
  }

  const handleCaseUploaded = (newCase: MedicalCase) => {
    setCases([...cases, newCase])
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box sx={{ p: 3 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {(isAdmin || isFaculty) && (
        <Box sx={{ mb: 3 }}>
          <CaseUpload onCaseUploaded={handleCaseUploaded} />
        </Box>
      )}

      <Grid container spacing={3}>
        {cases.map((medicalCase) => (
          <Grid item xs={12} md={6} lg={4} key={medicalCase.id}>
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                  <Typography variant="h6" component="div">
                    {medicalCase.title}
                  </Typography>
                  <Box>
                    {medicalCase.is_public ? (
                      <Chip
                        icon={<PublicIcon />}
                        label="Public"
                        size="small"
                        color="primary"
                        sx={{ mr: 1 }}
                      />
                    ) : (
                      <Chip icon={<LockIcon />} label="Private" size="small" sx={{ mr: 1 }} />
                    )}
                  </Box>
                </Box>

                <Typography color="text.secondary" sx={{ mb: 2 }}>
                  {medicalCase.description}
                </Typography>

                <Box sx={{ display: "flex", gap: 1, mb: 2 }}>
                  <Chip label={medicalCase.difficulty} size="small" />
                  <Chip label={medicalCase.duration} size="small" />
                </Box>

                {medicalCase.topics.length > 0 && (
                  <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mb: 2 }}>
                    {medicalCase.topics.map((topic) => (
                      <Chip key={topic} label={topic} size="small" variant="outlined" />
                    ))}
                  </Box>
                )}

                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1 }}>
                  {(isAdmin ||
                    (isFaculty &&
                      medicalCase.created_by ===
                        parseInt(localStorage.getItem("user_id") || "0"))) && (
                    <>
                          <IconButton
                        size="small"
                        onClick={() => setEditCase(medicalCase)}
                        color="primary">
                        <EditIcon />
                      </IconButton>
                          <IconButton
                        size="small"
                        onClick={() => handleDeleteCase(medicalCase.id)}
                        color="error">
                        <DeleteIcon />
                      </IconButton>
                        </>
                  )}
                  {(isAdmin || isFaculty) && (
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => setAssignCase(medicalCase)}>
                      <AssignIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={!!editCase} onClose={() => setEditCase(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Medical Case</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
            <TextField
              label="Title"
              value={editedFields.title ?? editCase?.title ?? ""}
              onChange={(e) => setEditedFields({ ...editedFields, title: e.target.value })}
              fullWidth
            />
            <TextField
              label="Description"
              value={editedFields.description ?? editCase?.description ?? ""}
              onChange={(e) => setEditedFields({ ...editedFields, description: e.target.value })}
              multiline
              rows={3}
              fullWidth
            />
            <TextField
              select
              label="Difficulty"
              value={editedFields.difficulty ?? editCase?.difficulty ?? ""}
              onChange={(e) => setEditedFields({ ...editedFields, difficulty: e.target.value })}
              fullWidth>
              <MenuItem value="Beginner">Beginner</MenuItem>
              <MenuItem value="Intermediate">Intermediate</MenuItem>
              <MenuItem value="Advanced">Advanced</MenuItem>
            </TextField>
            <TextField
              label="Duration"
              value={editedFields.duration ?? editCase?.duration ?? ""}
              onChange={(e) => setEditedFields({ ...editedFields, duration: e.target.value })}
              fullWidth
            />
            {isAdmin && (
              <Button
                variant="outlined"
                onClick={() =>
                  setEditedFields({
                  ...editedFields,
                  is_public: !(editedFields.is_public ?? editCase?.is_public),
                })
                }>
                {(editedFields.is_public ?? editCase?.is_public) ? "Make Private" : "Make Public"}
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setEditCase(null)
              setEditedFields({})
            }}>
            Cancel
          </Button>
          <Button onClick={handleUpdateCase} variant="contained">
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {assignCase && (
        <AssignCase
          open={!!assignCase}
          onClose={() => setAssignCase(null)}
          medicalCase={assignCase}
        />
      )}
    </Box>
  )
}
