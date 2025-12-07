import React, { useState } from "react"
import { Login, useLogin, useNotify } from "react-admin"
import { Box, Typography, Link, alpha, Button, CircularProgress, useTheme } from "@mui/material"
import { UATextField } from "./StyledFormComponents"

const CustomLoginForm = () => {
  const theme = useTheme()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const login = useLogin()
  const notify = useNotify()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await login({ username, password })
    } catch (error) {
      notify("Invalid username or password", { type: "error" })
      setLoading(false)
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
        <Box sx={{ pt: 5, px: 4, pb: 3, textAlign: "center" }}>
          <Typography
            variant="h4"
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              letterSpacing: "-0.75px",
              fontSize: "1.75rem",
            }}>
            AI Medical Management System
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
        <Box sx={{ px: 4, pb: 5 }}>
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
            px: 4,
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

export const CustomLogin = (props: any) => {
  const theme = useTheme()

  return (
    <Login
      {...props}
      sx={{
        backgroundColor: theme.palette.background.default,
        backgroundImage: "none",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        "& .RaLogin-main": {
          backgroundImage: "none",
          backgroundColor: "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          position: "relative",
          zIndex: 1,
        },
        "& .RaLogin-card": {
          minWidth: 520,
          maxWidth: 520,
          margin: "0",
          marginTop: "-10vh",
          padding: "0",
          backgroundColor: "transparent",
          boxShadow: "none",
          overflow: "visible",
          position: "relative",
          zIndex: 2,
        },
        "& .RaLogin-avatar": {
          display: "none",
        },
      }}>
      <CustomLoginForm />
    </Login>
  )
}
