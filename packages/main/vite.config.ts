// packages/main/vite.config.ts
import { builtinModules } from 'node:module'
import { defineConfig } from 'vite'

export default defineConfig({
  envDir: process.cwd(),
  root: __dirname,
  base: './',

  build: {
    outDir: '../../dist/main',
    emptyOutDir: true,
    target: 'node14',
    sourcemap: true,

    // Build main in "lib" mode of Vite.
    lib: {
      // Define the entry-point.
      entry: './src/index.ts',
      // Define the build format, Electron support CJS.
      formats: ['cjs']
    },

    rollupOptions: {
      external: [
        // Once again exclude Electron from build output.
        'electron',
        'ffi-napi',
        'ref-napi',
        // Exclude Node builtin modules.
        ...builtinModules.flatMap((p) => [p, `node:${p}`])
      ],
      output: {
        // Will be named `index.cjs`.
        entryFileNames: '[name].cjs'
      }
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false
      }
    }
  }
})
