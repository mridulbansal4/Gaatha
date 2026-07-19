import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// ArthSetu prototype - single-page React app, no backend.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5180,
    open: false,
  },
})
