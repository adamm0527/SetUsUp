import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  root: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url)),
      '#root': fileURLToPath(new URL('../src', import.meta.url)),
      'react': fileURLToPath(new URL('../node_modules/react', import.meta.url)),
      'react-dom': fileURLToPath(new URL('../node_modules/react-dom', import.meta.url))
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
  }
})
