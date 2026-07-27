import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  plugins: [
    react({
      // Babel transform mai rapid
      babel: {
        plugins: [],
      },
    }),
  ],

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor:  ['react', 'react-dom'],
          router:  ['react-router-dom'],
          lucide:  ['lucide-react'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
    // Minificare agresivă în producție
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,    // elimină toate console.log
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.warn'],
      },
      mangle: true,
    },
    // CSS separat — se încarcă mai rapid
    cssCodeSplit: true,
    // Sourcemaps doar în dev
    sourcemap: false,
    // Asset-uri mici inline — mai puține requesturi
    assetsInlineLimit: 4096,
  },

  css: {
    devSourcemap: false,
  },

  // Server dev mai rapid
  server: {
    port: process.env.PORT ? Number(process.env.PORT) : 5173,
    // iOS Safari face cache agresiv pe LAN → forțăm no-store ca telefonul
    // să ia mereu CSS/JS proaspăt (altfel „nu se vede nicio schimbare pe mobil").
    headers: {
      'Cache-Control': 'no-store',
    },
    hmr: {
      overlay: false,
    },
  },
});
