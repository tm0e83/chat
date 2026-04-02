import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],

  // Alias für saubere Imports: "@/components/Foo" statt "../../components/Foo"
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },

  // .env-Datei aus dem Projekt-Root lesen
  envDir: '../',

  build: {
    outDir: 'dist',
    sourcemap: true,
  },

  /**
   * Test-Konfiguration (Vitest + React Testing Library).
   */
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.jsx'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: ['src/__tests__/**', 'src/main.jsx'],
    },
  },
})
