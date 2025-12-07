import React, { useState, ReactNode } from "react"
import { Box, CssBaseline, useTheme, useMediaQuery } from "@mui/material"
import { useAuthStore } from "../stores/authStore"
import CustomAppBar from "./CustomAppBar"
import CustomMenu from "./CustomMenu"

const DRAWER_WIDTH_OPEN = 280
const DRAWER_WIDTH_CLOSED = 64

interface CustomLayoutProps {
  children: ReactNode
}

export const CustomLayout: React.FC<CustomLayoutProps> = ({ children }) => {
  const isLoading = useAuthStore((state) => state.isLoading)
  const user = useAuthStore((state) => state.user)
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  const identity = user ? { ...user, fullName: user.name || user.email } : null
  const permissions = user?.role || null

  // Show menu for admin users (not students or faculty)
  const showMenu =
    !isLoading && !!permissions && permissions !== "student" && permissions !== "faculty"

  // Mobile-first: default to closed on mobile, open for desktop admin users
  const [menuOpen, setMenuOpen] = useState(!isMobile && permissions === "admin")

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen)
  }

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />

      <CustomAppBar
        onMenuToggle={handleMenuToggle}
        showMenuButton={showMenu && (isMobile || permissions === "admin")}
      />

      {showMenu && <CustomMenu open={menuOpen} onToggle={handleMenuToggle} />}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: isMobile ? 0 : 3, // Remove padding on mobile for full screen
          pt: isMobile ? 8 : 11, // Reduced top padding on mobile
          // Ensure main content doesn't interfere with sidebar positioning
          position: "relative",
          zIndex: 1,
          minHeight: "100vh",
          backgroundColor: isMobile ? "#ffffff" : "#f5f5f5", // White background on mobile
          transition: "margin-left 0.3s ease",
          // Mobile: no margin (overlay mode), Desktop: margin for sidebar
          marginLeft: isMobile
            ? "0px"
            : showMenu
              ? menuOpen
                ? `${DRAWER_WIDTH_OPEN}px`
                : `${DRAWER_WIDTH_CLOSED}px`
              : "0px",
        }}>
        {children}
      </Box>
    </Box>
  )
}

export default CustomLayout
