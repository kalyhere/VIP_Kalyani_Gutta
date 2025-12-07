import React, { useState, useEffect, useMemo } from "react"
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  alpha,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Fade,
} from "@mui/material"
import { FlexCenterVertical, FlexRow, FlexColumn, FlexBetween } from "@/components/styled"
import {
  LocalHospital as CaseIcon,
  PlayCircleOutline as LaunchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as VisibilityIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon,
} from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { format, parseISO } from "date-fns"
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_SortingState,
} from "material-react-table"
import { MedicalCase } from "../../types/medical-cases"
import { Link as RouterLink, useNavigate } from "react-router-dom"

interface CaseManagementProps {}

const CaseManagement: React.FC<CaseManagementProps> = () => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [cases, setCases] = useState<MedicalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>("")
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [caseToDelete, setCaseToDelete] = useState<MedicalCase | null>(null)

  // Quick filter states
  const [visibilityFilter, setVisibilityFilter] = useState<string>("all")
  const [creatorFilter, setCreatorFilter] = useState<string>("all")

  const fetchCases = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/medical-cases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch medical cases")
      }

      const data = await response.json()
      setCases(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load medical cases")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  // Apply quick filters to data
  const filteredCases = useMemo(() => {
    let filtered = cases

    if (visibilityFilter !== "all") {
      filtered = filtered.filter((c) => c.is_public === (visibilityFilter === "public"))
    }

    if (creatorFilter !== "all") {
      filtered = filtered.filter((c) => (c.creator?.email || "Unknown") === creatorFilter)
    }

    return filtered
  }, [cases, visibilityFilter, creatorFilter])

  // Get unique creators for filter
  const uniqueCreators = useMemo(() => {
    const creators = [...new Set(cases.map((c) => c.creator?.email || "Unknown").filter(Boolean))]
    return creators.sort()
  }, [cases])

  // Define columns for Material React Table
  const columns = useMemo<MRT_ColumnDef<MedicalCase>[]>(
    () => [
      {
        accessorKey: "title",
        header: "Case Title",
        size: 250,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ color: theme.palette.text.primary }}>
              {row.original.title}
            </Typography>
            {row.original.description && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block", mt: 0.5 }}>
                {row.original.description.length > 80
                  ? `${row.original.description.substring(0, 80)}...`
                  : row.original.description}
              </Typography>
            )}
          </Box>
        ),
      },
      {
        accessorKey: "is_public",
        header: "Visibility",
        size: 120,
        Cell: ({ row }) => (
          <Chip
            icon={
              row.original.is_public ? (
                <PublicIcon sx={{ fontSize: "0.8rem" }} />
              ) : (
                <PrivateIcon sx={{ fontSize: "0.8rem" }} />
              )
            }
            label={row.original.is_public ? "Public" : "Private"}
            size="small"
            variant="outlined"
            sx={{
              borderColor: row.original.is_public ? theme.palette.secondary.light : theme.palette.primary.main,
              color: row.original.is_public ? theme.palette.secondary.light : theme.palette.primary.main,
              bgcolor: alpha(row.original.is_public ? theme.palette.secondary.light : theme.palette.primary.main, 0.08),
              fontSize: "0.7rem",
            }}
          />
        ),
      },
      {
        accessorKey: "creator.email",
        header: "Creator",
        size: 160,
        Cell: ({ row }) => (
          <FlexCenterVertical sx={{ gap: 1 }}>
            <PersonIcon sx={{ fontSize: "1rem", color: theme.palette.secondary.main }} />
            <Typography variant="body2" color="text.secondary">
              {row.original.creator?.email || "Unknown"}
            </Typography>
          </FlexCenterVertical>
        ),
      },
      {
        accessorKey: "created_at",
        header: "Created",
        size: 140,
        Cell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {row.original.created_at
              ? format(parseISO(row.original.created_at), "MMM dd, yyyy")
              : "-"}
          </Typography>
        ),
      },
      {
        accessorKey: "actions",
        header: "Actions",
        size: 140,
        enableSorting: false,
        Cell: ({ row }) => (
          <FlexRow sx={{ gap: 0.5 }}>
            <Tooltip title="View Case">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedCase(row.original)
                  setDialogOpen(true)
                }}
                sx={{
                  color: theme.palette.secondary.main,
                  "&:hover": { bgcolor: alpha(theme.palette.secondary.main, 0.08) },
                }}>
                <VisibilityIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Launch Virtual Patient">
              <IconButton
                size="small"
                onClick={() => navigate(`/virtual-patient?case_id=${row.original.id}`)}
                sx={{
                  color: theme.palette.success.main,
                  "&:hover": { bgcolor: alpha(theme.palette.success.main, 0.08) },
                }}>
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit Case">
              <IconButton
                size="small"
                sx={{
                  color: theme.palette.secondary.light,
                  "&:hover": { bgcolor: alpha(theme.palette.secondary.light, 0.08) },
                }}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete Case">
              <IconButton
                size="small"
                onClick={() => {
                  setCaseToDelete(row.original)
                  setDeleteDialogOpen(true)
                }}
                sx={{
                  color: theme.palette.primary.main,
                  "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.08) },
                }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </FlexRow>
        ),
      },
    ],
    [navigate, theme]
  )

  const handleDeleteCase = async () => {
    if (!caseToDelete) return

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/medical-cases/${caseToDelete.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        }
      )

      if (!response.ok) {
        throw new Error("Failed to delete case")
      }

      setCases((prev) => prev.filter((c) => c.id !== caseToDelete.id))
      setDeleteDialogOpen(false)
      setCaseToDelete(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete case")
    }
  }

  const clearAllFilters = () => {
    setVisibilityFilter("all")
    setCreatorFilter("all")
    setGlobalFilter("")
    setColumnFilters([])
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
        <CircularProgress sx={{ color: theme.palette.secondary.main }} />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Enhanced Header with Class Status Overview */}
      <Box sx={{ py: 1, px: 1.5, mb: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Box>
            <Typography
              variant="overline"
              sx={{ color: theme.palette.primary.light, display: "block", lineHeight: 1.2 }}>
              Medical Cases
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "medium", color: theme.palette.text.primary }}>
              Case Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Manage medical cases for virtual patient simulations
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            component={RouterLink}
            to="/mcc"
            sx={{
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
              fontSize: "0.8rem",
              py: 0.75,
            }}>
            Create New Case
          </Button>
        </Box>

        {/* Quick Stats Row */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
            gap: 1.5,
            mb: 1.5,
            p: 1.5,
            bgcolor: alpha(theme.palette.divider, 0.3),
            borderRadius: 1.5,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
          }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Cases
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.secondary.main, fontWeight: "bold", lineHeight: 1.2 }}>
              {cases.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Public Cases
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.secondary.light, fontWeight: "bold", lineHeight: 1.2 }}>
              {cases.filter((c) => c.is_public).length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Private Cases
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.primary.main, fontWeight: "bold", lineHeight: 1.2 }}>
              {cases.filter((c) => !c.is_public).length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Creators
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: theme.palette.text.primary, fontWeight: "bold", lineHeight: 1.2 }}>
              {uniqueCreators.length}
            </Typography>
          </Box>
        </Box>

        {/* Quick Filters */}
        <FlexCenterVertical sx={{ gap: 2, flexWrap: "wrap" }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibilityFilter}
              label="Visibility"
              onChange={(e) => setVisibilityFilter(e.target.value)}>
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="public">Public</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>

          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Creator</InputLabel>
            <Select
              value={creatorFilter}
              label="Creator"
              onChange={(e) => setCreatorFilter(e.target.value)}>
              <MenuItem value="all">All Creators</MenuItem>
              {uniqueCreators.map((creator) => (
                <MenuItem key={creator} value={creator}>
                  {creator}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {(visibilityFilter !== "all" || creatorFilter !== "all" || globalFilter !== "") && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              sx={{ color: theme.palette.secondary.main }}>
              Clear Filters
            </Button>
          )}
        </FlexCenterVertical>
      </Box>

      {/* Cases Data Grid */}
      <Box sx={{ flexGrow: 1 }}>
        <MaterialReactTable
          columns={columns}
          data={filteredCases}
          state={{
            columnFilters,
            sorting,
            globalFilter,
          }}
          onColumnFiltersChange={setColumnFilters}
          onSortingChange={setSorting}
          onGlobalFilterChange={setGlobalFilter}
          enableRowSelection={false}
          enableColumnActions={false}
          enableTopToolbar
          enableBottomToolbar
          enablePagination
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableFilters
          enableGlobalFilter
          enableColumnFilterModes={false}
          initialState={{
            density: "comfortable",
            sorting: [{ id: "created_at", desc: true }],
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          muiTableContainerProps={{
            sx: {},
          }}
          muiTableProps={{
            sx: {
              "& .MuiTableHead-root": {
                "& .MuiTableCell-head": {
                  backgroundColor: alpha(theme.palette.primary.light, 0.05),
                  borderBottom: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                  color: theme.palette.text.primary,
                  fontWeight: 600,
                  fontSize: "0.875rem",
                },
              },
              "& .MuiTableBody-root": {
                "& .MuiTableRow-root": {
                  backgroundColor: "white",
                  "&:hover": {
                    backgroundColor: `${alpha(theme.palette.primary.light, 0.02)} !important`,
                  },
                },
                "& .MuiTableCell-body": {
                  borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
                  fontSize: "0.875rem",
                },
              },
            },
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              border: `1px solid ${alpha(theme.palette.primary.light, 0.12)}`,
              borderRadius: 2,
              overflow: "hidden",
              boxShadow: `0 4px 12px ${alpha(theme.palette.primary.light, 0.08)}`,
            },
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: alpha(theme.palette.divider, 0.3),
              borderBottom: `1px solid ${alpha(theme.palette.primary.light, 0.1)}`,
              minHeight: "64px !important",
            },
          }}
          renderTopToolbarCustomActions={() => (
            <FlexCenterVertical sx={{ gap: 2, p: 1 }}>
              <CaseIcon sx={{ color: theme.palette.secondary.main, fontSize: "1.2rem" }} />
              <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                {filteredCases.length} Case
                {filteredCases.length !== 1 ? "s" : ""}
              </Typography>
              <Box sx={{ ml: "auto", display: "flex", gap: 1 }}>
                <Chip
                  label={`${filteredCases.filter((c) => c.is_public).length} Public`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.secondary.light, 0.1),
                    color: theme.palette.secondary.light,
                    fontSize: "0.7rem",
                  }}
                />
                <Chip
                  label={`${filteredCases.filter((c) => !c.is_public).length} Private`}
                  size="small"
                  sx={{
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    color: theme.palette.primary.main,
                    fontSize: "0.7rem",
                  }}
                />
              </Box>
            </FlexCenterVertical>
          )}
        />
      </Box>

      {/* Case Detail Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            {selectedCase?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedCase && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Typography variant="body1">{selectedCase.description}</Typography>
              <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                <Chip
                  icon={selectedCase.is_public ? <PublicIcon /> : <PrivateIcon />}
                  label={selectedCase.is_public ? "Public" : "Private"}
                  color={selectedCase.is_public ? "success" : "error"}
                  variant="outlined"
                />
                <Chip
                  icon={<PersonIcon />}
                  label={selectedCase.creator?.email || "Unknown Creator"}
                  variant="outlined"
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          {selectedCase && (
            <Button
              variant="contained"
              color="success"
              onClick={() => navigate(`/virtual-patient?case_id=${selectedCase.id}`)}
              sx={{
                mr: "auto",
              }}>
              Launch Virtual Patient
            </Button>
          )}
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="sm"
        fullWidth>
        <DialogTitle sx={{ color: theme.palette.primary.main }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the case "{caseToDelete?.title}
            "? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleDeleteCase}
            variant="contained"
            sx={{
              bgcolor: theme.palette.primary.main,
              "&:hover": { bgcolor: theme.palette.primary.dark },
            }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export { CaseManagement }
