import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6175,
    host: true,
    allowedHosts: ['localhost', '192.168.20.25'],
  },
})
