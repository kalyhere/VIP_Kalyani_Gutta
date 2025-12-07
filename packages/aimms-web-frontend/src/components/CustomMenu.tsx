import React, { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Tooltip,
  alpha,
  IconButton,
  Drawer,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import {
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
} from "@mui/icons-material"
import SmartToyIcon from "@mui/icons-material/SmartToy"
import ModelTrainingIcon from "@mui/icons-material/ModelTraining"
import IntegrationInstructionsIcon from "@mui/icons-material/IntegrationInstructions"
import BiotechIcon from "@mui/icons-material/Biotech"
import FaceIcon from "@mui/icons-material/Face"
import QuestionAnswerIcon from "@mui/icons-material/QuestionAnswer"
import BalanceIcon from "@mui/icons-material/Balance"
import AssessmentIcon from "@mui/icons-material/Assessment"
import SchoolIcon from "@mui/icons-material/School"
import RecordVoiceOverIcon from "@mui/icons-material/RecordVoiceOver"
import DashboardIcon from "@mui/icons-material/Dashboard"
import GroupIcon from "@mui/icons-material/Group"
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings"
import { useAuthStore } from "../stores/authStore"

interface MenuItem {
  id: string
  to: string
  primaryText: string
  leftIcon: JSX.Element
  appName: string
  disabled?: boolean
  roles?: string[]
  adminOnly?: boolean
  section?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const DRAWER_WIDTH_OPEN = 280
const DRAWER_WIDTH_CLOSED = 64

interface CustomMenuProps {
  open: boolean
  onToggle: () => void
}

// Section Header
const SectionHeader = ({ title, isFirst = false }: { title: string; isFirst?: boolean }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        px: 2,
        pt: isFirst ? 0 : 2.5,
        pb: 0.5,
        margin: "0 16px",
      }}>
      {!isFirst && (
        <Box
          sx={{
            mb: 1.5,
            height: "2px",
            background: `
            linear-gradient(90deg,
              ${alpha(theme.palette.secondary.main, 0.3)} 0%,
              ${alpha(theme.palette.secondary.light, 0.2)} 50%,
              ${alpha(theme.palette.primary.main, 0.15)} 100%
            )
          `,
            borderRadius: "1px",
            mx: 1,
          }}
        />
      )}

      <Typography
        variant="caption"
        sx={{
          fontSize: "0.625rem",
          fontWeight: 600,
          letterSpacing: "0.05em",
          color: alpha(theme.palette.secondary.main, 0.8),
          textTransform: "uppercase",
          lineHeight: 1.2,
          display: "block",
        }}>
        {title}
      </Typography>
    </Box>
  )
}

export const CustomMenu: React.FC<CustomMenuProps> = ({ open, onToggle }) => {
  const user = useAuthStore((state) => state.user)
  const identity = user ? { ...user, fullName: user.name || user.email } : null
  const navigate = useNavigate()
  const location = useLocation()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [activeItemId, setActiveItemId] = useState<string>("")

  const isFaculty = identity?.role === "faculty"
  const isStudent = identity?.role === "student"
  const isAdmin = identity?.role === "admin"

  // Define allowed apps for non-admin users
  const allowedApps = ["virtual_patient"]

  const handleMenuItemClick = (to: string, itemId: string) => {
    if (to !== "#") {
      navigate(to)
      setActiveItemId(itemId)
    }
  }

  const isItemActive = (to: string) => location.pathname === to

  const truncateText = (text: string, maxLength: number = 20) =>
    text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text

  const menuItems: MenuItem[] = [
    // Dashboard items based on role
    ...(isAdmin
      ? [
          {
            id: "admin-dashboard",
            to: "/admin-dashboard",
            primaryText: "Admin Dashboard",
            leftIcon: <DashboardIcon />,
            appName: "mcc",
            roles: ["admin"],
            section: "dashboard",
          },
        ]
      : []),
    ...(isFaculty
      ? [
          {
            id: "faculty-dashboard",
            to: "/faculty-dashboard",
            primaryText: "Faculty Dashboard",
            leftIcon: <GroupIcon />,
            appName: "virtual_patient",
            roles: ["faculty"],
            section: "dashboard",
          },
        ]
      : []),
    ...(isStudent
      ? [
          {
            id: "student-dashboard",
            to: "/student-dashboard",
            primaryText: "Student Dashboard",
            leftIcon: <DashboardIcon />,
            appName: "virtual_patient",
            roles: ["student"],
            section: "dashboard",
          },
          {
            id: "report-history",
            to: "/report-history",
            primaryText: "Past Reports",
            leftIcon: <AssessmentIcon />,
            appName: "virtual_patient",
            roles: ["student"],
            section: "dashboard",
          },
        ]
      : []),

    // Core Tools
    {
      id: "mcc",
      to: "/mcc",
      primaryText: "Medical Case Creator",
      leftIcon: <ModelTrainingIcon />,
      appName: "mcc",
      adminOnly: true,
      section: "tools",
    },
    {
      id: "aimhei",
      to: "/aimhei",
      primaryText: "AIMHEI",
      leftIcon: <SmartToyIcon />,
      appName: "aimhei",
      adminOnly: true,
      section: "tools",
    },
    {
      id: "suture",
      to: "/suture",
      primaryText: "Suture Analysis",
      leftIcon: <BiotechIcon />,
      appName: "suture",
      adminOnly: true,
      section: "tools",
    },
    // Virtual Patient - Admin case management
    {
      id: "virtual_patient_cases",
      to: "/admin/virtual-patient-cases",
      primaryText: "Virtual Patient Cases",
      leftIcon: <FaceIcon />,
      adminOnly: true,
      section: "tools",
    },

    // Debriefing Tool (Now Active!)
    {
      id: "debriefing",
      to: "/debrief",
      primaryText: "Debriefing Tool",
      leftIcon: <IntegrationInstructionsIcon />,
      appName: "debriefing",
      disabled: false,
      adminOnly: true,
      section: "tools",
    },
    {
      id: "ai_mi",
      to: "#",
      primaryText: "AI-MI",
      leftIcon: <QuestionAnswerIcon />,
      appName: "ai_mi",
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "ombudsman",
      to: "#",
      primaryText: "Ombudsman Project",
      leftIcon: <BalanceIcon />,
      appName: "ombudsman",
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "procedural_assessment",
      to: "#",
      primaryText: "Procedural Assessment",
      leftIcon: <AssessmentIcon />,
      appName: "procedural_assessment",
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "ipe",
      to: "#",
      primaryText: "IPE",
      leftIcon: <SchoolIcon />,
      appName: "ipe",
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "oral_presentation",
      to: "#",
      primaryText: "Oral Presentation",
      leftIcon: <RecordVoiceOverIcon />,
      appName: "oral_presentation",
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
  ]

  // Filter and group items by section
  const filteredItems = menuItems.filter((item) => {
    if (item.id === "admin-dashboard" && isAdmin) return true
    if (isAdmin && item.adminOnly) return true
    if (!isAdmin && !allowedApps.includes(item.appName)) return false
    if (item.roles && identity?.role) return item.roles.includes(identity.role)
    if (isAdmin) return true
    return allowedApps.includes(item.appName)
  })

  const groupedItems: MenuSection[] = [
    {
      title: "Dashboard",
      items: filteredItems.filter((item) => item.section === "dashboard"),
    },
    {
      title: "Apps & Tools",
      items: filteredItems.filter((item) => item.section === "tools"),
    },
    {
      title: "Coming Soon",
      items: filteredItems.filter((item) => item.section === "coming-soon"),
    },
  ].filter((section) => section.items.length > 0)

  // Set initial active item based on current URL
  useEffect(() => {
    const matchingItem = menuItems.find((item) => item.to === location.pathname)
    if (matchingItem) {
      setActiveItemId(matchingItem.id)
    }
  }, [location.pathname, menuItems])

  // Mobile: render as overlay drawer, Desktop: render as fixed sidebar
  if (isMobile) {
    return (
      <Drawer
        anchor="left"
        open={open}
        onClose={onToggle}
        variant="temporary"
        ModalProps={{
          keepMounted: true, // Better open performance on mobile
        }}
        sx={{
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH_OPEN,
            backgroundColor: theme.palette.background.paper,
            backgroundClip: "padding-box", // Ensure background covers the full area
            borderRight: `1px solid ${theme.palette.divider}`,
            boxShadow: `8px 0 24px ${alpha(theme.palette.text.primary, 0.12)}`,
            top: (muiTheme) => muiTheme.mixins.toolbar.minHeight, // Use exact toolbar height
            height: (muiTheme) => `calc(100vh - ${muiTheme.mixins.toolbar.minHeight}px)`,
            marginTop: "-1px", // Pull up slightly to eliminate any potential gap
            zIndex: (muiTheme) => muiTheme.zIndex.drawer + 2, // Ensure sidebar is above main content
          },
        }}>
        {/* Mobile Drawer Content */}
        <Box sx={{ padding: "16px 0 12px 0" }}>
          {groupedItems.map((section, sectionIndex) => (
            <React.Fragment key={section.title}>
              <SectionHeader title={section.title} isFirst={sectionIndex === 0} />
              {section.items.map((item) => (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() => {
                      handleMenuItemClick(item.to, item.id)
                      onToggle() // Close drawer after navigation on mobile
                    }}
                    disabled={item.disabled}
                    selected={isItemActive(item.to)}
                    sx={{
                      margin: "3px 16px",
                      borderRadius: "12px",
                      padding: "12px 18px",
                      minHeight: "48px",
                      background: theme.palette.background.paper,
                      border: "1px solid transparent",
                      transition: "all 0.2s ease",
                      "&:hover": {
                        backgroundColor: alpha(theme.palette.secondary.main, 0.04),
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.2)}`,
                      },
                      "&.Mui-selected": {
                        background: `linear-gradient(135deg,
                          ${alpha(theme.palette.primary.main, 0.08)} 0%,
                          ${alpha(theme.palette.secondary.main, 0.06)} 50%,
                          ${alpha(theme.palette.secondary.light, 0.04)} 100%
                        )`,
                        border: `1px solid ${alpha(theme.palette.secondary.main, 0.3)}`,
                        "& .MuiSvgIcon-root": {
                          color: theme.palette.secondary.main,
                        },
                        "& .MuiListItemText-primary": {
                          color: theme.palette.secondary.main,
                          fontWeight: 600,
                        },
                      },
                    }}>
                    <ListItemIcon sx={{ color: theme.palette.text.secondary, minWidth: 40 }}>
                      {item.leftIcon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.primaryText}
                      sx={{
                        "& .MuiListItemText-primary": {
                          fontSize: "0.875rem",
                          fontWeight: 500,
                        },
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </React.Fragment>
          ))}
        </Box>
      </Drawer>
    )
  }

  // Desktop: fixed sidebar
  return (
    <Box
      className="custom-sidebar"
      sx={{
        width: open ? DRAWER_WIDTH_OPEN : DRAWER_WIDTH_CLOSED,
        flexShrink: 0,
        position: "fixed",
        left: 0,
        top: 64, // Account for AppBar height
        height: "calc(100vh - 64px)",
        boxSizing: "border-box",
        background: `
          linear-gradient(135deg,
            ${alpha(theme.palette.primary.light, 0.02)} 0%,
            ${alpha(theme.palette.secondary.main, 0.04)} 100%
          )
        `,
        borderRight: `1px solid ${theme.palette.divider}`,
        boxShadow: `2px 0 8px ${alpha(theme.palette.text.primary, 0.04)}`,
        overflow: "hidden",
        transition: "width 0.3s ease",
        zIndex: 1200,
      }}>
      {/* Collapse Toggle Button */}
      <Box
        sx={{
          display: "flex",
          justifyContent: open ? "flex-end" : "center",
          p: 1,
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
        }}>
        <IconButton
          onClick={onToggle}
          sx={{
            color: theme.palette.text.secondary,
            "&:hover": {
              backgroundColor: alpha(theme.palette.secondary.main, 0.08),
              color: theme.palette.secondary.main,
            },
          }}>
          {open ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </IconButton>
      </Box>

      <List sx={{ padding: "12px 0" }}>
        {groupedItems.map((section, sectionIndex) => (
          <React.Fragment key={section.title}>
            {open && <SectionHeader title={section.title} isFirst={sectionIndex === 0} />}
            {section.items.map((item) => {
              const menuItem = (
                <ListItem key={item.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleMenuItemClick(item.to, item.id)}
                    disabled={item.disabled}
                    selected={isItemActive(item.to)}
                    sx={{
                      position: "relative",
                      margin: open ? "3px 16px" : "6px 10px",
                      borderRadius: "12px !important",
                      padding: open ? "12px 18px !important" : "12px !important",
                      justifyContent: open ? "flex-start !important" : "center !important",
                      transition: "all 0.2s ease !important",
                      color: `${theme.palette.text.primary} !important`,
                      fontSize: "0.875rem !important",
                      fontWeight: "500 !important",
                      border: open ? "1px solid transparent !important" : "none !important",
                      background: open ? `${theme.palette.background.paper} !important` : "transparent !important",
                      minHeight: open ? "44px !important" : "48px !important",
                      width: open ? "auto !important" : "48px !important",
                      display: "flex !important",
                      alignItems: "center !important",
                      boxShadow: open
                        ? `0 1px 3px ${alpha(theme.palette.text.primary, 0.04)}`
                        : "none !important",

                      // Subtle left accent indicator
                      "&::before": {
                        content: '""',
                        position: "absolute",
                        top: "50%",
                        left: "6px",
                        width: "0px",
                        height: "20px",
                        background: theme.palette.secondary.main,
                        borderRadius: "2px",
                        transform: "translateY(-50%)",
                        transition: "all 0.2s ease",
                        opacity: 0,
                        display: open ? "block" : "none",
                      },

                      // Hover effects
                      "&:hover": {
                        background: open
                          ? `${alpha(theme.palette.secondary.main, 0.04)} !important`
                          : "transparent !important",
                        border: open
                          ? `1px solid ${alpha(theme.palette.secondary.main, 0.2)} !important`
                          : "none !important",
                        transform: open ? "translateX(2px) !important" : "none !important",
                        boxShadow: open
                          ? `
                          0 2px 8px ${alpha(theme.palette.text.primary, 0.08)},
                          0 1px 3px ${alpha(theme.palette.secondary.main, 0.1)}
                        `
                          : "none !important",

                        "&::before": {
                          width: "3px",
                          opacity: 1,
                          display: open ? "block" : "none",
                        },

                        // Icon hover animation
                        "& .MuiSvgIcon-root": {
                          color: `${theme.palette.secondary.main} !important`,
                          transform: open
                            ? "scale(1.1) rotate(2deg) !important"
                            : "scale(1.2) !important",
                        },

                        // Text hover styling
                        "& .MuiListItemText-primary": {
                          color: `${theme.palette.secondary.main} !important`,
                          fontWeight: "600 !important",
                        },
                      },

                      // Active state with red-blue gradient
                      "&.Mui-selected": {
                        background: open
                          ? `
                          linear-gradient(135deg,
                            ${alpha(theme.palette.primary.main, 0.08)} 0%,
                            ${alpha(theme.palette.secondary.main, 0.06)} 50%,
                            ${alpha(theme.palette.secondary.light, 0.04)} 100%
                          ) !important
                        `
                          : "transparent !important",
                        border: open
                          ? `1px solid ${alpha(theme.palette.secondary.main, 0.3)} !important`
                          : "none !important",
                        color: `${theme.palette.secondary.main} !important`,
                        fontWeight: "600 !important",
                        transform: open ? "translateX(4px) !important" : "none !important",
                        boxShadow: open
                          ? `
                          0 3px 12px ${alpha(theme.palette.text.primary, 0.12)},
                          0 2px 6px ${alpha(theme.palette.secondary.main, 0.2)},
                          inset 0 1px 0 ${alpha(theme.palette.background.paper, 0.7)}
                        `
                          : "none !important",

                        // Gradient left accent
                        "&::before": {
                          width: "4px",
                          height: "24px",
                          background: `
                            linear-gradient(180deg,
                              ${theme.palette.primary.main} 0%,
                              ${theme.palette.secondary.main} 50%,
                              ${theme.palette.secondary.light} 100%
                            )
                          `,
                          opacity: 1,
                          borderRadius: "0 2px 2px 0",
                          boxShadow: `0 0 8px ${alpha(theme.palette.secondary.main, 0.3)}`,
                          left: "6px",
                          display: open ? "block" : "none",
                        },

                        // Active state icon
                        "& .MuiSvgIcon-root": {
                          color: `${theme.palette.secondary.main} !important`,
                          transform: open ? "scale(1.15) !important" : "scale(1.3) !important",
                          filter: `drop-shadow(0 1px 3px ${alpha(theme.palette.secondary.main, 0.3)})`,
                        },

                        // Active state text
                        "& .MuiListItemText-primary": {
                          color: `${theme.palette.secondary.main} !important`,
                          fontWeight: "600 !important",
                          textShadow: `0 1px 2px ${alpha(theme.palette.background.paper, 0.8)}`,
                        },

                        "&:hover": {
                          transform: open ? "translateX(4px) !important" : "none !important",
                          background: open
                            ? `
                            linear-gradient(135deg,
                              ${alpha(theme.palette.primary.main, 0.1)} 0%,
                              ${alpha(theme.palette.secondary.main, 0.08)} 50%,
                              ${alpha(theme.palette.secondary.light, 0.06)} 100%
                            ) !important
                          `
                            : "transparent !important",
                          boxShadow: open
                            ? `
                            0 4px 16px ${alpha(theme.palette.text.primary, 0.15)},
                            0 2px 8px ${alpha(theme.palette.secondary.main, 0.25)},
                            inset 0 1px 0 ${alpha(theme.palette.background.paper, 0.8)}
                          `
                            : "none !important",

                          "& .MuiSvgIcon-root": {
                            transform: open ? "scale(1.15) !important" : "scale(1.4) !important",
                          },
                        },
                      },

                      // Disabled items styling
                      "&.Mui-disabled": {
                        opacity: "0.6 !important",
                        pointerEvents: "none !important",

                        "& .MuiSvgIcon-root": {
                          color: `${theme.palette.text.disabled} !important`,
                        },

                        "& .MuiListItemText-primary": {
                          color: `${theme.palette.text.disabled} !important`,
                        },
                      },
                    }}>
                    <ListItemIcon
                      sx={{
                        color: theme.palette.text.secondary,
                        fontSize: "1.25rem",
                        marginRight: open ? "16px" : "0",
                        marginLeft: open ? "0" : "0",
                        transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                        flexShrink: 0,
                        minWidth: "auto",
                      }}>
                      {item.leftIcon}
                    </ListItemIcon>
                    {open && (
                      <ListItemText
                        primary={truncateText(item.primaryText)}
                        sx={{
                          "& .MuiListItemText-primary": {
                            fontSize: "0.875rem",
                            fontWeight: "500",
                            lineHeight: "1.4",
                            transition: "all 0.2s ease",
                          },
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              )

              // Wrap with tooltip when collapsed
              return !open ? (
                <Tooltip key={item.id} title={item.primaryText} placement="right" arrow>
                  <div>{menuItem}</div>
                </Tooltip>
              ) : (
                menuItem
              )
            })}
          </React.Fragment>
        ))}
      </List>
    </Box>
  )
}

export default CustomMenu
