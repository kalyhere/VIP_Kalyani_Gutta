/**
 * Notification Store Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useNotificationStore } from "../notificationStore"

describe("notificationStore", () => {
  beforeEach(() => {
    // Reset store state
    useNotificationStore.setState({ notifications: [] })

    // Mock timers
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe("Initial State", () => {
    it("should have empty notifications array initially", () => {
      const state = useNotificationStore.getState()
      expect(state.notifications).toEqual([])
    })
  })

  describe("notify", () => {
    it("should add a notification with default options", () => {
      const { notify } = useNotificationStore.getState()
      notify("Test message")

      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0]).toMatchObject({
        message: "Test message",
        type: "info",
        duration: 6000,
      })
      expect(state.notifications[0].id).toBeTruthy()
    })

    it("should add a notification with custom type", () => {
      const { notify } = useNotificationStore.getState()
      notify("Error message", { type: "error" })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].type).toBe("error")
    })

    it("should add a notification with custom duration", () => {
      const { notify } = useNotificationStore.getState()
      notify("Custom duration", { duration: 3000 })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].duration).toBe(3000)
    })

    it("should add multiple notifications", () => {
      const { notify } = useNotificationStore.getState()
      notify("First message")
      notify("Second message")
      notify("Third message")

      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(3)
      expect(state.notifications[0].message).toBe("First message")
      expect(state.notifications[1].message).toBe("Second message")
      expect(state.notifications[2].message).toBe("Third message")
    })

    it("should auto-remove notification after duration", () => {
      const { notify } = useNotificationStore.getState()
      notify("Auto-remove test", { duration: 1000 })

      let state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(1)

      // Fast-forward time by 1000ms
      vi.advanceTimersByTime(1000)

      state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(0)
    })

    it("should generate unique IDs for each notification", () => {
      const { notify } = useNotificationStore.getState()
      notify("First")
      notify("Second")
      notify("Third")

      const state = useNotificationStore.getState()
      const ids = state.notifications.map((n) => n.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })
  })

  describe("removeNotification", () => {
    it("should remove a specific notification by ID", () => {
      const { notify, removeNotification } = useNotificationStore.getState()
      notify("First message")
      notify("Second message")
      notify("Third message")

      let state = useNotificationStore.getState()
      const secondId = state.notifications[1].id

      removeNotification(secondId)

      state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(2)
      expect(state.notifications[0].message).toBe("First message")
      expect(state.notifications[1].message).toBe("Third message")
    })

    it("should do nothing if notification ID does not exist", () => {
      const { notify, removeNotification } = useNotificationStore.getState()
      notify("Test message")

      removeNotification("non-existent-id")

      const state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(1)
    })

    it("should handle removing from empty notifications array", () => {
      const { removeNotification } = useNotificationStore.getState()
      removeNotification("some-id")

      const state = useNotificationStore.getState()
      expect(state.notifications).toEqual([])
    })
  })

  describe("Auto-removal timing", () => {
    it("should respect different durations for different notifications", () => {
      const { notify } = useNotificationStore.getState()
      notify("Fast notification", { duration: 1000 })
      notify("Medium notification", { duration: 2000 })
      notify("Slow notification", { duration: 3000 })

      let state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(3)

      // After 1000ms, first notification should be removed
      vi.advanceTimersByTime(1000)
      state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(2)
      expect(state.notifications[0].message).toBe("Medium notification")

      // After 2000ms total, second notification should be removed
      vi.advanceTimersByTime(1000)
      state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(1)
      expect(state.notifications[0].message).toBe("Slow notification")

      // After 3000ms total, all should be removed
      vi.advanceTimersByTime(1000)
      state = useNotificationStore.getState()
      expect(state.notifications).toHaveLength(0)
    })
  })

  describe("Notification types", () => {
    it("should support success type", () => {
      const { notify } = useNotificationStore.getState()
      notify("Success!", { type: "success" })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].type).toBe("success")
    })

    it("should support warning type", () => {
      const { notify } = useNotificationStore.getState()
      notify("Warning!", { type: "warning" })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].type).toBe("warning")
    })

    it("should support error type", () => {
      const { notify } = useNotificationStore.getState()
      notify("Error!", { type: "error" })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].type).toBe("error")
    })

    it("should support info type", () => {
      const { notify } = useNotificationStore.getState()
      notify("Info!", { type: "info" })

      const state = useNotificationStore.getState()
      expect(state.notifications[0].type).toBe("info")
    })
  })
})
