import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/llm_workbench/',
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
})