import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

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
    resolve: {
      alias: {
        // monaco-editor binding for y-monaco
        'monaco-editor/esm/vs/editor/editor.api.js': path.resolve(
          __dirname,
          'src/monaco-shim.ts'
        ),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // UI Framework
              if (id.includes('@mui') || id.includes('@emotion')) {
                return 'vendor-ui'
              }
              // Markdown Parsing
              if (
                id.includes('markdown-it') ||
                id.includes('markdown-it-emoji') ||
                id.includes('dompurify') ||
                id.includes('prism')
              ) {
                return 'markdown-engine'
              }

              // Collaboration logic
              if (id.includes('/node_modules/yjs/')) {
                return 'collab-yjs'
              }
              if (id.includes('/node_modules/y-websocket/')) {
                return 'collab-websocket'
              }
              if (id.includes('/node_modules/y-protocols/')) {
                return 'collab-protocols'
              }
              if (id.includes('/node_modules/y-monaco/')) {
                return 'collab-monaco'
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
