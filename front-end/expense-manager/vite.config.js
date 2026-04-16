import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // FIX: This ensures all assets are referenced from the root (e.g., /assets/index.js)
  // instead of a relative path which can cause 404s on sub-routes.
  base: '/', 
  
  server: {
    host: true, 
    port: 5173,
    strictPort: true,
  },
  
  build: {
    // This ensures the output folder matches what we use in the Dockerfile
    outDir: 'dist',
    // Generates a manifest file which is good practice for production
    manifest: true,
  }
})