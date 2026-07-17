import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/unit/**/*.{test,spec}.ts'],
  },
  server: {
    port: 5173,
    host: true,
  },
  preview: {
    host: '127.0.0.1',
    port: 4175,
    // Cloudflare Tunnel forwards external Host header
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/echarts') || id.includes('node_modules/zrender')) return 'echarts'
          if (id.includes('node_modules/pixi.js') || id.includes('node_modules/@pixi')) return 'pixi'
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) return 'react'
          if (id.includes('node_modules/immer')) return 'immer'
        },
      },
    },
  },
})
