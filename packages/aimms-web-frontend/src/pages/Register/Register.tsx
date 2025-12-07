import React, { useState, useEffect } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import {
  Box,
  Typography,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link,
  alpha,
} from "@mui/material"
import { Visibility, VisibilityOff, CheckCircle as CheckCircleIcon } from "@mui/icons-material"
import { useTheme } from "@mui/material/styles"
import { validateInviteToken, registerWithInvite } from "../../services/invitationApi"
import { UATextField } from "../../components/StyledFormComponents"

// UA Brand Colors consistent with the app

interface RegisterProps {
  role: "student" | "faculty" | "admin"
}

const roleDisplayNames = {
  student: "Student",
  faculty: "Faculty",
  admin: "Administrator",
}

export const Register: React.FC<RegisterProps> = ({ role }) => {
  const theme = useTheme()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  // Form state
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Validation state
  const [email, setEmail] = useState("")
  const [validating, setValidating] = useState(true)
  const [validationError, setValidationError] = useState("")
  const [tokenValid, setTokenValid] = useState(false)

  // Submission state
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")
  const [success, setSuccess] = useState(false)

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setValidationError("No invitation token provided")
        setValidating(false)
        return
      }

      try {
        const result = await validateInviteToken(token)
        if (!result.valid) {
          setValidationError(result.error || "Invalid invitation token")
          setValidating(false)
          return
        }

        // Check if token role matches expected role
        if (result.role !== role) {
          setValidationError(
            `This invitation is for ${result.role} registration. Please use the correct registration link.`
          )
          setValidating(false)
          return
        }

        // Valid token
        setEmail(result.email || "")
        setTokenValid(true)
        setValidating(false)
      } catch (error: any) {
        setValidationError(error.response?.data?.detail || "Failed to validate invitation token")
        setValidating(false)
      }
    }

    validateToken()
  }, [token, role])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    // Validation
    if (!name.trim()) {
      setSubmitError("Please enter your name")
      return
    }

    if (password.length < 8) {
      setSubmitError("Password must be at least 8 characters")
      return
    }

    if (password !== confirmPassword) {
      setSubmitError("Passwords do not match")
      return
    }

    try {
      setSubmitting(true)
      await registerWithInvite(role, {
        token: token!,
        name: name.trim(),
        password,
      })

      setSuccess(true)

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login", {
          state: {
            message: "Registration successful! Please log in with your credentials.",
          },
        })
      }, 2000)
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || "Registration failed. Please try again."
      setSubmitError(errorMessage)
      setSubmitting(false)
    }
  }

  // Validating state
  if (validating) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 0 },
        }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: 520 },
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            boxShadow: `0 4px 6px ${alpha(theme.palette.text.primary, 0.07)}, 0 1px 3px ${alpha(theme.palette.text.primary, 0.05)}`,
            p: 4,
            textAlign: "center",
          }}>
          <CircularProgress size={48} sx={{ mb: 2, color: theme.palette.primary.main }} />
          <Typography variant="h6" sx={{ color: theme.palette.text.primary }}>
            Validating invitation...
          </Typography>
        </Box>
      </Box>
    )
  }

  // Invalid token state
  if (!tokenValid || validationError) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 0 },
        }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: 520 },
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            boxShadow: `0 4px 6px ${alpha(theme.palette.text.primary, 0.07)}, 0 1px 3px ${alpha(theme.palette.text.primary, 0.05)}`,
            p: 4,
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
          <Alert severity="error" sx={{ mb: 2, mt: 2 }}>
            {validationError}
          </Alert>
          <Typography variant="body2" color="text.secondary">
            If you believe this is an error, please contact your administrator.
          </Typography>
          <Button
            variant="outlined"
            fullWidth
            sx={{
              mt: 2,
              borderColor: theme.palette.primary.main,
              color: theme.palette.primary.main,
              "&:hover": {
                borderColor: theme.palette.primary.dark,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
              },
            }}
            onClick={() => navigate("/login")}>
            Go to Login
          </Button>
        </Box>
      </Box>
    )
  }

  // Success state
  if (success) {
    return (
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2, sm: 0 },
        }}>
        <Box
          sx={{
            width: "100%",
            maxWidth: { xs: "100%", sm: 520 },
            backgroundColor: theme.palette.background.paper,
            borderRadius: 3,
            boxShadow: `0 4px 6px ${alpha(theme.palette.text.primary, 0.07)}, 0 1px 3px ${alpha(theme.palette.text.primary, 0.05)}`,
            p: 4,
            textAlign: "center",
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
          <Box sx={{ pt: 2 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: theme.palette.primary.main, mb: 2 }} />
            <Typography
              variant="h5"
              gutterBottom
              sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
              Registration Successful!
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Your
              {" "}
              {roleDisplayNames[role].toLowerCase()}
{' '}
account has been created.
</Typography>
            <Typography variant="body2" color="text.secondary">
              Redirecting to login...
            </Typography>
          </Box>
        </Box>
      </Box>
    )
  }

  // Registration form
  return (
    <Box
      sx={{
        backgroundColor: theme.palette.background.default,
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: { xs: 2, sm: 0 },
      }}>
      <Box
        sx={{
          width: "100%",
          maxWidth: { xs: "100%", sm: 520 },
          marginTop: { xs: 0, sm: "-10vh" },
        }}>
        <Box
          component="form"
          onSubmit={handleSubmit}
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
          {/* Header */}
          <Box sx={{ pt: { xs: 3, sm: 5 }, px: { xs: 3, sm: 4 }, pb: 3, textAlign: "center" }}>
            <Typography
              variant="h4"
              sx={{
                color: theme.palette.text.primary,
                fontWeight: 700,
                letterSpacing: "-0.75px",
                fontSize: { xs: "1.5rem", sm: "1.75rem" },
              }}>
              {roleDisplayNames[role]} Registration
            </Typography>
            <Typography
              variant="body1"
              sx={{
                color: theme.palette.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 500,
                letterSpacing: "0.25px",
                mt: 0.5,
              }}>
              AI Medical Mentoring System
            </Typography>
          </Box>

          {/* Form Body */}
          <Box sx={{ px: { xs: 3, sm: 4 }, pb: { xs: 4, sm: 5 } }}>
            <Alert severity="info" sx={{ mb: 3 }}>
              Welcome! You've been invited to join AIMMS.
            </Alert>

            {submitError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {submitError}
              </Alert>
            )}

            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <UATextField
                fullWidth
                label="Email Address"
                value={email}
                disabled
                helperText="This email is pre-filled from your invitation"
              />

              <UATextField
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your full name"
                required
                autoFocus
              />

              <UATextField
                fullWidth
                type={showPassword ? "text" : "password"}
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                helperText="Minimum 8 characters"
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <UATextField
                fullWidth
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                error={confirmPassword.length > 0 && password !== confirmPassword}
                helperText={
                  confirmPassword.length > 0 && password !== confirmPassword
                    ? "Passwords do not match"
                    : ""
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end">
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={submitting || !name || !password || password !== confirmPassword}
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
                {submitting ? (
                  <FlexCenterVertical sx={{ gap: 1 }}>
                    <CircularProgress size={20} sx={{ color: theme.palette.background.paper }} />
                    Creating Account...
                  </FlexCenterVertical>
                ) : (
                  "Create Account"
                )}
              </Button>
            </Box>
          </Box>

          {/* Footer */}
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
              Already have an account?
            </Typography>
            <Link
              href="/login"
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
              Sign in
            </Link>
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
