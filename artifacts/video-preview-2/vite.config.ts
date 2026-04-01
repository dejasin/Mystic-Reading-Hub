import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const port = Number(process.env.PORT) || 5176;
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base,
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
})
