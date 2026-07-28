import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/formateur/',
  server: {
    port: 6174,
    host: true,
    allowedHosts: ['localhost', 'localhost'],
  },
})
