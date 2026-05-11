import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Pre-transforming files can speed up the first page load
    warmup: {
      clientFiles: [
        './src/main.jsx',
        './src/App.jsx',
        './src/components/LandingPage.jsx'
      ]
    }
  },
  optimizeDeps: {
    // Explicitly include heavy dependencies to ensure they are pre-bundled early
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react', 'cobe']
  }
})
