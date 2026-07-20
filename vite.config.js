import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Gaatha prototype - single-page React app, no backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    open: false,
  },
})
