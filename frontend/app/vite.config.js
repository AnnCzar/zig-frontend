import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/zig-frontend/',  // ← Tylko to jest ważne dla GitHub Pages
  server: {
    port: 5174  // ← Zachowaj swój port (opcjonalne)
  }
})
