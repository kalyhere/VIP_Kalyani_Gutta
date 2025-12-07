import React, { useState, useEffect } from "react"
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  Grid,
  TextField,
  DialogActions,
  Snackbar,
  FormControlLabel,
  Checkbox,
} from "@mui/material"
import { Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon } from "@mui/icons-material"

interface Class {
  id: number
  name: string
  code: string
  term: string
  is_active: boolean
  faculty_id: number
  created_at: string
  updated_at: string
  student_count: number
}

interface ClassFormData {
  name: string
  code: string
  term: string
  is_active: boolean
  faculty_id: number | ""
}

export const ClassManagement: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingClass, setEditingClass] = useState<Class | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })

  const [formData, setFormData] = useState<ClassFormData>({
    name: "",
    code: "",
    term: "",
    is_active: true,
    faculty_id: "",
  })

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/classes/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch classes")
      }

      const data = await response.json()
      setClasses(data)
    } catch (err) {
      console.error("Error fetching classes:", err)
      setError("Failed to load classes")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchClasses()
  }, [])

  // Open Class Dialog Box
  const handleOpenDialog = (classItem?: Class) => {
    if (classItem) {
      setEditingClass(classItem)
      setFormData({
        name: classItem.name,
        code: classItem.code,
        term: classItem.term,
        is_active: classItem.is_active,
        faculty_id: classItem.faculty_id, // Only Used for POST (Create a new Class)
      })
    } else {
      setEditingClass(null)
      setFormData({
        name: "",
        code: "",
        term: "",
        is_active: true,
        faculty_id: "",
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingClass(null)
  }

  // Submit the dialog box form when creating/editing a class
  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const payload = {
        ...formData,
        // Only include faculty ID if making a new class
        ...(editingClass ? {} : { faculty_id: Number(formData.faculty_id) }),
      }

      const response = await fetch(
        editingClass ? `${apiUrl}/api/classes/${editingClass.id}` : `${apiUrl}/api/classes/`,
        {
          method: editingClass ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to save class")
      }

      setSnackbar({
        open: true,
        message: editingClass ? "Class updated successfully" : "Class created successfully",
        severity: "success",
      })

      handleCloseDialog()
      fetchClasses()
    } catch (err) {
      console.error("Error saving class:", err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save class",
        severity: "error",
      })
    }
  }

  // Delete an existing class
  const handleDelete = async (classItem: Class) => {
    if (!window.confirm(`Are you sure you want to delete class ${classItem.name}?`)) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/classes/${classItem.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete class")
      }

      setSnackbar({
        open: true,
        message: "Class deleted successfully",
        severity: "success",
      })

      fetchClasses()
    } catch (err) {
      console.error("Error deleting class:", err)
      setSnackbar({
        open: true,
        message: "Failed to delete class",
        severity: "error",
      })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
        <Typography variant="h6">Class Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add Class
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Faculty ID</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {classes.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell>{classItem.id}</TableCell>
                <TableCell>{classItem.name}</TableCell>
                <TableCell>
                  <div>
                    <strong>Class Code:</strong>
                    {" "}
                    {classItem.code}
                  </div>
                  <div>
                    <strong>Term:</strong>
                    {" "}
                    {classItem.term}
                  </div>
                  <div>
                    <strong>Created At:</strong>
                    {" "}
                    {new Date(classItem.created_at).toLocaleString()}
                  </div>
                  <div>
                    <strong>Updated At:</strong>
                    {" "}
                    {new Date(classItem.updated_at).toLocaleString()}
                  </div>
                </TableCell>
                <TableCell>{classItem.faculty_id}</TableCell>
                <TableCell>
                  <Chip
                    label={classItem.is_active ? "Active" : "Inactive"}
                    color={classItem.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    color="primary"
                    onClick={() => handleOpenDialog(classItem)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(classItem)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Class Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingClass ? "Edit Class" : "Add New Class"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            {!editingClass && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Faculty ID"
                  value={formData.faculty_id}
                  onChange={(e) =>
                    setFormData({ ...formData, faculty_id: parseInt(e.target.value, 10) || 0 })
                  }
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Term"
                value={formData.term}
                onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  />
                }
                label="Active"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingClass ? "Update" : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
