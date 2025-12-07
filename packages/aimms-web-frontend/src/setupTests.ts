import { vi } from "vitest"
import { cleanup } from "@testing-library/react"
import "@testing-library/jest-dom/vitest"
import "./__tests__/utils/mswServer" // Setup MSW for API mocking

// Mock MUI DateTimePicker and LocalizationProvider globally
vi.mock("@mui/x-date-pickers/DateTimePicker", () => ({
  DateTimePicker: vi.fn(() => null),
}))

vi.mock("@mui/x-date-pickers/LocalizationProvider", () => ({
  LocalizationProvider: vi.fn(({ children }) => children),
}))

vi.mock("@mui/x-date-pickers/AdapterDayjs", () => ({
  AdapterDayjs: vi.fn(),
}))

// Mock environment variables
vi.mock("import.meta.env", () => ({
  VITE_OPENAI_API_KEY: "test-api-key",
  VITE_API_URL: "http://localhost:8000",
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
})

// Automatically run cleanup after each test
afterEach(() => {
  cleanup()
  localStorage.clear() // Clear localStorage between tests
  vi.clearAllMocks()
})
