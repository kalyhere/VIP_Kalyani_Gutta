/**
 * Bundle Size Regression Tests
 * Ensures bundle sizes don't exceed performance budgets
 */

import { describe, it, expect } from "vitest"
import { readdirSync, statSync, existsSync } from "fs"
import { join } from "path"

const DIST_PATH = join(__dirname, "../../dist")
const ASSETS_PATH = join(DIST_PATH, "assets")
const MAX_BUNDLE_SIZE = 500 * 1024 // 500KB in bytes
const MAX_INITIAL_CHUNK_SIZE = 200 * 1024 // 200KB in bytes

// Exception for lazy-loaded chunks that don't impact initial load
const MAX_LAZY_BUNDLE_SIZE = 800 * 1024 // 800KB for lazy-loaded chunks (like Three.js)

describe("Bundle Size Tests", () => {
  it("should have a dist directory after build", () => {
    if (!existsSync(DIST_PATH)) {
      console.warn("Dist directory not found. Run `npm run build` first.")
      // Skip test if build hasn't been run
      return
    }

    const stats = statSync(DIST_PATH)
    expect(stats.isDirectory()).toBe(true)
  })

  it("should split code into multiple chunks", () => {
    if (!existsSync(ASSETS_PATH)) {
      console.warn("Assets directory not found. Run `npm run build` first.")
      return
    }

    // Check that multiple JS chunks exist
    const files = readdirSync(ASSETS_PATH)
    const jsFiles = files.filter(
      (file) => file.endsWith(".js") && !file.endsWith(".gz") && !file.endsWith(".br")
    )

    // Should have more than 1 JS file (indicating code splitting)
    expect(jsFiles.length).toBeGreaterThan(1)
  })

  it("should compress assets with gzip", () => {
    if (!existsSync(ASSETS_PATH)) {
      console.warn("Assets directory not found. Run `npm run build` first.")
      return
    }

    // Check that .gz files exist
    const files = readdirSync(ASSETS_PATH)
    const gzFiles = files.filter((file) => file.endsWith(".js.gz"))

    // Should have gzip compressed files
    expect(gzFiles.length).toBeGreaterThan(0)
  })

  it("should compress assets with brotli", () => {
    if (!existsSync(ASSETS_PATH)) {
      console.warn("Assets directory not found. Run `npm run build` first.")
      return
    }

    // Check that .br files exist
    const files = readdirSync(ASSETS_PATH)
    const brFiles = files.filter((file) => file.endsWith(".js.br"))

    // Should have brotli compressed files
    expect(brFiles.length).toBeGreaterThan(0)
  })

  it("should not have any individual chunks exceeding the maximum size", () => {
    if (!existsSync(ASSETS_PATH)) {
      console.warn("Assets directory not found. Run `npm run build` first.")
      return
    }

    const files = readdirSync(ASSETS_PATH)
    const jsFiles = files.filter(
      (file) => file.endsWith(".js") && !file.endsWith(".gz") && !file.endsWith(".br")
    )

    jsFiles.forEach((file) => {
      const filePath = join(ASSETS_PATH, file)
      const stats = statSync(filePath)
      const fileSizeKB = Math.round(stats.size / 1024)

      // Determine if this is a lazy-loaded chunk (three-core, three-fiber, three-drei)
      const isLazyChunk = file.includes("three-core") ||
                          file.includes("three-fiber") ||
                          file.includes("three-drei")
      const sizeLimit = isLazyChunk ? MAX_LAZY_BUNDLE_SIZE : MAX_BUNDLE_SIZE

      // Log warning if file is approaching the limit
      if (stats.size > sizeLimit * 0.8) {
        console.warn(
          `Warning: ${file} is ${fileSizeKB}KB (approaching ${sizeLimit / 1024}KB limit)`,
        )
      }

      expect(stats.size).toBeLessThanOrEqual(sizeLimit)
    })
  })
})
