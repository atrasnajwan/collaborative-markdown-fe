import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  return {
    plugins: [react()],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: true
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:3000')
    }
  }
}) 