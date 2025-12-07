import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material"
import { MedicalCase, CaseAssignmentCreate } from "@/types/medical-cases"

interface Student {
  id: number
  email: string
}

interface AssignCaseProps {
  open: boolean
  onClose: () => void
  medicalCase: MedicalCase
}

export const AssignCase: React.FC<AssignCaseProps> = ({ open, onClose, medicalCase }) => {
  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudent, setSelectedStudent] = useState<number | "">("")
  const [dueDate, setDueDate] = useState<string>("")
  const [feedback, setFeedback] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
        const response = await fetch(`${apiUrl}/api/users/my-students`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })
        if (!response.ok) throw new Error("Failed to fetch students")
        const data = await response.json()
        setStudents(data)
      } catch (error) {
        setError("Failed to load students")
        console.error("Error fetching students:", error)
      }
    }

    if (open) {
      fetchStudents()
    }
  }, [open])

  const handleAssign = async () => {
    if (!selectedStudent) {
      setError("Please select a student")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const assignmentData: CaseAssignmentCreate = {
        case_id: medicalCase.id,
        student_id: selectedStudent,
        due_date: dueDate || undefined,
        feedback: feedback || undefined,
      }

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/medical-cases/assign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
        body: JSON.stringify(assignmentData),
      })

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ detail: "Failed to parse error response" }))
        throw new Error(errorData.detail || "Failed to assign case")
      }

      // Reset form and close dialog
      setSelectedStudent("")
      setDueDate("")
      setFeedback("")
      onClose()
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to assign case")
      console.error("Error assigning case:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Assign Case to Student</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <FormControl fullWidth>
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value as number)}
              label="Student">
              {students.map((student) => (
                <MenuItem key={student.id} value={student.id}>
                  {student.email}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Due Date (Optional)"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            fullWidth
            InputLabelProps={{
              shrink: true,
            }}
          />

          <TextField
            label="Feedback/Notes (Optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleAssign} disabled={!selectedStudent || loading} variant="contained">
          {loading ? <CircularProgress size={24} /> : "Assign Case"}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
