import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(),],
  base: './',
  define: {
    global: "window",
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/socket.io': {
        target: 'https://meetup-instance.onrender.com',
        ws: true,
        changeOrigin: true
      },
      '/api': {
        target: 'https://meetup-instance.onrender.com',
        changeOrigin: true
      }
    },
  }
})
