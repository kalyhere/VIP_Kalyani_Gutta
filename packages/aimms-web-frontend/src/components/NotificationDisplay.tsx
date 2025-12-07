/**
 * Notification Display Component
 * Renders notifications from the notification store
 */

import React from "react"
import { Snackbar, Alert } from "@mui/material"
import { useNotificationStore } from "@/stores/notificationStore"

export const NotificationDisplay: React.FC = () => {
  const notifications = useNotificationStore((state) => state.notifications)
  const removeNotification = useNotificationStore((state) => state.removeNotification)

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open
          autoHideDuration={notification.duration}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: "bottom", horizontal: "left" }}>
          <Alert
            onClose={() => removeNotification(notification.id)}
            severity={notification.type}
            variant="filled"
            sx={{ width: "100%" }}>
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  )
}
