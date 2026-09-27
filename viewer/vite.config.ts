import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const viewerDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(viewerDir, '..')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(viewerDir, 'src') },
  },
  server: {
    fs: { allow: [workspaceRoot] },
  },
})
