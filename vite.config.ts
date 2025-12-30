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
        '/auth': 'http://localhost:5000',
        '/user': 'http://localhost:5000',
        '/summary': 'http://localhost:5000',
        '/income': 'http://localhost:5000',
        '/expenses': 'http://localhost:5000',
        '/savings': 'http://localhost:5000',
        '/investments': 'http://localhost:5000',
        '/reports': 'http://localhost:5000',
        '/notifications': 'http://localhost:5000',
        '/ai-insights': 'http://localhost:5000',
        '/backup': 'http://localhost:5000',
        '/api': 'http://localhost:5000',
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
