import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Snackbar,
  Tooltip,
  Grid,
  Stack,
  alpha,
  Divider,
  useTheme,
} from "@mui/material"
import { FlexCenterVertical, FlexRow, FlexColumn, FlexBetween } from "@/components/styled"
import {
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  PersonAdd as PersonAddIcon,
} from "@mui/icons-material"
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_SortingState,
} from "material-react-table"
import {
  createInvitation,
  getInvitations,
  revokeInvitation,
  type Invitation,
  type InvitationWithUrl,
  type InvitationCreate,
} from "@/services/invitationApi"

const spacing = {
  xs: 0.5,
  sm: 1,
  md: 1.5,
  lg: 2,
  xl: 3,
}

export const InviteUsers: React.FC = () => {
  const theme = useTheme()

  // Form state
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"student" | "faculty" | "admin">("student")
  const [expiresInDays, setExpiresInDays] = useState(7)

  // Table state
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(false)
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])

  // Dialog state
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [generatedInvitation, setGeneratedInvitation] = useState<InvitationWithUrl | null>(null)

  // Snackbar state
  const [snackbar, setSnackbar] = useState<{
    open: boolean
    message: string
    severity: "success" | "error" | "info"
  }>({
    open: false,
    message: "",
    severity: "success",
  })

  // Load invitations on mount
  useEffect(() => {
    loadInvitations()
  }, [])

  const loadInvitations = async () => {
    try {
      setLoading(true)
      const data = await getInvitations()
      setInvitations(data)
    } catch (error: any) {
      showSnackbar("Failed to load invitations", "error")
      console.error("Error loading invitations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateInvitation = async () => {
    if (!email) {
      showSnackbar("Please enter an email address", "error")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      showSnackbar("Please enter a valid email address", "error")
      return
    }

    try {
      const invitationData: InvitationCreate = {
        email,
        role,
        expires_in_days: expiresInDays,
      }

      const newInvitation = await createInvitation(invitationData)
      setGeneratedInvitation(newInvitation)
      setShowLinkDialog(true)

      // Reset form
      setEmail("")
      setRole("student")
      setExpiresInDays(7)

      // Reload invitations
      loadInvitations()

      showSnackbar("Invitation created successfully", "success")
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to create invitation"
      showSnackbar(errorMessage, "error")
      console.error("Error creating invitation:", error)
    }
  }

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url)
    showSnackbar("Link copied to clipboard", "success")
  }

  const handleRevoke = async (id: number, email: string) => {
    if (!window.confirm(`Are you sure you want to revoke the invitation for ${email}?`)) {
      return
    }

    try {
      await revokeInvitation(id)
      showSnackbar("Invitation revoked successfully", "success")
      loadInvitations()
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Failed to revoke invitation"
      showSnackbar(errorMessage, "error")
      console.error("Error revoking invitation:", error)
    }
  }

  const showSnackbar = (message: string, severity: "success" | "error" | "info") => {
    setSnackbar({ open: true, message, severity })
  }

  const getStatusInfo = (invitation: Invitation) => {
    const now = new Date()
    const expiresAt = new Date(invitation.expires_at)

    if (invitation.is_used) {
      return { label: "Used", color: "default" as const }
    }
    if (expiresAt < now) {
      return { label: "Expired", color: "default" as const }
    }
    return { label: "Pending", color: "info" as const }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case "admin":
        return "default"
      case "faculty":
        return "default"
      case "student":
        return "default"
      default:
        return "default"
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  const getRegistrationUrl = (invitation: Invitation) => {
    const frontendUrl = window.location.origin
    return `${frontendUrl}/register/${invitation.role}?token=${invitation.token}`
  }

  // Define MRT columns - Actions will be placed after Status via positionActionsColumn
  const columns = useMemo<MRT_ColumnDef<Invitation>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Email",
        size: 200,
      },
      {
        accessorKey: "role",
        header: "Role",
        size: 100,
        Cell: ({ row }) => (
          <Chip
            label={row.original.role}
            color={getRoleColor(row.original.role) as any}
            size="small"
          />
        ),
        filterVariant: "select",
        filterSelectOptions: ["student", "faculty", "admin"],
      },
      {
        id: "status",
        header: "Status",
        size: 100,
        accessorFn: (row) => {
          const statusInfo = getStatusInfo(row)
          return statusInfo.label
        },
        Cell: ({ row }) => {
          const statusInfo = getStatusInfo(row.original)
          return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />
        },
        filterVariant: "select",
        filterSelectOptions: ["Pending", "Used", "Expired"],
      },
      // Actions column will appear here (after Status) via positionActionsColumn={3}
      {
        accessorKey: "created_at",
        header: "Created",
        size: 140,
        Cell: ({ row }) => formatDate(row.original.created_at),
      },
      {
        accessorKey: "expires_at",
        header: "Expires",
        size: 140,
        Cell: ({ row }) => formatDate(row.original.expires_at),
      },
    ],
    []
  )

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: spacing.lg,
        overflow: "hidden",
      }}>
      <Grid container spacing={spacing.lg} sx={{ flexGrow: 1, overflow: "hidden" }}>
        {/* Left Panel - Create Invitation Form */}
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
              background: theme.palette.background.paper,
              p: spacing.lg,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}>
            {/* Header */}
            <Box sx={{ mb: spacing.md }}>
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
                Configuration
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  color: theme.palette.text.primary,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                }}>
                Create Invitation
              </Typography>
            </Box>

            <Divider sx={{ mb: spacing.md }} />

            {/* Form Content */}
            <Box sx={{ flexGrow: 1, overflow: "auto" }}>
              <Stack spacing={spacing.lg}>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontSize: "0.875rem", lineHeight: 1.6 }}>
                  Generate a registration link for new users. The link will be valid for the
                  specified duration and can only be used once.
                </Typography>

                <TextField
                  fullWidth
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="student@arizona.edu"
                  size="small"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": {
                        borderColor: alpha(theme.palette.primary.light, 0.2),
                      },
                      "&:hover fieldset": {
                        borderColor: theme.palette.secondary.main,
                      },
                      "&.Mui-focused fieldset": {
                        borderColor: theme.palette.secondary.main,
                      },
                    },
                  }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={role}
                    label="Role"
                    onChange={(e) => setRole(e.target.value as any)}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: alpha(theme.palette.primary.light, 0.2),
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.secondary.main,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.secondary.main,
                      },
                    }}>
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="faculty">Faculty</MenuItem>
                    <MenuItem value="admin">Admin</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>Expires In</InputLabel>
                  <Select
                    value={expiresInDays}
                    label="Expires In"
                    onChange={(e) => setExpiresInDays(Number(e.target.value))}
                    sx={{
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: alpha(theme.palette.primary.light, 0.2),
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.secondary.main,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.secondary.main,
                      },
                    }}>
                    <MenuItem value={7}>7 days</MenuItem>
                    <MenuItem value={14}>14 days</MenuItem>
                    <MenuItem value={30}>30 days</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleCreateInvitation}
                  disabled={!email}
                  startIcon={<PersonAddIcon />}
                  sx={{
                    bgcolor: theme.palette.primary.main,
                    fontWeight: 600,
                    height: 48,
                    textTransform: "none",
                    fontSize: "1rem",
                    boxShadow: "none",
                    "&:hover": {
                      bgcolor: theme.palette.primary.dark,
                      boxShadow: "none",
                    },
                  }}>
                  Generate Invitation
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Right Panel - Invitations Table */}
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
              background: theme.palette.background.paper,
              p: spacing.lg,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              overflow: "hidden",
            }}>
            {/* Header */}
            <Box sx={{ mb: spacing.md }}>
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
                    Invitations
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.text.primary,
                      fontSize: "1.25rem",
                      fontWeight: 600,
                    }}>
                    Manage Invitations
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={loadInvitations}
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

            <Divider sx={{ mb: spacing.md }} />

            {/* Table Content */}
            <Box sx={{ flexGrow: 1, overflow: "hidden" }}>
              <MaterialReactTable
                columns={columns}
                data={invitations}
                state={{
                  columnFilters,
                  sorting,
                  isLoading: loading,
                }}
                onColumnFiltersChange={setColumnFilters}
                onSortingChange={setSorting}
                enableRowActions
                displayColumnDefOptions={{
                  "mrt-row-actions": {
                    header: "Actions",
                    size: 120,
                  },
                }}
                positionActionsColumn={3}
                renderRowActions={({ row }) => (
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="Copy Link">
                      <IconButton
                        size="small"
                        onClick={() => handleCopyLink(getRegistrationUrl(row.original))}
                        disabled={row.original.is_used}>
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Revoke">
                      <IconButton
                        size="small"
                        onClick={() => handleRevoke(row.original.id, row.original.email)}
                        disabled={row.original.is_used}
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

      {/* Link Dialog */}
      <Dialog
        open={showLinkDialog}
        onClose={() => setShowLinkDialog(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle>Invitation Link Generated</DialogTitle>
        <DialogContent>
          {generatedInvitation && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Invitation created successfully for
                {" "}
                <strong>{generatedInvitation.email}</strong>
              </Alert>
              <Typography variant="body2" gutterBottom>
                Share this link with the user to complete registration:
              </Typography>
              <Paper
                sx={{
                  p: 2,
                  bgcolor: "grey.100",
                  wordBreak: "break-all",
                  fontFamily: "monospace",
                  fontSize: "0.9rem",
                }}>
                {generatedInvitation.registration_url}
              </Paper>
              <Box sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary">
                  Expires:
                  {" "}
                  {formatDate(generatedInvitation.expires_at)}
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLinkDialog(false)}>Close</Button>
          <Button
            variant="contained"
            startIcon={<CopyIcon />}
            onClick={() => {
              if (generatedInvitation) {
                handleCopyLink(generatedInvitation.registration_url)
              }
            }}
            sx={{
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}>
            Copy Link
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}>
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}
