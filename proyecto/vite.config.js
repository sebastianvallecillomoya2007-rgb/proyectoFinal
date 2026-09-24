import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/bd.json', '**/bd.json.*', '**/server/data/**'] }, proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } } },
  preview: { proxy: { '/api': { target: 'http://127.0.0.1:3001', changeOrigin: false } } },
})
