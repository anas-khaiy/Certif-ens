import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 6175,
    host: true,
    allowedHosts: ['srv1674744.hstgr.cloud'],
  },
})
