import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

const port = Number(process.env.PORT) || 5178;
const base = process.env.BASE_PATH || '/';

export default defineConfig({
  plugins: [tailwindcss(), react()],
  base,
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port,
    host: '0.0.0.0',
    allowedHosts: 'all',
  },
});
