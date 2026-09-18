import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2022',
    // three and the two canvases are imported lazily by the components that
    // use them, so Rollup splits them out on its own: the document, the fonts
    // and the name paint without waiting for a renderer.
    chunkSizeWarningLimit: 700,
  },
})
