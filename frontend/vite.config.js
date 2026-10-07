import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime -- cached independently across all page chunks
          'vendor-react': ['react', 'react-dom'],
          // Client-side routing
          'vendor-router': ['react-router-dom'],
          // Icon library
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Raise the warn threshold slightly to reduce noise for moderately-sized page chunks
    chunkSizeWarningLimit: 600,
  },
});
