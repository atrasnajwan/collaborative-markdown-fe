import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      visualizer({
        open: false, // Auto-open the report in your browser
        filename: 'stats.html', // Name of the output file
        gzipSize: true, // Show what the size will be after compression
        brotliSize: true,
      }),
    ],
    server: {
      port: Number(env.VITE_PORT) || 5173,
      host: true,
    },
    define: {
      __API_URL__: JSON.stringify(env.VITE_API_URL || 'http://localhost:3000'),
    },
    build: {
      rollupOptions: {
        external: [/^monaco-editor/],
        output: {
          globals: {
            'monaco-editor': 'monaco',
          },
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // UI Framework
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'vendor-ui'
              }
              // Markdown Parsing
              if (
                id.includes('react-markdown') ||
                id.includes('remark') ||
                id.includes('rehype') ||
                id.includes('micromark')
              ) {
                return 'markdown-engine'
              }
              // Collaboration logic
              if (
                id.includes('yjs') ||
                id.includes('y-monaco') ||
                id.includes('y-websocket') ||
                id.includes('y-protocols')
              ) {
                return 'collab-engine'
              }
              // React core
              if (id.includes('react/') || id.includes('react-dom/')) {
                return 'vendor-react'
              }
            }
          },
        },
      },
    },
  }
})
