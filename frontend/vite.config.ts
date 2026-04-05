import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Forward /api/* to the Express backend during development
      '/api': {
        target:      'http://localhost:3001',
        changeOrigin: true,
        secure:      false,
      },
    },
  },
  build: {
    outDir:          'dist',
    sourcemap:       false,
    rollupOptions: {
      output: {
        // Split large vendor chunks for better caching
        manualChunks: {
          react:    ['react', 'react-dom', 'react-router-dom'],
          query:    ['@tanstack/react-query'],
          charts:   ['recharts'],
        },
      },
    },
  },
});
