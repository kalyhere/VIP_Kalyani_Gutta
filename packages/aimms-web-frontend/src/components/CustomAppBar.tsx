import React from "react"
import { AppBar as MuiAppBar, Toolbar, Box, Button, Typography, IconButton } from "@mui/material"
import { Menu as MenuIcon, Logout as LogoutIcon } from "@mui/icons-material"
import { useAuthStore } from "../stores/authStore"
import Logo from "../Layout/Logo"

interface CustomAppBarProps {
  onMenuToggle?: () => void
  showMenuButton?: boolean
}

export const CustomAppBar: React.FC<CustomAppBarProps> = ({
  onMenuToggle,
  showMenuButton = true,
}) => {
  const logout = useAuthStore((state) => state.logout)
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  return (
    <MuiAppBar
      position="fixed"
      color="primary"
      sx={{
        backgroundColor: "#ab0520",
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderRadius: 0,
      }}>
      <Toolbar>
        {showMenuButton && (
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={onMenuToggle}
            sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
        )}

        <Logo sx={{ maxWidth: "250px" }} />

        <Box flex="1" />

        <Button
          color="inherit"
          startIcon={<LogoutIcon sx={{ fontSize: "18px" }} />}
          onClick={handleLogout}
          sx={{
            textTransform: "none",
            minWidth: "auto",
            color: "white",
            fontSize: "0.875rem",
            fontWeight: 500,
            padding: "8px 12px",
            "&:hover": {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
            },
          }}>
          Logout
        </Button>
      </Toolbar>
    </MuiAppBar>
  )
}

export default CustomAppBar
