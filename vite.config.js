import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // More specific path first — Python model server
      '/api/model': {
        target: 'http://localhost:8001',
        changeOrigin: true,
      },
      // Node.js mediamtx/streams backend
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})


