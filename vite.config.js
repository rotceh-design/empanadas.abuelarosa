import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Puerto propio: 5173/5174 son el default de Vite y en esta máquina ya los
  // ocupa otro proyecto (patriotas-web), así que abrir localhost:5173 abría
  // la app equivocada.
  server: {
    port: 5273,
  },
  preview: {
    port: 5274,
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react', test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/ },
            { name: 'firebase', test: /node_modules[\\/]@?firebase[\\/]/ },
            { name: 'motion', test: /node_modules[\\/](framer-motion|canvas-confetti)[\\/]/ },
          ],
        },
      },
    },
  },
})
