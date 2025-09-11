import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import postcss from 'postcss';
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
      plugins: [
        tailwindcss(),
        autoprefixer(),
      ],
    },
  },
  
  // Build optimizacije
  build: {
    target: 'es2015', // Bolja browser podrška
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Ukloni console.log u production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // Code splitting za bolje caching
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['lucide-react', 'sonner'],
          routing: ['react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000 // Povećaj limit da se ne žali na chunks
  },
  
  // Development optimizacije  
  server: {
    port: 5173,
    open: true,
    hmr: {
      overlay: false // Disable the error overlay temporarily
    }
  },
  
  // Preview optimizacije
  preview: {
    port: 4173,
    open: true
  }
});