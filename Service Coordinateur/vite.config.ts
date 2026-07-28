import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/coordinateur/',
  server: {
    port: 6176,
    host: true,
    allowedHosts: ['localhost', 'localhost'],
  },
})
