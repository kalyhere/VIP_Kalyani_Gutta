/**
 * Notification Store (Zustand)
 * Replaces NotificationContext for state management
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { AlertColor } from "@mui/material"

interface Notification {
  id: string
  message: string
  type: AlertColor
  duration?: number
}

interface NotificationState {
  notifications: Notification[]
}

interface NotificationActions {
  notify: (message: string, options?: { type?: AlertColor; duration?: number }) => void
  removeNotification: (id: string) => void
}

type NotificationStore = NotificationState & NotificationActions

// Counter for generating unique IDs
let notificationIdCounter = 0

export const useNotificationStore = create<NotificationStore>()(
  devtools(
    (set) => ({
      // Initial state
      notifications: [],

      // Actions
      notify: (message: string, options?: { type?: AlertColor; duration?: number }) => {
        const id = `notification-${Date.now()}-${++notificationIdCounter}`
        const notification: Notification = {
          id,
          message,
          type: options?.type || "info",
          duration: options?.duration || 6000,
        }

        set((state) => ({
          notifications: [...state.notifications, notification],
        }))

        // Auto-remove notification after duration
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter((n) => n.id !== id),
          }))
        }, notification.duration)
      },

      removeNotification: (id: string) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }))
      },
    }),
    { name: "NotificationStore" }
  )
)
