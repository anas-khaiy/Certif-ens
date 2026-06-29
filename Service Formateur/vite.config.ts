import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6174,
    host: true,
    allowedHosts: ['192.168.20.25', '192.168.20.25'],
  },
})
