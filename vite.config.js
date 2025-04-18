import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src')
    }
  },
  optimizeDeps: {
    exclude: ['pyodide'],
    include: ['react', 'react-dom']
  },
  server: {
    port: 3000,                // Use port 3000 instead of 5173
    strictPort: false,         // Allow fallback to another port if 3000 is occupied
    host: true,                // Listen on all addresses
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['pyodide']
    }
  }
});