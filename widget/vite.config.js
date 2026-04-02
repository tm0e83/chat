import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  /**
   * Build-Konfiguration für die IIFE-Bundle.
   * Das Widget wird als einzelne selbstausführende Datei (widget.js) gebaut,
   * die per <script>-Tag ohne Modul-System auf beliebigen Seiten eingebunden werden kann.
   */
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      // Globaler Name: window.SupportChat
      name: 'SupportChat',
      fileName: 'widget',
      // IIFE = Immediately Invoked Function Expression
      // Kein import/export, funktioniert in allen Browsern ohne Bundler
      formats: ['iife'],
    },
    rollupOptions: {
      external: [],
      treeshake: false,
      output: {
        hoistTransitiveImports: false,
        generatedCode: { constBindings: false },
      },
    },
    minify: false,
    // Breite Browser-Kompatibilität
    target: 'es2018',
    // Output-Verzeichnis
    outDir: 'dist',
  },

  // Damit Firebase (das process.env prüft) im Browser funktioniert
  define: {
    'process.env.NODE_ENV': '"production"',
  },

  // .env-Datei aus dem Projekt-Root lesen
  envDir: '../',

  /**
   * Test-Konfiguration (Vitest).
   * jsdom simuliert eine Browser-Umgebung für DOM-Tests.
   */
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/__tests__/**'],
    },
  },
})
