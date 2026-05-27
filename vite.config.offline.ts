import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

/**
 * Build config for the OFFLINE PDV bundle.
 * - Defines VITE_OFFLINE_BUILD=true so client.ts uses the offline shim
 * - Outputs to dist-offline/ with relative paths (served by local Express)
 * - No PWA plugin (irrelevant in fully-local context)
 */
export default defineConfig({
  base: './',
  define: {
    'import.meta.env.VITE_OFFLINE_BUILD': JSON.stringify('true'),
  },
  build: {
    outDir: 'dist-offline',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-charts': ['recharts'],
          'html2pdf': ['html2pdf.js'],
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
