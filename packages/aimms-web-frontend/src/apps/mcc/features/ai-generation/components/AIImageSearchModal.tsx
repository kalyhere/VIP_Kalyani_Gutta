import React from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Alert,
  TextField,
  Grid,
  Card,
  CardMedia,
  IconButton,
  InputAdornment,
  Tooltip,
  Chip,
  Stack,
} from "@mui/material"
import SendIcon from "@mui/icons-material/Send"
import MicIcon from "@mui/icons-material/Mic"
import MicOffIcon from "@mui/icons-material/MicOff"
import CheckCircleIcon from "@mui/icons-material/CheckCircle"
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline"
import ClearIcon from "@mui/icons-material/Clear"
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome"
import { useAIImageSearch } from "../hooks/useAIImageSearch"

interface AIImageSearchModalProps {
  open: boolean
  onClose: () => void
  onImageSelect: (imageUrls: string[]) => void
}

const MessageBubble: React.FC<{
  message: { role: "user" | "assistant"; content: string; images?: any }
  onImageSelect: (url: string) => void
  selectedImages: Set<string>
}> = ({ message, onImageSelect, selectedImages }) => {
  const isUser = message.role === "user"

  if (message.images) {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          maxWidth: "100%",
        }}>
        <Typography
          variant="body1"
          sx={{
            alignSelf: isUser ? "flex-end" : "flex-start",
            maxWidth: "80%",
          }}>
          {message.content}
        </Typography>

        {message.images.magicKingdom.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Magic Kingdom Results
            </Typography>
            <Grid container spacing={2}>
              {message.images.magicKingdom.map((image: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      "&:hover": { boxShadow: 6 },
                    }}
                    onClick={() => onImageSelect(image.url)}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        p: 0.5,
                      }}>
                      {selectedImages.has(image.url) ? (
                        <CheckCircleIcon color="primary" />
                      ) : (
                        <CheckCircleOutlineIcon color="action" />
                      )}
                    </Box>
                    <CardMedia component="img" height="200" image={image.url} alt={image.name} />
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {image.name.split("/").pop()}
                      </Typography>
                      {image.description && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {image.description}
                        </Typography>
                      )}
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

        {message.images.web.length > 0 && (
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              Web Results
            </Typography>
            <Grid container spacing={2}>
              {message.images.web.map((image: any, index: number) => (
                <Grid item xs={12} sm={6} md={4} key={index}>
                  <Card
                    sx={{
                      cursor: "pointer",
                      position: "relative",
                      "&:hover": { boxShadow: 6 },
                    }}
                    onClick={() => onImageSelect(image.url)}>
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                        bgcolor: "rgba(255, 255, 255, 0.9)",
                        borderRadius: "50%",
                        p: 0.5,
                      }}>
                      {selectedImages.has(image.url) ? (
                        <CheckCircleIcon color="primary" />
                      ) : (
                        <CheckCircleOutlineIcon color="action" />
                      )}
                    </Box>
                    <CardMedia component="img" height="200" image={image.url} alt={image.title} />
                    <Box sx={{ p: 1 }}>
                      <Typography variant="subtitle2" noWrap>
                        {image.title}
                      </Typography>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>
    )
  }

  return (
    <Typography
      variant="body1"
      sx={{
        alignSelf: isUser ? "flex-end" : "flex-start",
        maxWidth: "80%",
        bgcolor: isUser ? "primary.main" : "grey.100",
        color: isUser ? "primary.contrastText" : "text.primary",
        p: 2,
        borderRadius: 2,
      }}>
      {message.content}
    </Typography>
  )
}

const AIImageSearchModal: React.FC<AIImageSearchModalProps> = ({
  open,
  onClose,
  onImageSelect,
}) => {
  const {
    messages,
    input,
    setInput,
    isProcessing,
    error,
    handleSend,
    handleImageSelect,
    handleConfirmSelection,
    handleClearSelection,
    isListening,
    startListening,
    stopListening,
    selectedImages,
    messagesEndRef,
  } = useAIImageSearch({ onImageSelect, onClose })

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          height: "80vh",
          maxHeight: "800px",
        },
      }}>
      <DialogTitle>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <AutoAwesomeIcon color="primary" />
          <Typography variant="h6">AI Image Search</Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            maxHeight: "60vh",
          }}>
          <Box
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              p: 2,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}>
            {messages.map((message, index) => (
              <MessageBubble
                key={index}
                message={message}
                onImageSelect={handleImageSelect}
                selectedImages={selectedImages}
              />
            ))}
            <div ref={messagesEndRef} />
          </Box>

          <Box
            sx={{
              p: 2,
              borderTop: 1,
              borderColor: "divider",
              display: "flex",
              gap: 1,
            }}>
            <TextField
              fullWidth
              placeholder="Describe the image you want..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              disabled={isProcessing || isListening}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Tooltip title={isListening ? "Stop recording" : "Start voice input"}>
                        <IconButton
                          onClick={isListening ? stopListening : startListening}
                          disabled={isProcessing}
                          color={isListening ? "error" : "default"}>
                          {isListening ? <MicOffIcon /> : <MicIcon />}
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        onClick={handleSend}
                        disabled={isProcessing || !input.trim() || isListening}>
                        {isProcessing ? <CircularProgress size={24} /> : <SendIcon />}
                      </IconButton>
                    </Box>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {selectedImages.size > 0 && (
          <Button
            variant="contained"
            onClick={handleConfirmSelection}
            startIcon={<CheckCircleIcon />}>
            Add Selected Images ({selectedImages.size})
          </Button>
        )}
      </DialogActions>
    </Dialog>
  )
}

export default AIImageSearchModal
