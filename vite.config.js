import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/main.js'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'mjs' : 'cjs'}`,
    },
    rollupOptions: {
      external: ['@aws-sdk/client-ses', 'nodemailer', 'fs'],
      output: {
        exports: 'default',
        interop: 'auto'
      }
    },
    sourcemap: true,
    minify: false
  }
});
