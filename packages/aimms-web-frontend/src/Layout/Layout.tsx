import type { ReactNode } from "react"
import {
  CheckForApplicationUpdate,
  Layout as RALayout,
  usePermissions,
  useGetIdentity,
} from "react-admin"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import MyAppBar from "./AppBar"
import { MyMenu } from "./MyMenu"

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { isLoading: permissionsLoading, permissions } = usePermissions()
  const { identity, isLoading: identityLoading } = useGetIdentity()

  // Use both permissions and identity to determine if we should show the menu
  // This ensures the sidebar loads immediately after login for admin users
  const getUserRole = () => {
    if (permissions) {
      return permissions
    }
    if (identity?.role) {
      return identity.role
    }
    return null
  }

  const userRole = getUserRole()
  const isLoading = permissionsLoading || identityLoading

  // Show menu for admin users (not students or faculty)
  const showMenu = !isLoading && userRole && userRole !== "student" && userRole !== "faculty"

  if (isLoading) {
    return (
      <RALayout appBar={MyAppBar}>
        {/* Optional: Add a loading indicator here */}
        {children}
        <CheckForApplicationUpdate />
        <ReactQueryDevtools initialIsOpen={false} />
      </RALayout>
    )
  }

  // Define a dummy component that renders nothing for the hidden sidebar case
  const HiddenSidebar = () => <></>

  return (
    <RALayout
      appBar={MyAppBar}
      menu={MyMenu}
      // Conditionally render the sidebar component itself
      // Pass undefined to use the default Sidebar when showMenu is true
      // Pass the dummy component when showMenu is false
      sidebar={showMenu ? undefined : HiddenSidebar}
      // Keep conditional style override for content margin
      sx={
        !showMenu
          ? {
              "& .RaLayout-content": {
                marginLeft: 0,
                // paddingLeft: 0, // Uncomment if margin alone is not enough
              },
              "& .RaAppBar-menuButton": {
                display: "none",
              },
              "& .RaAppBar-toolbar": {
                padding: "0 16px",
              },
            }
          : {}
      }>
      {children}
      <CheckForApplicationUpdate />
      <ReactQueryDevtools initialIsOpen={false} />
    </RALayout>
  )
}
