import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    server: {
      host: true,
      proxy: {
        '/api': {
          target: env.VITE_API_TARGET || 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        },
        '/uploads': {
           target: env.VITE_API_TARGET || 'http://localhost:3002',
           changeOrigin: true,
           secure: false,
        }
      }
    }
  }
})
