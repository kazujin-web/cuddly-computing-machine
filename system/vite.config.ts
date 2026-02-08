import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api/preview-sf9-page': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
          },
          '/api/generate-excel': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
          },
          '/resources': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
          },
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
          '/uploads': {
            target: 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});