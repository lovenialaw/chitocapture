import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const viewerDir = path.dirname(fileURLToPath(import.meta.url))
const workspaceRoot = path.resolve(viewerDir, '..')

export default defineConfig({
  // GitHub Pages hosts this repository below /chitocapture/; local Vite stays at /.
  base: process.env.GITHUB_ACTIONS === 'true' ? '/chitocapture/' : '/',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(viewerDir, 'src') },
  },
  server: {
    fs: { allow: [workspaceRoot] },
  },
})
