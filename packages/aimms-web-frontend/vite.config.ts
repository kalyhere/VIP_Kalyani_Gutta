/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";
import viteCompression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analysis - generates stats.html in dist folder
    visualizer({
      filename: "./dist/stats.html",
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
    // Gzip compression for production builds
    viteCompression({
      algorithm: "gzip",
      ext: ".gz",
    }),
    // Brotli compression for production builds
    viteCompression({
      algorithm: "brotliCompress",
      ext: ".br",
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@hooks": path.resolve(__dirname, "./src/hooks"),
      "@utils": path.resolve(__dirname, "./src/utils"),
      "@lib": path.resolve(__dirname, "./src/lib"),
      "@types": path.resolve(__dirname, "./src/types"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@contexts": path.resolve(__dirname, "./src/contexts"),
      "@constants": path.resolve(__dirname, "./src/constants"),
    },
  },
  server: {
    host: '0.0.0.0', // Allow external connections
    port: 3000, // Match Docker port mapping
    strictPort: true,
    hmr: process.env.CODESPACES ? {
      // Use the default Codespaces configuration for HMR
      // This prevents Vite from appending :3000 to forwarded URLs
    } : {
      // Normal local development HMR
      port: 3000,
    },
  },
  base: "/",
  build: {
    rollupOptions: {
      output: {
        // Let Vite handle chunking automatically to avoid initialization issues
      },
    },
    // Performance budgets
    chunkSizeWarningLimit: 500,
    reportCompressedSize: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/setupTests.ts"],
    coverage: {
      provider: 'v8',
      reporter: ["text", "json", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "node_modules/**",
        "**/node_modules/**",
        "src/setupTests.ts",
        "**/__tests__/**",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/dist/**",
        "**/coverage/**",
        "**/*.config.*",
        "**/vite.config.ts"
      ],
      all: true,
      cleanOnRerun: false,
      reportsDirectory: "./coverage",
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70
      }
    },
    deps: {
      // Fix MUI DateTimePicker ESM import issues
      inline: [/@mui/, /date-fns/]
    },
    server: {
      deps: {
        inline: [/@mui/, /date-fns/]
      }
    }
  }
});
