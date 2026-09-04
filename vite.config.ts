import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    proxy: {
      // Repassa todas as chamadas /api/* para o backend em 8080. Assim o
      // navegador enxerga o frontend e o backend na mesma origem (5173),
      // o que dispensa configuração de CORS em desenvolvimento e permite
      // que o cookie de sessão siga automaticamente.
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
});
