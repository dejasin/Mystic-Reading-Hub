import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const port = Number(process.env.PORT) || 5176;
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  plugins: [react()],
  base,
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
})
