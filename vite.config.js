import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {},
  build: {
    rollupOptions: {
      output: {
        // Vendor libs mají jiný release-cyklus než aplikační kód — vlastní
        // chunky znamenají, že deploy appky neinvaliduje cache celého vendoru
        // a prohlížeč je stahuje paralelně.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'motion': ['framer-motion'],
          'i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector', 'i18next-http-backend'],
        },
      },
    },
  },
})
