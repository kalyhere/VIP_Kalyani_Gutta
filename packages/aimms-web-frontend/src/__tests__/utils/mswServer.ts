/**
 * Mock Service Worker Server Setup
 * Sets up MSW for Node.js testing environment
 */

import { setupServer } from "msw/node"
import { handlers } from "./mockApiHandlers"

// Create MSW server with default handlers
export const server = setupServer(...handlers)

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" })
})

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers()
})

// Close server after all tests
afterAll(() => {
  server.close()
})
