import React, { useCallback, useRef } from "react"
import {
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Box,
  Stack,
  alpha,
  Fade,
  IconButton,
  Divider,
  useTheme,
  useMediaQuery,
  Avatar,
} from "@mui/material"
import {
  CloudUpload as CloudUploadIcon,
  Refresh as RefreshIcon,
  MedicalServices as MedicalIcon,
} from "@mui/icons-material"
import { useDropzone } from "react-dropzone"
import axios from "axios"
import { UnifiedAnalysisView } from "./features/unified-view"
import { useSutureAnalysisStore } from "./stores/sutureAnalysisStore"

const SutureAnalysis: React.FC = () => {
  // Zustand store - use individual selectors for stable references
  const analysisResult = useSutureAnalysisStore((state) => state.analysisResult)
  const uploadedImage = useSutureAnalysisStore((state) => state.uploadedImage)
  const isAnalyzing = useSutureAnalysisStore((state) => state.isAnalyzing)
  const showResults = useSutureAnalysisStore((state) => state.showResults)
  const isTransitioning = useSutureAnalysisStore((state) => state.isTransitioning)
  const error = useSutureAnalysisStore((state) => state.error)

  const startAnalysis = useSutureAnalysisStore((state) => state.startAnalysis)
  const completeAnalysis = useSutureAnalysisStore((state) => state.completeAnalysis)
  const failAnalysis = useSutureAnalysisStore((state) => state.failAnalysis)
  const setUploadedImage = useSutureAnalysisStore((state) => state.setUploadedImage)
  const setIsTransitioning = useSutureAnalysisStore((state) => state.setIsTransitioning)
  const setError = useSutureAnalysisStore((state) => state.setError)
  const resetAnalysis = useSutureAnalysisStore((state) => state.resetAnalysis)

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileAnalysis = useCallback(
    async (file: File) => {
      startAnalysis()

      try {
        // Create data URL for display (backend will handle HEIC conversion)
        const imageUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })

        setUploadedImage(imageUrl)

        // Prepare form data - backend will handle HEIC conversion automatically
        const formData = new FormData()
        formData.append("file", file)

        // Get auth token from localStorage
        const token = localStorage.getItem("auth_token")
        if (!token) {
          throw new Error("Authentication token not found. Please log in again.")
        }

        // Send to suture analysis API
        const apiUrl = import.meta.env.VITE_SUTURE_BACKEND_URL
        const response = await axios.post(`${apiUrl}/api/suture/analyze`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        })

        // Start transition effect
        setIsTransitioning(true)

        // Backend always provides JPEG version - use it IMMEDIATELY
        if (response.data.jpeg_image) {
          setUploadedImage(response.data.jpeg_image)
        }

        // Wait a moment for smooth transition
        setTimeout(() => {
          completeAnalysis(response.data, response.data.jpeg_image || imageUrl)
        }, 800)
      } catch (err: any) {
        console.error("Analysis failed:", err)
        failAnalysis(
          err.response?.data?.detail || err.message || "Analysis failed. Please try again.",
        )
      }
    },
    [startAnalysis, completeAnalysis, failAnalysis, setUploadedImage, setIsTransitioning],
  )

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return
      const file = acceptedFiles[0]
      await handleFileAnalysis(file)
    },
    [handleFileAnalysis]
  )

  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click()
    }
  }, [])

  const handleFileUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }, [])

  const handleCameraChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        await handleFileAnalysis(file)
      }
    },
    [handleFileAnalysis]
  )

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) {
        await handleFileAnalysis(file)
      }
    },
    [handleFileAnalysis]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".heic", ".heif"],
    },
    maxFiles: 1,
    disabled: isAnalyzing,
    noClick: true,
  })

  const handleResetAnalysis = useCallback(() => {
    setIsTransitioning(true)

    setTimeout(() => {
      resetAnalysis()
    }, 300)
  }, [setIsTransitioning, resetAnalysis])

  return (
    <Box
      sx={{
        // Mobile-first: full screen layout for educational use
        minHeight: isMobile ? "100vh" : "auto",
        py: isMobile ? 0 : 4,
        px: isMobile ? 0 : 3,
        maxWidth: isMobile ? "none" : "1200px",
        mx: "auto",
        "& @keyframes pulse": {
          "0%": { opacity: 1 },
          "50%": { opacity: 0.5 },
          "100%": { opacity: 1 },
        },
      }}>
      {/* Mobile-First Header */}
      {isMobile ? (
        /* Minimal Mobile Header */
        <Box
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 100,
            backgroundColor: "background.paper",
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            px: 2,
            py: 1.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
              }}>
              <MedicalIcon sx={{ fontSize: 18, color: "white" }} />
            </Avatar>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.primary.light,
                fontWeight: 600,
                fontSize: "1.1rem",
              }}>
              Suture Analysis
            </Typography>
          </Box>
          {analysisResult && (
            <IconButton onClick={handleResetAnalysis} size="small">
              <RefreshIcon />
            </IconButton>
          )}
        </Box>
      ) : (
        /* Desktop Header */
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2.5,
            background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.02)} 0%, ${alpha(theme.palette.secondary.main, 0.04)} 100%)`,
            border: `1px solid ${alpha(theme.palette.primary.light, 0.08)}`,
            overflow: "hidden",
            position: "relative",
            boxShadow: `0 4px 20px ${alpha(theme.palette.secondary.main, 0.08)}`,
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 3,
              background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
            },
          }}>
          <Box sx={{ p: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Box sx={{ position: "relative" }}>
                  <Avatar
                    sx={{
                      width: 42,
                      height: 42,
                      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                      border: `2px solid ${alpha(theme.palette.primary.light, 0.1)}`,
                      boxShadow: `0 3px 12px ${alpha(theme.palette.primary.light, 0.15)}`,
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "scale(1.05)",
                        boxShadow: `0 5px 16px ${alpha(theme.palette.primary.light, 0.25)}`,
                      },
                    }}>
                    <MedicalIcon sx={{ fontSize: 22, color: "white" }} />
                  </Avatar>
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 0.5,
                      right: 0.5,
                      width: 10,
                      height: 10,
                      borderRadius: "50%",
                      backgroundColor: theme.palette.secondary.light,
                      border: "2px solid white",
                      boxShadow: `0 2px 8px ${alpha(theme.palette.secondary.light, 0.3)}`,
                    }}
                  />
                </Box>
                <Box>
                  <Typography
                    variant="overline"
                    sx={{
                      color: theme.palette.secondary.main,
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      letterSpacing: 0.5,
                      display: "block",
                      lineHeight: 1.2,
                      textTransform: "uppercase",
                    }}>
                    AI-Powered Analysis
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: theme.palette.primary.light,
                      fontWeight: 700,
                      fontSize: "1.25rem",
                      lineHeight: 1.3,
                    }}>
                    Suture Quality Assessment
                  </Typography>
                </Box>
              </Box>
              {analysisResult && (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleResetAnalysis}
                  startIcon={<RefreshIcon />}
                  sx={{
                    borderColor: theme.palette.secondary.main,
                    color: theme.palette.secondary.main,
                    textTransform: "none",
                    fontWeight: 500,
                    "&:hover": {
                      borderColor: theme.palette.primary.light,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                    },
                  }}>
                  New Analysis
                </Button>
              )}
            </Box>
          </Box>
        </Paper>
      )}

      {/* Camera-First Upload Interface */}
      {!analysisResult && !isTransitioning && (
        <Fade in={!isTransitioning} timeout={600} style={{ transformOrigin: "center" }}>
          <Paper
            {...getRootProps()}
            elevation={0}
            sx={{
              p: isMobile ? 4 : 8,
              m: isMobile ? 2 : "auto",
              maxWidth: isMobile ? "calc(100vw - 16px)" : "none",
              textAlign: "center",
              border: `3px dashed ${isDragActive ? theme.palette.secondary.main : alpha(theme.palette.text.secondary, 0.4)}`,
              borderRadius: 4,
              backgroundColor: isDragActive ? alpha(theme.palette.secondary.main, 0.03) : alpha("#F8FAFC", 0.5),
              transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
              mb: isMobile ? 2 : 4,
              transform: isDragActive ? "scale(1.02)" : "scale(1)",
              boxShadow: isDragActive
                ? `0 8px 32px ${alpha(theme.palette.secondary.main, 0.15)}`
                : `0 4px 20px ${alpha(theme.palette.text.secondary, 0.08)}`,
              "&::before": {
                content: isDragActive ? '""' : "none",
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 4,
                background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.05)} 25%, transparent 25%),
                             linear-gradient(-45deg, ${alpha(theme.palette.secondary.main, 0.05)} 25%, transparent 25%),
                             linear-gradient(45deg, transparent 75%, ${alpha(theme.palette.secondary.main, 0.05)} 75%),
                             linear-gradient(-45deg, transparent 75%, ${alpha(theme.palette.secondary.main, 0.05)} 75%)`,
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 0 10px, 10px -10px, -10px 0px",
                animation: isDragActive ? "pulse 2s infinite ease-in-out" : "none",
                zIndex: -1,
              },
            }}>
            <input {...getInputProps()} />

            {/* Hidden file inputs */}
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCameraChange}
              style={{ display: "none" }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.heic,.heif"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {isDragActive ? (
              <Box
                sx={{
                  transition: "transform 0.3s ease",
                  transform: "scale(1.1)",
                }}>
                <CloudUploadIcon
                  sx={{
                    fontSize: isMobile ? 48 : 64,
                    color: theme.palette.secondary.main,
                    mb: 3,
                    filter: `drop-shadow(0 4px 8px ${alpha(theme.palette.secondary.main, 0.3)})`,
                  }}
                />
                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  sx={{
                    color: theme.palette.primary.light,
                    fontWeight: 700,
                    fontSize: isMobile ? "1.3rem" : "1.8rem",
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                  Drop your suture image here
                </Typography>
              </Box>
            ) : (
              <>
                {/* Camera Icon */}
                <Box sx={{ mb: 3 }}>
                  <Avatar
                    sx={{
                      width: isMobile ? 80 : 96,
                      height: isMobile ? 80 : 96,
                      backgroundColor: alpha(theme.palette.secondary.main, 0.1),
                      border: `3px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      mx: "auto",
                      mb: 2,
                    }}>
                    <MedicalIcon
                      sx={{
                        fontSize: isMobile ? 36 : 42,
                        color: theme.palette.secondary.main,
                      }}
                    />
                  </Avatar>
                </Box>

                <Typography
                  variant={isMobile ? "h5" : "h4"}
                  gutterBottom
                  sx={{
                    color: theme.palette.primary.light,
                    fontWeight: 700,
                    fontSize: isMobile ? "1.3rem" : "1.8rem",
                    mb: 2,
                    background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}>
                  Analyze Suture Quality
                </Typography>

                <Typography variant="h6" color="text.secondary" sx={{ mb: 4, fontWeight: 500 }}>
                  Take a photo or upload an image to get started
                </Typography>

                {/* Action Buttons */}
                <Stack
                  direction={isMobile ? "column" : "row"}
                  spacing={2}
                  sx={{ justifyContent: "center", mb: 3 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleCameraCapture}
                    disabled={isAnalyzing}
                    startIcon={<MedicalIcon />}
                    sx={{
                      backgroundColor: theme.palette.secondary.main,
                      color: "white",
                      py: isMobile ? 1.5 : 1.25,
                      px: isMobile ? 4 : 3,
                      fontSize: isMobile ? "1rem" : "0.95rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: "none",
                      boxShadow: `0 4px 12px ${alpha(theme.palette.secondary.main, 0.3)}`,
                      "&:hover": {
                        backgroundColor: theme.palette.primary.light,
                        boxShadow: `0 6px 16px ${alpha(theme.palette.secondary.main, 0.4)}`,
                        transform: "translateY(-1px)",
                      },
                      "&:disabled": {
                        backgroundColor: alpha(theme.palette.text.secondary, 0.3),
                      },
                    }}>
                    Take Photo
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleFileUpload}
                    disabled={isAnalyzing}
                    startIcon={<CloudUploadIcon />}
                    sx={{
                      borderColor: theme.palette.secondary.main,
                      color: theme.palette.secondary.main,
                      py: isMobile ? 1.5 : 1.25,
                      px: isMobile ? 4 : 3,
                      fontSize: isMobile ? "1rem" : "0.95rem",
                      fontWeight: 600,
                      borderRadius: 2,
                      textTransform: "none",
                      "&:hover": {
                        borderColor: theme.palette.primary.light,
                        color: theme.palette.primary.light,
                        backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                      },
                      "&:disabled": {
                        borderColor: alpha(theme.palette.text.secondary, 0.3),
                        color: alpha(theme.palette.text.secondary, 0.5),
                      },
                    }}>
                    Upload File
                  </Button>
                </Stack>

                <Divider sx={{ my: 2, width: "60%", mx: "auto" }} />

                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                  Supports iPhone/Android photos, JPG, PNG, HEIC • Max 10MB
                </Typography>
              </>
            )}
            {(isAnalyzing || isTransitioning) && (
              <Fade in timeout={400}>
                <Box sx={{ mt: 6 }}>
                  <Box sx={{ position: "relative", display: "inline-flex", mb: 3 }}>
                    <CircularProgress
                      size={48}
                      sx={{
                        color: theme.palette.secondary.main,
                        animation: "spin 2s linear infinite",
                      }}
                    />
                    <Box
                      sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        width: 8,
                        height: 8,
                        borderRadius: "50%",
                        backgroundColor: theme.palette.secondary.light,
                        boxShadow: `0 0 12px ${alpha(theme.palette.secondary.light, 0.6)}`,
                        animation: "pulse 1s infinite ease-in-out",
                      }}
                    />
                  </Box>
                  <Typography
                    variant="h6"
                    sx={{
                      color: theme.palette.primary.light,
                      fontWeight: 600,
                      background: `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.secondary.main} 100%)`,
                      backgroundClip: "text",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}>
                    {isTransitioning ? "Preparing results..." : "Analyzing sutures..."}
                  </Typography>
                </Box>
              </Fade>
            )}
          </Paper>
        </Fade>
      )}

      {/* Error Display */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 4,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          }}
          onClose={() => setError(null)}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            Analysis Error
          </Typography>
          {error}
        </Alert>
      )}

      {/* Enhanced Analysis Results with Smooth Transition */}
      {analysisResult && uploadedImage && showResults && (
        <Fade
          in={showResults && !isTransitioning}
          timeout={1200}
          style={{
            transformOrigin: "center top",
            transition:
              "opacity 1.2s cubic-bezier(0.4, 0, 0.2, 1), transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
          }}>
          <Box
            sx={{
              px: isMobile ? 0 : 2,
              pb: isMobile ? 2 : 0,
              transform: showResults ? "translateY(0)" : "translateY(20px)",
              transition: "transform 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
              "& > *": {
                animationDelay: "0.3s",
                animationDuration: "0.8s",
                animationFillMode: "forwards",
                animationName: showResults ? "slideInUp" : "none",
              },
              "@keyframes slideInUp": {
                "0%": {
                  opacity: 0,
                  transform: "translateY(30px)",
                },
                "100%": {
                  opacity: 1,
                  transform: "translateY(0)",
                },
              },
            }}>
            {/* Unified Analysis Component */}
            <UnifiedAnalysisView
              detections={analysisResult.detections}
              measurements={analysisResult.measurements}
              imageUrl={uploadedImage}
              imageSize={analysisResult.image_info.size}
            />
          </Box>
        </Fade>
      )}
    </Box>
  )
}

export default SutureAnalysis
