import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  IconButton,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material"
import {
  ContentCopy as CopyIcon,
  Close as CloseIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
} from "@mui/icons-material"
import { api } from "@/services/api"

interface ShareReportDialogProps {
  open: boolean
  onClose: () => void
  reportId: number
  reportName?: string
  reportScore?: number
}

interface ShareLink {
  token: string
  share_url: string
  expires_at: string
  access_count: number
  last_accessed_at: string | null
  created_at: string
}

export const ShareReportDialog: React.FC<ShareReportDialogProps> = ({
  open,
  onClose,
  reportId,
  reportName,
  reportScore,
}) => {
  const [daysValid, setDaysValid] = useState(365)
  const [loading, setLoading] = useState(false)
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([])
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)
  const [selectedLinkForEmail, setSelectedLinkForEmail] = useState<string | null>(null)
  const [recipientEmail, setRecipientEmail] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailError, setEmailError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchShareLinks()
    }
  }, [open, reportId])

  const fetchShareLinks = async () => {
    try {
      const response = await api.get(`/api/aimhei-reports/${reportId}/share-links`)
      setShareLinks(response.data)
    } catch (err: any) {
      console.error("Failed to fetch share links:", err)
    }
  }

  const handleCreateShareLink = async () => {
    // Validate days_valid before sending request
    const validDays = Math.min(Math.max(daysValid, 1), 365)
    if (validDays !== daysValid) {
      setDaysValid(validDays)
      setError("Days valid must be between 1 and 365. Value has been adjusted.")
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const response = await api.post(`/api/aimhei-reports/${reportId}/share-link`, {
        days_valid: validDays,
      })

      setSuccess(response.data.message || "Share link created successfully!")
      await fetchShareLinks()
      await navigator.clipboard.writeText(response.data.share_url)
      setCopiedToken(response.data.token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Failed to create share link"
      setError(errorMessage)
      console.error("Error creating share link:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = async (shareUrl: string, token: string) => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopiedToken(token)
      setTimeout(() => setCopiedToken(null), 2000)
    } catch (err) {
      console.error("Failed to copy:", err)
    }
  }

  const handleDeleteLink = async (token: string) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this share link? This action cannot be undone."
      )
    ) {
      return
    }

    try {
      await api.delete(`/api/aimhei-reports/${reportId}/share-links/${encodeURIComponent(token)}`)
      setSuccess("Share link deleted successfully")
      await fetchShareLinks()
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Failed to delete share link"
      setError(errorMessage)
      console.error("Error deleting share link:", err)
    }
  }

  const handleSendEmail = async (token: string) => {
    // Validate email
    if (!recipientEmail) {
      setEmailError("Please enter a recipient email address")
      return
    }

    if (!recipientEmail.endsWith("@arizona.edu")) {
      setEmailError("Email must be a @arizona.edu address")
      return
    }

    setSendingEmail(true)
    setEmailError(null)
    setError(null)

    try {
      const response = await api.post(
        `/api/aimhei-reports/${reportId}/share-links/${encodeURIComponent(token)}/send-email`,
        {
          recipient_email: recipientEmail,
          custom_message: customMessage || null,
        }
      )

      setSuccess(response.data.message || `Email sent successfully to ${recipientEmail}`)
      setRecipientEmail("")
      setCustomMessage("")
      setSelectedLinkForEmail(null)
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.detail || err.message || "Failed to send email"
      setEmailError(errorMessage)
      console.error("Error sending email:", err)
    } finally {
      setSendingEmail(false)
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  const isExpired = (expiresAt: string) => new Date(expiresAt) < new Date()

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6">Share Report</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {reportName && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Report:
              {" "}
              <strong>{reportName}</strong>
              {reportScore !== undefined && ` (${reportScore}%)`}
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Create New Share Link
          </Typography>
          <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
            <TextField
              label="Valid for (days)"
              type="number"
              value={daysValid}
              onChange={(e) => {
                const value = parseInt(e.target.value)
                if (!isNaN(value)) {
                  setDaysValid(Math.min(Math.max(value, 1), 365))
                } else {
                  setDaysValid(365)
                }
              }}
              inputProps={{ min: 1, max: 365 }}
              size="small"
              sx={{ width: 150 }}
              helperText="Max 365 days"
              error={daysValid < 1 || daysValid > 365}
            />
            <Button
              variant="contained"
              onClick={handleCreateShareLink}
              disabled={loading || daysValid < 1 || daysValid > 365}>
              {loading ? <CircularProgress size={24} /> : "Create Link"}
            </Button>
          </Box>
        </Box>

        {shareLinks.length > 0 && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Existing Share Links
            </Typography>
            <List>
              {shareLinks.map((link) => (
                <Box
                  key={link.token}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 1,
                    mb: 1,
                  }}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: "monospace",
                              fontSize: "0.875rem",
                              flex: 1,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}>
                            {link.share_url}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => handleCopyLink(link.share_url, link.token)}
                            color={copiedToken === link.token ? "success" : "default"}>
                            {copiedToken === link.token ? (
                              <CheckIcon fontSize="small" />
                            ) : (
                              <CopyIcon fontSize="small" />
                            )}
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLink(link.token)
                            }}
                            color="error">
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      }
                      secondary={
                        <Box sx={{ display: "flex", gap: 1, mt: 0.5, flexWrap: "wrap" }}>
                          <Chip
                            label={isExpired(link.expires_at) ? "Expired" : "Active"}
                            size="small"
                            color={isExpired(link.expires_at) ? "error" : "success"}
                          />
                          <Chip
                            label={`Expires: ${formatDate(link.expires_at)}`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={`Views: ${link.access_count}`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      }
                    />
                  </ListItem>

                  {!isExpired(link.expires_at) && (
                    <Accordion
                      expanded={selectedLinkForEmail === link.token}
                      onChange={() =>
                        setSelectedLinkForEmail(
                          selectedLinkForEmail === link.token ? null : link.token
                        )
                      }>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <EmailIcon fontSize="small" />
                          <Typography variant="body2">Send via Email</Typography>
                        </Box>
                      </AccordionSummary>
                      <AccordionDetails>
                        {emailError && selectedLinkForEmail === link.token && (
                          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setEmailError(null)}>
                            {emailError}
                          </Alert>
                        )}

                        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                          <TextField
                            label="Recipient Email"
                            placeholder="recipient@arizona.edu"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            size="small"
                            fullWidth
                            helperText="Must be a @arizona.edu address"
                            error={recipientEmail !== "" && !recipientEmail.endsWith("@arizona.edu")}
                            disabled={sendingEmail}
                          />

                          <TextField
                            label="Custom Message (Optional)"
                            placeholder="Add a personal message..."
                            value={customMessage}
                            onChange={(e) => setCustomMessage(e.target.value)}
                            size="small"
                            fullWidth
                            multiline
                            rows={3}
                            inputProps={{ maxLength: 500 }}
                            helperText={`${customMessage.length}/500 characters`}
                            disabled={sendingEmail}
                          />

                          <Button
                            variant="contained"
                            startIcon={sendingEmail ? <CircularProgress size={16} /> : <EmailIcon />}
                            onClick={() => handleSendEmail(link.token)}
                            disabled={sendingEmail || !recipientEmail || !recipientEmail.endsWith("@arizona.edu")}
                            fullWidth>
                            {sendingEmail ? "Sending..." : "Send Email"}
                          </Button>
                        </Box>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Box>
              ))}
            </List>
          </>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  )
}
