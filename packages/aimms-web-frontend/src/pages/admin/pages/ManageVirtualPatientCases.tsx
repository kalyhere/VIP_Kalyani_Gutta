import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Paper,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  alpha,
  Tooltip,
  Stack,
  MenuItem,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material'
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as LaunchIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
  FileUpload as ImportIcon,
  Public as PublicIcon,
  Lock as PrivateIcon,
  Person as PersonIcon,
  Clear as ClearIcon,
  LocalHospital as CaseIcon,
} from '@mui/icons-material'
import {
  MaterialReactTable,
  MRT_ColumnDef,
  MRT_ColumnFiltersState,
  MRT_SortingState,
} from 'material-react-table'
import { format, parseISO } from 'date-fns'
import { useNotify } from '../../contexts/NotificationContext'
import axios from 'axios'

const uaColors = {
  arizonaRed: '#AB0520',
  arizonaBlue: '#0C234B',
  azurite: '#1E5288',
  oasis: '#378DBD',
  sage: '#1B5E20',
  warm: '#F57C00',
  midnight: '#001C48',
  chili: '#8B0015',
  coolGray: '#EFF1F3',
  warmGray: '#F7F8F9',
  slate: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#A3A3A3',
    500: '#737373',
    600: '#4B4B4B',
    700: '#374151',
  },
}

interface MedicalCase {
  id: number
  title: string
  description: string
  learning_objectives: string[]
  content: any
  is_public: boolean
  is_active: boolean
  created_at: string
  updated_at: string
  created_by: number
}

interface CaseFormData {
  title: string
  description: string
  learning_objectives: string
  content: string
  is_public: boolean
}

export const ManageVirtualPatientCases: React.FC = () => {
  const notify = useNotify()
  const [cases, setCases] = useState<MedicalCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [viewDialogOpen, setViewDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null)
  const [formData, setFormData] = useState<CaseFormData>({
    title: '',
    description: '',
    learning_objectives: '',
    content: '',
    is_public: false,
  })

  // MaterialReactTable states
  const [columnFilters, setColumnFilters] = useState<MRT_ColumnFiltersState>([])
  const [sorting, setSorting] = useState<MRT_SortingState>([])
  const [globalFilter, setGlobalFilter] = useState<string>('')

  // Quick filter states
  const [visibilityFilter, setVisibilityFilter] = useState<string>('all')
  const [creatorFilter, setCreatorFilter] = useState<string>('all')

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  const fetchCases = async () => {
    setLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem('auth_token')
      const response = await axios.get(`${apiUrl}/medical-cases/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      setCases(response.data)
    } catch (err: any) {
      console.error('Error fetching cases:', err)
      setError(err.response?.data?.detail || 'Failed to fetch cases')
      notify('Failed to fetch cases', { type: 'error' })
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

    if (visibilityFilter !== 'all') {
      filtered = filtered.filter(c => c.is_public === (visibilityFilter === 'public'))
    }

    if (creatorFilter !== 'all') {
      filtered = filtered.filter(c => String(c.created_by) === creatorFilter)
    }

    return filtered
  }, [cases, visibilityFilter, creatorFilter])

  // Get unique creators for filter
  const uniqueCreators = useMemo(() => {
    const creators = [...new Set(cases.map(c => String(c.created_by)).filter(Boolean))]
    return creators.sort()
  }, [cases])

  // Define columns for Material React Table
  const columns = useMemo<MRT_ColumnDef<MedicalCase>[]>(
    () => [
      {
        accessorKey: 'title',
        header: 'Case Title',
        size: 250,
        Cell: ({ row }) => (
          <Box>
            <Typography variant="body2" fontWeight="medium" sx={{ color: uaColors.midnight }}>
              {row.original.title}
            </Typography>
            {row.original.description && (
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                {row.original.description.length > 80
                  ? `${row.original.description.substring(0, 80)}...`
                  : row.original.description
                }
              </Typography>
            )}
          </Box>
        ),
      },
      {
        accessorKey: 'is_public',
        header: 'Visibility',
        size: 120,
        Cell: ({ row }) => (
          <Chip
            icon={row.original.is_public ? <PublicIcon sx={{ fontSize: '0.8rem' }} /> : <PrivateIcon sx={{ fontSize: '0.8rem' }} />}
            label={row.original.is_public ? 'Public' : 'Private'}
            size="small"
            variant="outlined"
            sx={{
              borderColor: row.original.is_public ? uaColors.oasis : uaColors.arizonaRed,
              color: row.original.is_public ? uaColors.oasis : uaColors.arizonaRed,
              bgcolor: alpha(row.original.is_public ? uaColors.oasis : uaColors.arizonaRed, 0.08),
              fontSize: '0.7rem',
            }}
          />
        ),
      },
      {
        accessorKey: 'is_active',
        header: 'Status',
        size: 100,
        Cell: ({ row }) => (
          <Chip
            label={row.original.is_active ? 'Active' : 'Inactive'}
            size="small"
            sx={{
              backgroundColor: alpha(row.original.is_active ? uaColors.sage : uaColors.slate[400], 0.1),
              color: row.original.is_active ? uaColors.sage : uaColors.slate[500],
              fontWeight: 500,
              fontSize: '0.7rem',
            }}
          />
        ),
      },
      {
        accessorKey: 'created_at',
        header: 'Created',
        size: 140,
        Cell: ({ row }) => (
          <Typography variant="body2" color="text.secondary">
            {row.original.created_at ? format(parseISO(row.original.created_at), 'MMM dd, yyyy') : '-'}
          </Typography>
        ),
      },
      {
        accessorKey: 'actions',
        header: 'Actions',
        size: 180,
        enableSorting: false,
        Cell: ({ row }) => (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="View Details">
              <IconButton
                size="small"
                onClick={() => handleViewCase(row.original)}
                sx={{
                  color: uaColors.azurite,
                  '&:hover': { bgcolor: alpha(uaColors.azurite, 0.08) }
                }}
              >
                <ViewIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Launch Virtual Patient">
              <IconButton
                size="small"
                onClick={() => handleLaunchVirtualPatient(row.original)}
                sx={{
                  color: uaColors.oasis,
                  '&:hover': { bgcolor: alpha(uaColors.oasis, 0.08) }
                }}
              >
                <LaunchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton
                size="small"
                onClick={() => handleOpenDialog(row.original)}
                sx={{
                  color: uaColors.warm,
                  '&:hover': { bgcolor: alpha(uaColors.warm, 0.08) }
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton
                size="small"
                onClick={() => {
                  setSelectedCase(row.original)
                  setDeleteDialogOpen(true)
                }}
                sx={{
                  color: uaColors.arizonaRed,
                  '&:hover': { bgcolor: alpha(uaColors.arizonaRed, 0.08) }
                }}
              >
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ),
      },
    ],
    []
  )

  const clearAllFilters = () => {
    setVisibilityFilter('all')
    setCreatorFilter('all')
    setGlobalFilter('')
    setColumnFilters([])
  }

  const handleOpenDialog = (caseData?: MedicalCase) => {
    if (caseData) {
      setEditMode(true)
      setSelectedCase(caseData)
      setFormData({
        title: caseData.title,
        description: caseData.description,
        learning_objectives: caseData.learning_objectives.join('\n'),
        content: JSON.stringify(caseData.content, null, 2),
        is_public: caseData.is_public,
      })
    } else {
      setEditMode(false)
      setSelectedCase(null)
      setFormData({
        title: '',
        description: '',
        learning_objectives: '',
        content: '',
        is_public: false,
      })
    }
    setDialogOpen(true)
  }

  const handleImportSampleCase = async () => {
    try {
      // Load sample case from virtual patient backend
      const vpBackendUrl = import.meta.env.VITE_VIRTUAL_PATIENT_BACKEND_URL || 'http://localhost:3001'
      const response = await axios.get(`${vpBackendUrl}/api/sample-case`)
      
      const sampleCase = response.data
      
      setEditMode(false)
      setSelectedCase(null)
      setFormData({
        title: sampleCase.name || 'Sample Medical Case',
        description: sampleCase.sections?.[0]?.tables?.[0]?.rows?.[1]?.cells?.[1]?.content || 'Imported sample case',
        learning_objectives: sampleCase.sections?.[0]?.tables?.[1]?.rows?.map((row: any) => row.cells?.[1]?.content).filter(Boolean).join('\n') || '',
        content: JSON.stringify(sampleCase, null, 2),
        is_public: false,
      })
      setDialogOpen(true)
      notify('Sample case loaded successfully', { type: 'success' })
    } catch (err: any) {
      console.error('Error loading sample case:', err)
      notify('Could not load sample case. You can paste your own case JSON.', { type: 'warning' })
      // Open dialog anyway so user can create manually
      handleOpenDialog()
    }
  }

  const handleCloseDialog = () => {
    setDialogOpen(false)
    setEditMode(false)
    setSelectedCase(null)
  }

  const handleSaveCase = async () => {
    try {
      // Validate JSON content
      let contentObj
      try {
        contentObj = formData.content ? JSON.parse(formData.content) : {}
      } catch (e) {
        notify('Invalid JSON in content field', { type: 'error' })
        return
      }

      const learningObjectives = formData.learning_objectives
        .split('\n')
        .map(obj => obj.trim())
        .filter(obj => obj.length > 0)

      const payload = {
        title: formData.title,
        description: formData.description,
        learning_objectives: learningObjectives,
        content: contentObj,
        is_public: formData.is_public,
      }

      const token = localStorage.getItem('auth_token')
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }

      if (editMode && selectedCase) {
        await axios.put(`${apiUrl}/medical-cases/${selectedCase.id}`, payload, config)
        notify('Case updated successfully', { type: 'success' })
      } else {
        await axios.post(`${apiUrl}/medical-cases/`, payload, config)
        notify('Case created successfully', { type: 'success' })
      }

      handleCloseDialog()
      fetchCases()
    } catch (err: any) {
      console.error('Error saving case:', err)
      notify(err.response?.data?.detail || 'Failed to save case', { type: 'error' })
    }
  }

  const handleDeleteCase = async () => {
    if (!selectedCase) return

    try {
      const token = localStorage.getItem('auth_token')
      await axios.delete(`${apiUrl}/medical-cases/${selectedCase.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      notify('Case deleted successfully', { type: 'success' })
      setDeleteDialogOpen(false)
      setSelectedCase(null)
      fetchCases()
    } catch (err: any) {
      console.error('Error deleting case:', err)
      notify(err.response?.data?.detail || 'Failed to delete case', { type: 'error' })
    }
  }

  const handleViewCase = (caseData: MedicalCase) => {
    setSelectedCase(caseData)
    setViewDialogOpen(true)
  }

  const handleLaunchVirtualPatient = async (caseData: MedicalCase) => {
    try {
      // For admin, we'll launch the virtual patient directly without an assignment
      // This is for testing/demo purposes
      const vpBackendUrl = import.meta.env.VITE_VIRTUAL_PATIENT_BACKEND_URL || 'http://localhost:3001'
      const vpFrontendUrl = import.meta.env.VITE_VIRTUAL_PATIENT_FRONTEND_URL || 'http://localhost:5174'
      
      // Open virtual patient in a new window for admin testing
      const launchUrl = `${vpFrontendUrl}?caseId=${caseData.id}&demo=true`
      window.open(launchUrl, '_blank')
      
      notify('Launching Virtual Patient in demo mode', { type: 'info' })
    } catch (err: any) {
      console.error('Error launching virtual patient:', err)
      notify('Failed to launch virtual patient', { type: 'error' })
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress sx={{ color: uaColors.azurite }} />
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
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Enhanced Header with Case Overview */}
      <Box sx={{ py: 1, px: 1.5, mb: 1.5, flexShrink: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box>
            <Typography variant="overline" sx={{ color: uaColors.arizonaBlue, display: "block", lineHeight: 1.2 }}>
              Virtual Patient
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: "medium", color: uaColors.midnight }}>
              Case Management
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Create and manage medical cases for virtual patient simulations
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchCases} sx={{ color: uaColors.azurite }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<ImportIcon />}
              onClick={handleImportSampleCase}
              sx={{
                borderColor: uaColors.oasis,
                color: uaColors.oasis,
                '&:hover': {
                  borderColor: uaColors.azurite,
                  backgroundColor: alpha(uaColors.oasis, 0.05),
                },
                fontSize: '0.8rem',
                py: 0.75
              }}
            >
              Import Sample
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenDialog()}
              sx={{
                bgcolor: uaColors.arizonaRed,
                '&:hover': { bgcolor: uaColors.chili },
                fontSize: '0.8rem',
                py: 0.75
              }}
            >
              Create New Case
            </Button>
          </Box>
        </Box>

        {/* Quick Stats Row */}
        <Box sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
          gap: 1.5,
          mb: 1.5,
          p: 1.5,
          bgcolor: alpha(uaColors.coolGray, 0.3),
          borderRadius: 1.5,
          border: `1px solid ${alpha(uaColors.arizonaBlue, 0.1)}`
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Total Cases
            </Typography>
            <Typography variant="h6" sx={{ color: uaColors.azurite, fontWeight: 'bold', lineHeight: 1.2 }}>
              {cases.length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Public Cases
            </Typography>
            <Typography variant="h6" sx={{ color: uaColors.oasis, fontWeight: 'bold', lineHeight: 1.2 }}>
              {cases.filter(c => c.is_public).length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Private Cases
            </Typography>
            <Typography variant="h6" sx={{ color: uaColors.arizonaRed, fontWeight: 'bold', lineHeight: 1.2 }}>
              {cases.filter(c => !c.is_public).length}
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Active Cases
            </Typography>
            <Typography variant="h6" sx={{ color: uaColors.sage, fontWeight: 'bold', lineHeight: 1.2 }}>
              {cases.filter(c => c.is_active).length}
            </Typography>
          </Box>
        </Box>

        {/* Quick Filters */}
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Visibility</InputLabel>
            <Select
              value={visibilityFilter}
              label="Visibility"
              onChange={(e) => setVisibilityFilter(e.target.value)}
            >
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
              onChange={(e) => setCreatorFilter(e.target.value)}
            >
              <MenuItem value="all">All Creators</MenuItem>
              {uniqueCreators.map(creator => (
                <MenuItem key={creator} value={creator}>User {creator}</MenuItem>
              ))}
            </Select>
          </FormControl>

          {(visibilityFilter !== 'all' || creatorFilter !== 'all' || globalFilter !== '') && (
            <Button
              size="small"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
              sx={{ color: uaColors.azurite }}
            >
              Clear Filters
            </Button>
          )}
        </Box>
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
          enableTopToolbar={true}
          enableBottomToolbar={true}
          enablePagination={true}
          enableDensityToggle={false}
          enableFullScreenToggle={false}
          enableFilters={true}
          enableGlobalFilter={true}
          enableColumnFilterModes={false}
          initialState={{
            density: 'comfortable',
            sorting: [{ id: 'created_at', desc: true }],
            pagination: { pageIndex: 0, pageSize: 10 },
          }}
          muiTableContainerProps={{
            sx: {
              maxHeight: 'calc(100vh - 400px)',
            }
          }}
          muiTableProps={{
            sx: {
              '& .MuiTableHead-root': {
                '& .MuiTableCell-head': {
                  backgroundColor: alpha(uaColors.arizonaBlue, 0.05),
                  borderBottom: `2px solid ${alpha(uaColors.arizonaBlue, 0.1)}`,
                  color: uaColors.midnight,
                  fontWeight: 600,
                  fontSize: '0.875rem',
                },
              },
              '& .MuiTableBody-root': {
                '& .MuiTableRow-root': {
                  backgroundColor: 'white',
                  '&:hover': {
                    backgroundColor: `${alpha(uaColors.arizonaBlue, 0.02)} !important`,
                  },
                },
                '& .MuiTableCell-body': {
                  borderBottom: `1px solid ${alpha(uaColors.arizonaBlue, 0.08)}`,
                  fontSize: '0.875rem',
                },
              },
            },
          }}
          muiTablePaperProps={{
            elevation: 0,
            sx: {
              border: `1px solid ${alpha(uaColors.arizonaBlue, 0.12)}`,
              borderRadius: 2,
              overflow: 'hidden',
              boxShadow: `0 4px 12px ${alpha(uaColors.arizonaBlue, 0.08)}`,
            }
          }}
          muiTopToolbarProps={{
            sx: {
              backgroundColor: alpha(uaColors.warmGray, 0.3),
              borderBottom: `1px solid ${alpha(uaColors.arizonaBlue, 0.1)}`,
              minHeight: '64px !important',
            }
          }}
          renderTopToolbarCustomActions={() => (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1 }}>
              <CaseIcon sx={{ color: uaColors.azurite, fontSize: '1.2rem' }} />
              <Typography variant="h6" sx={{ color: uaColors.midnight, fontWeight: 600 }}>
                {filteredCases.length} Case{filteredCases.length !== 1 ? 's' : ''}
              </Typography>
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1 }}>
                <Chip
                  label={`${filteredCases.filter(c => c.is_public).length} Public`}
                  size="small"
                  sx={{
                    bgcolor: alpha(uaColors.oasis, 0.1),
                    color: uaColors.oasis,
                    fontSize: '0.7rem',
                  }}
                />
                <Chip
                  label={`${filteredCases.filter(c => !c.is_public).length} Private`}
                  size="small"
                  sx={{
                    bgcolor: alpha(uaColors.arizonaRed, 0.1),
                    color: uaColors.arizonaRed,
                    fontSize: '0.7rem',
                  }}
                />
              </Box>
            </Box>
          )}
        />
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle sx={{ backgroundColor: uaColors.slate[50] }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: uaColors.arizonaBlue }}>
            {editMode ? 'Edit Case' : 'Create New Case'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          <Stack spacing={2}>
            <TextField
              label="Title"
              fullWidth
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
            />
            <TextField
              label="Description"
              fullWidth
              required
              multiline
              rows={3}
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
            />
            <TextField
              label="Learning Objectives (one per line)"
              fullWidth
              multiline
              rows={4}
              value={formData.learning_objectives}
              onChange={e => setFormData({ ...formData, learning_objectives: e.target.value })}
              helperText="Enter each learning objective on a new line"
            />
            <TextField
              label="Case Content (JSON)"
              fullWidth
              required
              multiline
              rows={10}
              value={formData.content}
              onChange={e => setFormData({ ...formData, content: e.target.value })}
              helperText="Enter the case content as valid JSON"
              sx={{
                '& textarea': {
                  fontFamily: 'monospace',
                  fontSize: '0.875rem',
                },
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={formData.is_public}
                  onChange={e => setFormData({ ...formData, is_public: e.target.checked })}
                />
              }
              label="Make this case public"
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, backgroundColor: uaColors.slate[50] }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCase}
            disabled={!formData.title || !formData.description}
            sx={{
              backgroundColor: uaColors.arizonaRed,
              '&:hover': {
                backgroundColor: uaColors.arizonaBlue,
              },
            }}
          >
            {editMode ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onClose={() => setViewDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" sx={{ color: uaColors.midnight }}>
            {selectedCase?.title}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {selectedCase && (
            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Description
                </Typography>
                <Typography variant="body1">{selectedCase.description}</Typography>
              </Box>
              {selectedCase.learning_objectives.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Learning Objectives
                  </Typography>
                  <ul>
                    {selectedCase.learning_objectives.map((obj, idx) => (
                      <li key={idx}>
                        <Typography variant="body2">{obj}</Typography>
                      </li>
                    ))}
                  </ul>
                </Box>
              )}
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Status
                </Typography>
                <Stack direction="row" spacing={1}>
                  <Chip
                    icon={selectedCase.is_public ? <PublicIcon /> : <PrivateIcon />}
                    label={selectedCase.is_public ? 'Public' : 'Private'}
                    variant="outlined"
                    sx={{
                      borderColor: selectedCase.is_public ? uaColors.oasis : uaColors.arizonaRed,
                      color: selectedCase.is_public ? uaColors.oasis : uaColors.arizonaRed,
                      bgcolor: alpha(selectedCase.is_public ? uaColors.oasis : uaColors.arizonaRed, 0.08),
                    }}
                  />
                  {selectedCase.is_active && (
                    <Chip
                      label="Active"
                      variant="outlined"
                      sx={{
                        backgroundColor: alpha(uaColors.sage, 0.1),
                        color: uaColors.sage,
                        borderColor: uaColors.sage,
                      }}
                    />
                  )}
                </Stack>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Case Content (JSON)
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 2,
                    backgroundColor: uaColors.slate[50],
                    maxHeight: 300,
                    overflow: 'auto',
                  }}
                >
                  <pre style={{ margin: 0, fontSize: '0.75rem', fontFamily: 'monospace' }}>
                    {JSON.stringify(selectedCase.content, null, 2)}
                  </pre>
                </Paper>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Metadata
                </Typography>
                <Typography variant="body2">Created: {new Date(selectedCase.created_at).toLocaleString()}</Typography>
                <Typography variant="body2">Updated: {new Date(selectedCase.updated_at).toLocaleString()}</Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: uaColors.arizonaRed }}>
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the case "{selectedCase?.title}"? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleDeleteCase}
            sx={{
              bgcolor: uaColors.arizonaRed,
              '&:hover': { bgcolor: uaColors.chili }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}

export default ManageVirtualPatientCases

