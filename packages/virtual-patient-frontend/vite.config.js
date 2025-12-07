import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Only expose specific environment variables we need
    'process.env.VITE_PICOVOICE_ACCESS_KEY': JSON.stringify(process.env.VITE_PICOVOICE_ACCESS_KEY)
  },
  optimizeDeps: {
    // Force Vite to bundle THREE.js as a single instance
    include: ['three']
  },
  build: {
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          // Bundle THREE.js separately to avoid conflicts
          'three': ['three']
        }
      }
    }
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
})
