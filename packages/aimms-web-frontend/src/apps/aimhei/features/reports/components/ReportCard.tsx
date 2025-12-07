/**
 * ReportCard Component
 * Displays a summary card for an AIMHEI report
 */

import React, { useState } from "react"
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  IconButton,
  Checkbox,
  Collapse,
  TextField,
  Tooltip,
  useTheme,
} from "@mui/material"
import { FlexCenterVertical, FlexRow } from "@/components/styled"
import MoreVertIcon from "@mui/icons-material/MoreVert"
import AssessmentIcon from "@mui/icons-material/Assessment"
import ArchiveIcon from "@mui/icons-material/Archive"
import UnarchiveIcon from "@mui/icons-material/Unarchive"
import NoteIcon from "@mui/icons-material/Note"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLessIcon from "@mui/icons-material/ExpandLess"

// Support both formats: snake_case from API and camelCase from props
export interface ReportCardProps {
  reportId?: number
  report_id?: number
  title?: string
  case_title?: string
  patientId?: string
  patient_id?: string
  hcpName?: string
  hcp_name?: string
  score?: number
  percentage_score?: number | null
  aiModel?: string
  ai_model?: string
  createdAt?: string
  created_at?: string
  onClick?: () => void
  onMenuClick?: (event: React.MouseEvent<HTMLElement>) => void
  selected?: boolean
  // New organization fields
  isArchived?: boolean
  is_archived?: boolean
  tags?: string[]
  notes?: string | null
  isAdmin?: boolean
  bulkSelectionMode?: boolean
  onBulkSelect?: (reportId: number) => void
  onArchiveToggle?: (reportId: number, isArchived: boolean) => void
  onTagsChange?: (reportId: number, tags: string[]) => void
  onNotesChange?: (reportId: number, notes: string | null) => void
}

/**
 * Helper to get color for score
 * Returns MUI theme palette colors based on score ranges
 */
const getScoreColorFromTheme = (score: number, theme: any): string => {
  if (score >= 80) return theme.palette.secondary.light // Use secondary light for excellent scores
  if (score >= 60) return theme.palette.secondary.main // Use secondary main for good scores
  if (score >= 40) return theme.palette.primary.main // Use primary main for fair scores
  return theme.palette.primary.dark // Use primary dark for poor scores
}

/**
 * ReportCard component
 */
export const ReportCard: React.FC<ReportCardProps> = (props) => {
  const theme = useTheme()
  const {
    onClick,
    onMenuClick,
    selected = false,
    isAdmin = false,
    bulkSelectionMode = false,
    onBulkSelect,
    onArchiveToggle,
    onTagsChange,
    onNotesChange,
  } = props

  // Support both prop formats
  const reportId = props.reportId ?? props.report_id ?? 0
  const title = props.title ?? props.case_title ?? "Untitled Report"
  const patientId = props.patientId ?? props.patient_id ?? "N/A"
  const hcpName = props.hcpName ?? props.hcp_name ?? "Unknown"
  const score = props.score ?? props.percentage_score ?? 0
  const aiModel = props.aiModel ?? props.ai_model ?? "N/A"
  const createdAt = props.createdAt ?? props.created_at ?? new Date().toISOString()
  const isArchived = props.isArchived ?? props.is_archived ?? false
  const tags = props.tags ?? []
  const notes = props.notes ?? null

  const [notesExpanded, setNotesExpanded] = useState(false)
  const [localNotes, setLocalNotes] = useState(notes ?? "")

  const scoreColor = getScoreColorFromTheme(score, theme)

  const handleArchiveToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onArchiveToggle) {
      onArchiveToggle(reportId, !isArchived)
    }
  }

  const handleBulkSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (onBulkSelect) {
      onBulkSelect(reportId)
    }
  }

  const handleNotesBlur = () => {
    if (onNotesChange && localNotes !== notes) {
      onNotesChange(reportId, localNotes || null)
    }
  }

  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        transition: "all 0.2s ease",
        border: selected ? `2px solid ${theme.palette.secondary.main}` : `1px solid ${theme.palette.divider}`,
        bgcolor: isArchived ? theme.palette.background.paper : "white",
        opacity: isArchived ? 0.85 : 1,
        "&:hover": onClick
          ? {
              borderColor: theme.palette.secondary.main,
              boxShadow: `0 4px 12px ${theme.palette.divider}`,
            }
          : {},
      }}>
      <CardContent>
        <FlexCenterVertical
          justifyContent="space-between"
          sx={{
            alignItems: "flex-start",
            mb: 2,
          }}>
          <FlexRow gap={2} sx={{ flex: 1 }}>
            {bulkSelectionMode && isAdmin && (
              <Checkbox
                checked={selected}
                onChange={handleBulkSelect}
                onClick={(e) => e.stopPropagation()}
              />
            )}
            <AssessmentIcon
              sx={{ color: isArchived ? theme.palette.text.disabled : theme.palette.secondary.main, fontSize: 32 }}
            />
            <Box sx={{ flex: 1 }}>
              <FlexCenterVertical gap={1} sx={{ mb: 0.5 }}>
                <Typography variant="h6" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
                  {title}
                </Typography>
                {isArchived && (
                  <Chip
                    label="Archived"
                    size="small"
                    icon={<ArchiveIcon />}
                    sx={{ bgcolor: theme.palette.divider }}
                  />
                )}
                {notes && (
                  <Tooltip title="Has notes">
                    <NoteIcon sx={{ fontSize: 16, color: theme.palette.text.disabled }} />
                  </Tooltip>
                )}
              </FlexCenterVertical>
              <Typography variant="body2" color="text.secondary">
                Patient:
                {" "}
                {patientId}
{' '}
• HCP: 
{" "}
                {hcpName}
              </Typography>
            </Box>
          </FlexRow>
          <FlexRow gap={0.5}>
            {isAdmin && onArchiveToggle && (
              <Tooltip title={isArchived ? "Unarchive" : "Archive"}>
                <IconButton
                  size="small"
                  onClick={handleArchiveToggle}
                  sx={{ color: theme.palette.text.secondary }}>
                  {isArchived ? <UnarchiveIcon /> : <ArchiveIcon />}
                </IconButton>
              </Tooltip>
            )}
            {onMenuClick && (
              <IconButton
                size="small"
                aria-label="Report actions menu"
                onClick={(e) => {
                  e.stopPropagation()
                  onMenuClick(e)
                }}
                sx={{ color: theme.palette.text.secondary }}>
                <MoreVertIcon />
              </IconButton>
            )}
          </FlexRow>
        </FlexCenterVertical>

        <FlexCenterVertical
          gap={1}
          sx={{
            flexWrap: "wrap",
            mb: tags.length > 0 ? 1 : 0,
          }}>
          <Chip
            label={`${Math.round(score)}%`}
            size="small"
            sx={{
              bgcolor: scoreColor,
              color: "white",
              fontWeight: 600,
            }}
          />
          <Chip
            label={aiModel}
            size="small"
            variant="outlined"
            sx={{ borderColor: theme.palette.divider }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
            {new Date(createdAt).toLocaleDateString()}
          </Typography>
        </FlexCenterVertical>

        {/* Tags Display */}
        {tags.length > 0 && (
          <FlexRow gap={0.5} sx={{ flexWrap: "wrap", mb: 1 }}>
            {tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" color="primary" />
            ))}
          </FlexRow>
        )}

        {/* Notes Section */}
        {isAdmin && (notes || notesExpanded) && (
          <Box sx={{ mt: 1, borderTop: `1px solid ${theme.palette.divider}`, pt: 1 }}>
            <FlexCenterVertical
              justifyContent="space-between"
              sx={{ mb: 0.5 }}>
              <Typography variant="caption" fontWeight={600} color="text.secondary">
                Notes
              </Typography>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation()
                  setNotesExpanded(!notesExpanded)
                }}>
                {notesExpanded ? (
                  <ExpandLessIcon fontSize="small" />
                ) : (
                  <ExpandMoreIcon fontSize="small" />
                )}
              </IconButton>
            </FlexCenterVertical>
            <Collapse in={notesExpanded}>
              <TextField
                fullWidth
                multiline
                rows={2}
                size="small"
                value={localNotes}
                onChange={(e) => setLocalNotes(e.target.value)}
                onBlur={handleNotesBlur}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add admin notes..."
                variant="outlined"
              />
            </Collapse>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}
