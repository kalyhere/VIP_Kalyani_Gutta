import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel,
  Grid,
  Snackbar,
  Stack,
  Divider,
  Tooltip,
  alpha,
  Tabs,
  Tab,
  Badge,
} from "@mui/material"
import { FlexCenterVertical, FlexRow, FlexColumn, FlexBetween } from "@/components/styled"
import { Edit as EditIcon, Delete as DeleteIcon, Refresh as RefreshIcon } from "@mui/icons-material"
import { MaterialReactTable, MRT_ColumnDef } from "material-react-table"
import { useTheme } from "@mui/material/styles"

interface User {
  id: number
  email: string
  name: string | null
  role: string
  is_active: boolean
  created_cases?: number
}

interface UserFormData {
  email: string
  name: string
  password: string
  role: string
  is_active: boolean
}

export const UserManagement: React.FC = () => {
  const theme = useTheme()
  const [users, setUsers] = useState<User[]>([])
  const [facultyUsers, setFacultyUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [openDialog, setOpenDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  })
  const [activeTab, setActiveTab] = useState<"active" | "inactive">("active")

  const [formData, setFormData] = useState<UserFormData>({
    email: "",
    name: "",
    password: "",
    role: "student",
    is_active: true,
  })

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      const response = await fetch(`${apiUrl}/api/admin/users?include_inactive=true`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users)

      // Filter faculty users for the dropdown
      setFacultyUsers(data.users.filter((user: User) => user.role === "faculty" && user.is_active))
    } catch (err) {
      console.error("Error fetching users:", err)
      setError("Failed to load users")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user)
      setFormData({
        email: user.email,
        name: user.name || "",
        password: "", // Don't pre-fill password for security
        role: user.role,
        is_active: user.is_active,
      })
    } else {
      setEditingUser(null)
      setFormData({
        email: "",
        name: "",
        password: "",
        role: "student",
        is_active: true,
      })
    }
    setOpenDialog(true)
  }

  const handleCloseDialog = () => {
    setOpenDialog(false)
    setEditingUser(null)
  }

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      // Build payload based on whether we're creating or updating
      const payload = editingUser
        ? {
            // For updates, only send updatable fields
            name: formData.name,
            role: formData.role,
            is_active: formData.is_active,
          }
        : {
            // For new users, include email and password
            email: formData.email,
            name: formData.name,
            password: formData.password,
            role: formData.role,
            is_active: formData.is_active,
          }

      const response = await fetch(
        editingUser ? `${apiUrl}/api/admin/users/${editingUser.id}` : `${apiUrl}/users/register`,
        {
          method: editingUser ? "PUT" : "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || "Failed to save user")
      }

      setSnackbar({
        open: true,
        message: editingUser ? "User updated successfully" : "User created successfully",
        severity: "success",
      })

      handleCloseDialog()
      fetchUsers()
    } catch (err) {
      console.error("Error saving user:", err)
      setSnackbar({
        open: true,
        message: err instanceof Error ? err.message : "Failed to save user",
        severity: "error",
      })
    }
  }

  const handleDelete = async (user: User) => {
    // Determine if this is a hard delete (inactive users) or soft delete (active users)
    const isHardDelete = !user.is_active

    // Different confirmation messages based on delete type
    const confirmMessage = isHardDelete
      ? `Are you sure you want to PERMANENTLY DELETE user ${user.email}?\n\nThis action cannot be undone and will remove all user data from the database.`
      : `Are you sure you want to deactivate user ${user.email}?\n\nThey will be moved to the Inactive Users tab and can be reactivated later.`

    if (!window.confirm(confirmMessage)) {
      return
    }

    try {
      const token = localStorage.getItem("auth_token")
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8000"

      // Add hard_delete query parameter for inactive users
      const url = isHardDelete
        ? `${apiUrl}/api/admin/users/${user.id}?hard_delete=true`
        : `${apiUrl}/api/admin/users/${user.id}`

      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to delete user")
      }

      const successMessage = isHardDelete
        ? "User permanently deleted"
        : "User deactivated successfully"

      setSnackbar({
        open: true,
        message: successMessage,
        severity: "success",
      })

      fetchUsers()
    } catch (err) {
      console.error("Error deleting user:", err)
      setSnackbar({
        open: true,
        message: "Failed to delete user",
        severity: "error",
      })
    }
  }

  // Filter users based on active/inactive tab
  const filteredUsers = useMemo(
    () => users.filter((user) => (activeTab === "active" ? user.is_active : !user.is_active)),
    [users, activeTab]
  )

  // Calculate statistics
  const stats = useMemo(() => {
    const totalUsers = users.filter((u) => u.is_active).length
    const totalStudents = users.filter((u) => u.role === "student" && u.is_active).length
    const totalFaculty = users.filter((u) => u.role === "faculty" && u.is_active).length
    const totalAdmins = users.filter((u) => u.role === "admin" && u.is_active).length
    const inactiveUsers = users.filter((u) => !u.is_active).length

    return {
      totalUsers,
      totalStudents,
      totalFaculty,
      totalAdmins,
      inactiveUsers,
    }
  }, [users])

  const columns = useMemo<MRT_ColumnDef<User>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Name",
        size: 180,
        Cell: ({ row }) => row.original.name || "—",
      },
      {
        accessorKey: "email",
        header: "Email",
        size: 220,
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 100,
        Cell: ({ row }) => <Chip label={row.original.role} color="default" size="small" />,
        filterVariant: "select",
        filterSelectOptions: ["student", "faculty", "admin"],
      },
    ],
    []
  )

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box
      sx={{ height: "100%", display: "flex", flexDirection: "column", gap: 2, overflow: "hidden" }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Left Panel - Statistics */}
        <Grid
          item
          xs={12}
          md={4}
          sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: "white",
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
              <Typography
                variant="overline"
                sx={{
                  color: theme.palette.secondary.main,
                  display: "block",
                  lineHeight: 1.2,
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                  mb: 0.5,
                  fontSize: "0.6875rem",
                  fontWeight: 500,
                }}>
                User Statistics
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}>
                Overview
              </Typography>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            {/* Statistics Cards */}
            <Stack spacing={2}>
              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.05)} 0%, ${alpha(theme.palette.primary.light, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.primary.light, 0.15)}`,
                }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    mb: 0.5,
                  }}>
                  Total Active Users
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.palette.primary.light, fontSize: "2rem" }}>
                  {stats.totalUsers}
                </Typography>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.light, 0.05)} 0%, ${alpha(theme.palette.secondary.light, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.secondary.light, 0.15)}`,
                    textAlign: "center",
                    flex: 1,
                  }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: theme.palette.secondary.light, fontSize: "1.5rem" }}>
                    {stats.totalStudents}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: "0.6875rem" }}>
                    Students
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.secondary.main, 0.05)} 0%, ${alpha(theme.palette.secondary.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.secondary.main, 0.15)}`,
                    textAlign: "center",
                    flex: 1,
                  }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: theme.palette.secondary.main, fontSize: "1.5rem" }}>
                    {stats.totalFaculty}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: "0.6875rem" }}>
                    Faculty
                  </Typography>
                </Box>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.05)} 0%, ${alpha(theme.palette.primary.main, 0.02)} 100%)`,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
                    textAlign: "center",
                    flex: 1,
                  }}>
                  <Typography
                    variant="h5"
                    sx={{ fontWeight: 700, color: theme.palette.primary.main, fontSize: "1.5rem" }}>
                    {stats.totalAdmins}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: theme.palette.text.secondary, fontWeight: 500, fontSize: "0.6875rem" }}>
                    Admins
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  p: 2,
                  borderRadius: 2,
                  background: `linear-gradient(135deg, ${alpha(theme.palette.text.disabled, 0.05)} 0%, ${alpha(theme.palette.text.disabled, 0.02)} 100%)`,
                  border: `1px solid ${alpha(theme.palette.text.disabled, 0.15)}`,
                }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: theme.palette.text.secondary,
                    fontWeight: 500,
                    fontSize: "0.75rem",
                    mb: 0.5,
                  }}>
                  Inactive Users
                </Typography>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 700, color: theme.palette.text.secondary, fontSize: "2rem" }}>
                  {stats.inactiveUsers}
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right Panel - Users Table */}
        <Grid
          item
          xs={12}
          md={8}
          sx={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <Paper
            elevation={0}
            variant="outlined"
            sx={{
              borderRadius: 3,
              border: `1px solid ${theme.palette.divider}`,
              background: "white",
              p: 2.5,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}>
            {/* Header */}
            <Box sx={{ mb: 2.5 }}>
              <FlexBetween>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: theme.palette.secondary.main,
                      display: "block",
                      lineHeight: 1.2,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                      mb: 0.5,
                      fontSize: "0.6875rem",
                      fontWeight: 500,
                    }}>
                    User Management
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: "1.25rem",
                      fontWeight: 600,
                    }}>
                    Manage Users
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={fetchUsers}
                  disabled={loading}
                  sx={{
                    color: theme.palette.secondary.main,
                    "&:hover": {
                      bgcolor: alpha(theme.palette.secondary.main, 0.08),
                    },
                  }}>
                  <RefreshIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </FlexBetween>
            </Box>

            <Divider sx={{ mb: 2 }} />

            {/* Tabs */}
            <Tabs
              value={activeTab}
              onChange={(_, newValue) => setActiveTab(newValue)}
              sx={{
                mb: 2,
                minHeight: 40,
                "& .MuiTab-root": {
                  minHeight: 40,
                  textTransform: "none",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                },
              }}>
              <Tab label="Active Users" value="active" />
              <Tab label="Inactive Users" value="inactive" />
            </Tabs>

            {/* Table Content */}
            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
              <MaterialReactTable
                columns={columns}
                data={filteredUsers}
                state={{
                  isLoading: loading,
                }}
                enableRowActions
                displayColumnDefOptions={{
                  "mrt-row-actions": {
                    header: "Actions",
                    size: 120,
                  },
                }}
                positionActionsColumn="last"
                renderRowActions={({ row }) => (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Edit User">
                      <IconButton size="small" onClick={() => handleOpenDialog(row.original)}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip
                      title={
                        row.original.is_active
                          ? "Deactivate User (move to Inactive)"
                          : "Permanently Delete User"
                      }>
                      <IconButton
                        size="small"
                        onClick={() => handleDelete(row.original)}
                        sx={{ color: theme.palette.primary.main }}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                )}
                muiTablePaperProps={{
                  elevation: 0,
                  sx: {
                    border: "none",
                    boxShadow: "none",
                    bgcolor: "transparent",
                  },
                }}
                muiTableContainerProps={{
                  sx: {
                    minHeight: "400px",
                    border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                    borderRadius: 1.5,
                  },
                }}
                muiTableHeadCellProps={{
                  sx: {
                    fontWeight: 600,
                    color: theme.palette.text.primary,
                    bgcolor: alpha(theme.palette.divider, 0.3),
                    borderBottom: `2px solid ${alpha(theme.palette.primary.light, 0.12)}`,
                    py: 1.5,
                    px: 2,
                    fontSize: "0.875rem",
                  },
                }}
                muiTableBodyRowProps={({ row }) => ({
                  sx: {
                    "&:hover": {
                      backgroundColor: alpha(theme.palette.secondary.main, 0.03),
                    },
                  },
                })}
                muiTableBodyCellProps={{
                  sx: {
                    fontSize: "0.875rem",
                    borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                    py: 1.5,
                    px: 2,
                  },
                }}
                initialState={{
                  density: "comfortable",
                  pagination: { pageSize: 10, pageIndex: 0 },
                }}
                enableTopToolbar={false}
                enableBottomToolbar
                muiBottomToolbarProps={{
                  sx: {
                    border: "none",
                    borderTop: "none !important",
                    boxShadow: "none",
                    bgcolor: "transparent",
                    minHeight: "52px",
                    "& .MuiToolbar-root": {
                      borderTop: "none !important",
                      boxShadow: "none",
                    },
                  },
                }}
                muiTableProps={{
                  sx: {
                    tableLayout: "fixed",
                  },
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Add/Edit User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingUser ? "Edit User" : "Add New User"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                disabled={!!editingUser} // Can't change email for existing users
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </Grid>
            {!editingUser && (
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Role</InputLabel>
                <Select
                  value={formData.role}
                  label="Role"
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}>
                  <MenuItem value="admin">Admin</MenuItem>
                  <MenuItem value="faculty">Faculty</MenuItem>
                  <MenuItem value="student">Student</MenuItem>
                </Select>
              </FormControl>
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
            {/* App assignments removed - using role-based access only */}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.email || (!editingUser && !formData.password)}>
            {editingUser ? "Update" : "Create"}
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
