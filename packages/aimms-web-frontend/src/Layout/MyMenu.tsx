import { Menu, useSidebarState, useGetIdentity } from "react-admin"
import { useEffect, useState, Fragment } from "react"
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
import { alpha, useTheme } from "@mui/material/styles"
import { Box, Typography, Divider, Tooltip } from "@mui/material"

interface MenuItem {
  id: string
  to: string
  primaryText: string
  leftIcon: JSX.Element
  disabled?: boolean
  roles?: string[]
  adminOnly?: boolean
  section?: string
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

// Section Header
const SectionHeader = ({ title, isFirst = false }: { title: string; isFirst?: boolean }) => {
  const theme = useTheme()

  return (
    <Box
      sx={{
        px: 2,
        pt: isFirst ? 1.5 : 2.5,
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

export const MyMenu = () => {
  const theme = useTheme()
  const { identity } = useGetIdentity()
  const [open] = useSidebarState()
  const [activeItemId, setActiveItemId] = useState<string>("")
  const isFaculty = identity?.role === "faculty"
  const isStudent = identity?.role === "student"
  const isAdmin = identity?.role === "admin"

  // Function to handle menu item clicks
  const handleMenuItemClick = (itemId: string) => {
    setActiveItemId(itemId)
  }

  // Function to check if a menu item is currently active
  const isItemActive = (itemId: string) => activeItemId === itemId

  // Function to truncate text if longer than 16 characters
  const truncateText = (text: string, maxLength: number = 16) =>
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
            roles: ["student"],
            section: "dashboard",
          },
          {
            id: "report-history",
            to: "/report-history",
            primaryText: "Past Reports",
            leftIcon: <AssessmentIcon />,
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
      adminOnly: true,
      section: "tools",
    },
    {
      id: "aimhei",
      to: "/aimhei",
      primaryText: "AIMHEI",
      leftIcon: <SmartToyIcon />,
      adminOnly: true,
      section: "tools",
    },
    {
      id: "suture",
      to: "/suture",
      primaryText: "Suture Analysis",
      leftIcon: <BiotechIcon />,
      adminOnly: true,
      section: "tools",
    },
    {
      id: "virtual_patient_cases",
      to: "/admin/virtual-patient-cases",
      primaryText: "Virtual Patient Cases",
      leftIcon: <FaceIcon />,
      adminOnly: true,
      section: "tools",
    },

    // Coming Soon
    {
      id: "debriefing",
      to: "#",
      primaryText: "Debriefing Tool",
      leftIcon: <IntegrationInstructionsIcon />,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "ai_mi",
      to: "#",
      primaryText: "AI-MI",
      leftIcon: <QuestionAnswerIcon />,
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "ombudsman",
      to: "#",
      primaryText: "Ombudsman Project",
      leftIcon: <BalanceIcon />,
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "procedural_assessment",
      to: "#",
      primaryText: "Procedural Assessment",
      leftIcon: <AssessmentIcon />,
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "ipe",
      to: "#",
      primaryText: "IPE",
      leftIcon: <SchoolIcon />,
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
    {
      id: "oral_presentation",
      to: "#",
      primaryText: "Oral Presentation",
      leftIcon: <RecordVoiceOverIcon />,
      disabled: true,
      adminOnly: true,
      section: "coming-soon",
    },
  ]

  // Filter and group items by section
  const filteredItems = menuItems.filter((item) => {
    // Check admin-only items
    if (item.adminOnly && !isAdmin) return false

    // Check role-based items
    if (item.roles && identity?.role) {
      return item.roles.includes(identity.role)
    }

    // If no roles specified and not admin-only, show to all
    if (!item.roles && !item.adminOnly) return true

    // Default to showing for admins
    return isAdmin
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
    const currentPath = window.location.hash.replace("#", "") || window.location.pathname
    // Find the menu item that matches the current path
    const matchingItem = menuItems.find((item) => item.to === currentPath)
    if (matchingItem) {
      setActiveItemId(matchingItem.id)
    }
  }, [menuItems])

  return (
    <Menu
      sx={{
        // Container styling - responsive width based on sidebar state
        width: open ? "380px" : "64px",
        background: `
          linear-gradient(135deg,
            ${alpha(theme.palette.primary.light, 0.02)} 0%,
            ${alpha(theme.palette.secondary.main, 0.04)} 100%
          )
        `,
        borderRight: `1px solid ${theme.palette.divider}`,
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",

        // Shadow styling
        boxShadow: `2px 0 8px ${alpha(theme.palette.text.primary, 0.04)}`,

        // Menu list styling
        "& .MuiList-root": {
          padding: "12px 0",
          background: "transparent",
        },

        // Menu item styling
        "& .MuiMenuItem-root, & .MuiListItem-root, & .MuiButtonBase-root": {
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
          boxShadow: open ? `0 1px 3px ${alpha(theme.palette.text.primary, 0.04)}` : "none !important",

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
              transform: open ? "scale(1.1) rotate(2deg) !important" : "scale(1.2) !important",
            },

            // Text hover styling
            "& .MuiTypography-root, & span": {
              color: `${theme.palette.secondary.main} !important`,
              fontWeight: "600 !important",
            },
          },

          // Active state with red-blue gradient
          '&.Mui-selected, &[aria-current="page"], &.menu-item-active': {
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
            "& .MuiTypography-root, & span": {
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
        },

        // Icon styling
        "& .MuiSvgIcon-root": {
          color: `${theme.palette.text.secondary} !important`,
          fontSize: "1.25rem !important",
          marginRight: open ? "16px !important" : "0 !important",
          marginLeft: open ? "0 !important" : "0 !important",
          transition: "all 0.25s cubic-bezier(0.4, 0, 0.2, 1) !important",
          flexShrink: 0,
        },

        // Text styling
        "& .MuiTypography-root, & span": {
          color: `${theme.palette.text.primary} !important`,
          fontSize: "0.875rem !important",
          fontWeight: "500 !important",
          lineHeight: "1.4 !important",
          transition: "all 0.2s ease !important",
        },

        // Disabled items styling
        '& .MuiMenuItem-root[aria-disabled="true"], & .MuiListItem-root[aria-disabled="true"]': {
          opacity: "0.6 !important",
          pointerEvents: "none !important",

          "& .MuiSvgIcon-root": {
            color: `${theme.palette.text.disabled} !important`,
          },

          "& .MuiTypography-root, & span": {
            color: `${theme.palette.text.disabled} !important`,
          },
        },
      }}>
      {groupedItems.map((section, sectionIndex) => (
        <Fragment key={section.title}>
          {open && <SectionHeader title={section.title} isFirst={sectionIndex === 0} />}
          {section.items.map((item) => {
            const menuItem = (
              <Menu.Item
                key={item.id}
                to={item.to}
                primaryText={open ? truncateText(item.primaryText) : undefined}
                leftIcon={item.leftIcon}
                disabled={item.disabled}
                className={isItemActive(item.id) ? "menu-item-active" : ""}
                onClick={() => handleMenuItemClick(item.id)}
                sx={{
                  opacity: item.disabled ? 0.6 : 1,
                  pointerEvents: item.disabled ? "none" : "auto",
                }}
              />
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
        </Fragment>
      ))}
    </Menu>
  )
}
