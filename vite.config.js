import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // React core - rarely changes
          'vendor-react': ['react', 'react-dom'],
          // PDF processing - large library
          'vendor-pdf': ['pdfjs-dist'],
          // Icons library
          'vendor-icons': ['lucide-react'],
        }
      }
    },
    // Increase warning limit slightly (optional)
    chunkSizeWarningLimit: 600
  }
})
