import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  
  // ✅ BUILD OPTIMIZATIONS
  build: {
    target: 'es2020', // Modern browsers only = smaller bundles
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Two-pass compression for better results
      },
      mangle: {
        safari10: true,
      },
    },
    
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom'],
          
          // Firebase - SPLIT INTO SEPARATE CHUNKS (lazy loading!)
          'firebase-core': ['firebase/app'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-auth': ['firebase/auth'],
          'firebase-storage': ['firebase/storage'],
          
          // UI libraries
          'ui-icons': ['lucide-react'],
          'ui-toast': ['sonner'],
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
          ],
          
          // Routing
          'routing': ['react-router-dom'],
          
          // Maps (heavy library!)
          'maps': ['leaflet', 'react-leaflet'],
        },
        
        // Better file naming for browser caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      }
    },
    
    chunkSizeWarningLimit: 1000,
    sourcemap: false, // Set to true for debugging in production
  },
  
  // ✅ DEPENDENCY OPTIMIZATION
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
    ],
    esbuildOptions: {
      target: 'esnext'
    }
  },
  
  server: {
    port: 5173,
    open: true,
    hmr: { overlay: false },
    host: true, // Enable network access
  },
  
  preview: {
    port: 4173,
    open: true,
    host: true,
  }
});