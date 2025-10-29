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
  
  // ✅ BUILD OPTIMIZATIONS - UPGRADED!
  build: {
    // ✅ UPGRADE: es2015 → es2020 (moderan browsers, manji bundle!)
    target: 'es2020', // bilo: 'es2015'
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        // ✅ NOVO: Dodatne optimizacije
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 2, // Terser će napraviti 2 prolaza za bolju kompresiju
      },
      mangle: {
        // Omogući mangle za bolje minifikacije
        safari10: true,
      },
    },
    
    rollupOptions: {
      output: {
        // ✅ OPTIMIZED: Bolji chunk splitting!
        manualChunks: {
          // React core (lightweight, often cached)
          'react-vendor': ['react', 'react-dom'],
          
          // ✅ KRITIČNO: Razdvoji Firebase module za lazy loading!
          'firebase-core': ['firebase/app'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-auth': ['firebase/auth'],
          'firebase-storage': ['firebase/storage'],
          
          // UI libraries
          'ui-icons': ['lucide-react'],
          'ui-toast': ['sonner'],
          
          // ✅ NOVO: Radix UI components (ako ih koristiš)
          'ui-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-select',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
          ],
          
          // Routing
          'routing': ['react-router-dom'],
          
          // ✅ NOVO: Maps (heavy library, treba biti separate chunk!)
          'maps': ['leaflet', 'react-leaflet'],
        },
        
        // ✅ NOVO: Bolji file naming za browser caching
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      }
    },
    
    chunkSizeWarningLimit: 1000,
    
    // ✅ NOVO: Sourcemaps (opciono, za debugging u production)
    sourcemap: false, // Stavi na true ako trebaš source maps
  },
  
  // ✅ NOVO: Optimization za dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react', // Icon library - često se koristi
    ],
    exclude: [
      // ✅ KRITIČNO: Ne pre-bundle Firebase module (lazy load ih!)
      'firebase/firestore',
      'firebase/auth',
      'firebase/storage',
    ],
  },
  
  server: {
    port: 5173,
    open: true,
    hmr: { 
      overlay: false 
    },
    // ✅ NOVO: Enable network access (za mobile testing)
    host: true,
  },
  
  preview: {
    port: 4173,
    open: true,
    // ✅ NOVO: Enable network access
    host: true,
  }
});