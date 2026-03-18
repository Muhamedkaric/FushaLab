import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id: string) => {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) return 'vendor-react'
          if (id.includes('node_modules/@mui') || id.includes('node_modules/@emotion')) return 'vendor-mui'
          if (id.includes('node_modules/@tanstack')) return 'vendor-router'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
        },
      },
    },
  },
})
