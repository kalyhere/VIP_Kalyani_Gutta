import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Box, Typography, Link, alpha, Button, CircularProgress, useTheme } from "@mui/material"
import { useAuthStore } from "../stores/authStore"
import { useNotificationStore } from "../stores/notificationStore"
import { UATextField } from "./StyledFormComponents"

const CustomLoginForm = () => {
  const theme = useTheme()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [justLoggedIn, setJustLoggedIn] = useState(false)
  const login = useAuthStore((state) => state.login)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)
  const navigate = useNavigate()
  const notify = useNotificationStore((state) => state.notify)

  // Effect to handle navigation after successful login
  useEffect(() => {
    if (justLoggedIn && isAuthenticated && user?.role) {
      console.log("Navigating after login, role:", user.role)

      // Navigate to root and let RootRedirect handle the routing
      // This is more reliable with browser routing
      navigate("/", { replace: true })

      setJustLoggedIn(false)
      setLoading(false)
    }
  }, [justLoggedIn, isAuthenticated, user, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login(username, password)
      setJustLoggedIn(true) // This will trigger the useEffect above
    } catch (error) {
      notify("Invalid username or password", { type: "error" })
      setLoading(false)
      setJustLoggedIn(false)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: "100%" }}>
      {/* Unified Login Card with gradient header */}
      <Box
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 3,
          boxShadow: `0 4px 6px ${alpha(theme.palette.text.primary, 0.07)}, 0 1px 3px ${alpha(theme.palette.text.primary, 0.05)}`,
          position: "relative",
          overflow: "hidden",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 50%, ${theme.palette.secondary.light} 100%)`,
          },
        }}>
        {/* Section 1: Title Header */}
        <Box sx={{ pt: { xs: 3, sm: 5 }, px: { xs: 3, sm: 4 }, pb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              letterSpacing: "-0.75px",
              fontSize: { xs: "1.5rem", sm: "1.75rem" }, // Smaller on mobile
            }}>
            AI Medical Mentoring System
          </Typography>
          <Link
            href="https://astec.arizona.edu/"
            target="_blank"
            rel="noopener"
            variant="body1"
            sx={{
              color: theme.palette.text.secondary,
              textDecoration: "none",
              fontSize: "0.75rem",
              fontWeight: 500,
              letterSpacing: "0.25px",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                textDecoration: "underline",
                color: theme.palette.text.primary,
              },
            }}>
            ASTEC - Arizona Simulation Technology & Education Center
          </Link>
        </Box>

        {/* Section 2: Login Form */}
        <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 5 } }}>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <UATextField
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              fullWidth
              required
              autoComplete="username"
              autoFocus
              placeholder="Enter your username"
            />

            <UATextField
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              autoComplete="current-password"
              placeholder="Enter your password"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading || !username || !password}
              sx={{
                mt: 1,
                backgroundColor: theme.palette.primary.main,
                color: theme.palette.background.paper,
                fontWeight: 600,
                fontSize: "0.875rem",
                letterSpacing: "0.25px",
                textTransform: "none",
                py: 1.5,
                borderRadius: 2,
                boxShadow: `0 2px 4px ${alpha(theme.palette.primary.main, 0.2)}`,
                transition: "all 0.2s ease-in-out",
                "&:hover": {
                  backgroundColor: theme.palette.primary.dark,
                  boxShadow: `0 4px 8px ${alpha(theme.palette.primary.main, 0.3)}`,
                  transform: "translateY(-1px)",
                },
                "&:disabled": {
                  backgroundColor: alpha(theme.palette.primary.main, 0.5),
                  color: theme.palette.background.paper,
                  boxShadow: "none",
                  transform: "none",
                },
              }}>
              {loading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} sx={{ color: theme.palette.background.paper }} />
                  Signing in...
                </Box>
              ) : (
                "Sign In"
              )}
            </Button>
          </Box>
        </Box>

        {/* Section 3: Footer Information */}
        <Box
          sx={{
            px: { xs: 3, sm: 4 },
            pb: 3,
            pt: 2.5,
            textAlign: "center",
            borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
            backgroundColor: alpha(theme.palette.background.default, 0.4),
          }}>
          <Typography
            variant="caption"
            sx={{
              color: theme.palette.text.secondary,
              fontSize: "0.75rem",
              mb: 0.5,
              fontWeight: 400,
              display: "block",
            }}>
            Need access to this system?
          </Typography>
          <Link
            href="mailto:ua.aidset@gmail.com"
            variant="caption"
            sx={{
              color: theme.palette.primary.main,
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.8125rem",
              letterSpacing: "0.15px",
              transition: "all 0.2s ease-in-out",
              display: "inline-flex",
              alignItems: "center",
              "&:hover": {
                textDecoration: "underline",
                color: theme.palette.primary.dark,
              },
            }}>
            Contact aidset@arizona.edu
          </Link>
        </Box>
      </Box>
    </Box>
  )
}

export const CustomLoginPage = () => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        backgroundImage: "none",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        px: { xs: 2, sm: 0 }, // Add horizontal padding on mobile
      }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 520 }, // Full width on mobile, max 520px on desktop
          margin: "0",
          marginTop: { xs: 0, sm: "-10vh" }, // Remove negative margin on mobile
          padding: "0",
          position: "relative",
          zIndex: 2,
        }}>
        <CustomLoginForm />
      </Box>
    </Box>
  )
}
