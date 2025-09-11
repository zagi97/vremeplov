import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()]
    }
  },
  build: {
    target: 'es2015', 
    minify: 'terser', // koristi terser, ali moraš instalirati paket
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['lucide-react', 'sonner'],
          routing: ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 5173,
    open: true,
    hmr: { overlay: false }
  },
  preview: {
    port: 4173,
    open: true
  }
});
