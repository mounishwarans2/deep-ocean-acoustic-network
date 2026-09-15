import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Dev proxy: frontend calls /api/* -> Express notify backend on :5000.
    // No backend URLs are hardcoded in React source.
    proxy: {
      '/api': 'http://localhost:5000',
    },
  },
})
