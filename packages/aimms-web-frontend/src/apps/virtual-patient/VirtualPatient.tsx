import { useState, useEffect, useMemo, useCallback } from "react"
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Grid,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Chip,
  Stack,
  Divider,
  alpha,
} from "@mui/material"
import { useLocation, useNavigate } from "react-router-dom"
import { useNotificationStore } from "../../stores/notificationStore"
import { MedicalCase } from "../../types/medical-cases"

export default function VirtualPatient() {
  const notify = useNotificationStore((state) => state.notify)
  const location = useLocation()
  const navigate = useNavigate()

  const [caseList, setCaseList] = useState<MedicalCase[]>([])
  const [caseListLoading, setCaseListLoading] = useState(true)
  const [caseListError, setCaseListError] = useState<string | null>(null)

  const [selectedCase, setSelectedCase] = useState<MedicalCase | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const searchParams = new URLSearchParams(location.search)
  const rawCaseId = searchParams.get("case_id")

  const numericCaseId = useMemo(() => {
    if (!rawCaseId) return null
    const parsed = Number(rawCaseId)
    return Number.isFinite(parsed) ? parsed : null
  }, [rawCaseId])

  const casesApiBase = useMemo(() => {
    const aimmsApi = import.meta.env.VITE_API_URL
    const virtualApi = import.meta.env.VITE_VIRTUAL_PATIENT_API_URL
    return aimmsApi ?? virtualApi ?? "http://localhost:8000"
  }, [])

  const fetchCaseList = useCallback(async () => {
    try {
      setCaseListLoading(true)
      setCaseListError(null)

      const response = await fetch(`${casesApiBase}/medical-cases`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      })

      if (!response.ok) {
        throw new Error("Failed to fetch medical cases")
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setCaseList(data)
      } else if (Array.isArray(data?.items)) {
        setCaseList(data.items)
      } else {
        setCaseList([])
      }
    } catch (error) {
      console.error("Error fetching medical cases:", error)
      setCaseListError("Unable to load medical cases")
    } finally {
      setCaseListLoading(false)
    }
  }, [casesApiBase])

  const loadCaseById = useCallback(
    async (id: number) => {
      try {
        setDetailLoading(true)
        setDetailError(null)

        const response = await fetch(`${casesApiBase}/medical-cases/${id}`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
          },
        })

        if (!response.ok) {
          throw new Error("Failed to fetch medical case")
        }

        const data = (await response.json()) as MedicalCase
        setSelectedCase(data)
        setCaseList((prev) => {
          if (prev.some((medicalCase) => medicalCase.id === data.id)) {
            return prev.map((medicalCase) => (medicalCase.id === data.id ? data : medicalCase))
          }
          return [...prev, data]
        })
      } catch (error) {
        console.error("Error loading medical case:", error)
        setDetailError("Unable to load the selected medical case")
      } finally {
        setDetailLoading(false)
      }
    },
    [casesApiBase]
  )

  useEffect(() => {
    fetchCaseList()
  }, [fetchCaseList])

  useEffect(() => {
    if (!numericCaseId) {
      setSelectedCase(null)
      setDetailError(null)
      setDetailLoading(false)
      return
    }

    const matchingCase = caseList.find((medicalCase) => medicalCase.id === numericCaseId)

    if (matchingCase) {
      setSelectedCase(matchingCase)
      setDetailError(null)
      setDetailLoading(false)
    } else {
      loadCaseById(numericCaseId)
    }
  }, [numericCaseId, caseList, loadCaseById])

  const handleSelectCase = (medicalCase: MedicalCase) => {
    setSelectedCase(medicalCase)
    setDetailError(null)

    const params = new URLSearchParams(location.search)
    params.set("case_id", String(medicalCase.id))

    navigate(`${location.pathname}?${params.toString()}`, { replace: true })
  }

  const handleClearSelection = () => {
    setSelectedCase(null)
    setDetailError(null)

    const params = new URLSearchParams(location.search)
    params.delete("case_id")

    const search = params.toString()
    navigate(`${location.pathname}${search ? `?${search}` : ""}`, { replace: true })
  }

  const handleStartVirtualPatient = async () => {
    if (!selectedCase) {
      notify("Please select a medical case to continue", { type: "warning" })
      return
    }

    try {
      // Placeholder for virtual patient session initialization
      console.log("Starting virtual patient with case:", selectedCase)
      notify(`Virtual patient session started for "${selectedCase.title}"`, { type: "success" })
    } catch (error) {
      console.error("Error starting virtual patient:", error)
      notify("Failed to start virtual patient session", { type: "error" })
    }
  }

  const renderCaseList = () => {
    if (caseListLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress size={28} />
        </Box>
      )
    }

    if (caseListError) {
      return (
        <Alert severity="error" sx={{ mx: 2 }}>
          {caseListError}
        </Alert>
      )
    }

    if (caseList.length === 0) {
      return (
        <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 3 }}>
          No medical cases available. Create one in the Medical Case Creator.
        </Typography>
      )
    }

    return (
      <List disablePadding>
        {caseList.map((medicalCase) => {
          const isSelected = selectedCase?.id === medicalCase.id

          return (
            <ListItemButton
              key={medicalCase.id}
              selected={isSelected}
              onClick={() => handleSelectCase(medicalCase)}
              sx={{
                borderRadius: 2,
                mb: 1,
                mx: 1,
                border: "1px solid transparent",
                transition: "all 0.2s ease",
                "&:hover": {
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  borderColor: (theme) => alpha(theme.palette.primary.main, 0.4),
                  transform: "translateY(-2px)",
                  boxShadow: (theme) => `0 6px 16px ${alpha(theme.palette.primary.main, 0.15)}`,
                },
                "&.Mui-selected": {
                  backgroundColor: (theme) => theme.palette.action.selected,
                  borderColor: (theme) => theme.palette.primary.main,
                  "&:hover": {
                    backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    borderColor: (theme) => theme.palette.primary.dark,
                    boxShadow: (theme) => `0 8px 20px ${alpha(theme.palette.primary.main, 0.25)}`,
                  },
                },
              }}>
              <ListItemText
                primary={
                  <Typography sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
                    {medicalCase.title}
                  </Typography>
                }
                secondary={
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.75 }}>
                    {medicalCase.difficulty && (
                      <Chip
                        size="small"
                        label={medicalCase.difficulty}
                        color="primary"
                        variant="outlined"
                      />
                    )}
                    {medicalCase.duration !== undefined && medicalCase.duration !== null && (
                      <Chip
                        size="small"
                        label={`${medicalCase.duration} min`}
                        variant="outlined"
                      />
                    )}
                    <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                      {medicalCase.is_public ? "Public" : "Private"}
                    </Typography>
                  </Stack>
                }
              />
            </ListItemButton>
          )
        })}
      </List>
    )
  }

  const renderCaseDetails = () => {
    if (detailLoading) {
      return (
        <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
          <CircularProgress />
        </Box>
      )
    }

    if (detailError) {
      return (
        <Alert severity="error" sx={{ mb: 3 }}>
          {detailError}
        </Alert>
      )
    }

    if (!selectedCase) {
      return (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Select a medical case
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a case from the list to review its details and start a virtual patient session.
          </Typography>
        </Box>
      )
    }

    return (
      <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
        <Box sx={{ mb: 3 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              {selectedCase.title}
            </Typography>
            <Chip
              label={selectedCase.is_public ? "Public" : "Private"}
              color={selectedCase.is_public ? "success" : "default"}
              variant="outlined"
              size="small"
            />
          </Stack>

          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Description
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: "100%",
                  backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.02),
                }}>
                <Typography color="text.secondary">
                  {selectedCase.description || "No description provided."}
                </Typography>
              </Paper>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
                Learning Objectives
              </Typography>
              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  borderRadius: 2,
                  height: "100%",
                  backgroundColor: (theme) => alpha(theme.palette.secondary.main, 0.02),
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}>
                {selectedCase.learning_objectives?.length ? (
                  selectedCase.learning_objectives.map((objective, idx) => (
                    <Typography key={idx} color="text.secondary">
                      • {objective}
                    </Typography>
                  ))
                ) : (
                  <Typography color="text.secondary">No learning objectives provided.</Typography>
                )}
              </Paper>
            </Grid>
          </Grid>
        </Box>

        <Divider />

        <Box sx={{ flexGrow: 1, py: 3 }}>
          <Grid container spacing={2}>
            {selectedCase.difficulty && (
              <Grid item>
                <Chip
                  label={`Difficulty: ${selectedCase.difficulty}`}
                  color="primary"
                  variant="outlined"
                />
              </Grid>
            )}
            {selectedCase.duration !== undefined && selectedCase.duration !== null && (
              <Grid item>
                <Chip label={`Duration: ${selectedCase.duration} min`} variant="outlined" />
              </Grid>
            )}
            {selectedCase.topics?.length ? (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Topics
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  {selectedCase.topics.map((topic) => (
                    <Chip key={topic} label={topic} variant="outlined" size="small" />
                  ))}
                </Stack>
              </Grid>
            ) : null}
          </Grid>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="contained" color="primary" size="large" onClick={handleStartVirtualPatient}>
            Start Virtual Patient
          </Button>
          <Button variant="outlined" color="secondary" onClick={handleClearSelection}>
            Back to Case List
          </Button>
        </Box>
      </Box>
    )
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              height: "100%",
            }}>
            <Box sx={{ p: 2.5, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
              <Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: 0.6 }}>
                Medical Cases
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Available Cases
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Browse cases created in the Medical Case Creator and launch virtual simulations.
              </Typography>
            </Box>
            <Box sx={{ flexGrow: 1, overflow: "auto", py: 2 }}>{renderCaseList()}</Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              p: { xs: 2.5, md: 3 },
              minHeight: 420,
            }}>
            {renderCaseDetails()}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}
