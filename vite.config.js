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
  
  // ✅ BUILD OPTIMIZATIONS - FULLY OPTIMIZED!
  build: {
    // ✅ Target modernije browsere za manji bundle
    target: ['es2020', 'edge88', 'firefox78', 'chrome87', 'safari14'],
    
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace'],
        passes: 3, // ✅ UPGRADED: 3 prohoda za maksimalnu kompresiju
        // ✅ NOVE OPTIMIZACIJE:
        arguments: true,
        booleans_as_integers: false,
        hoist_funs: true,
        keep_fargs: false,
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
      },
      mangle: {
        safari10: true,
        properties: {
          // ✅ NOVO: Mangle privatna svojstva (dodatna kompresija)
          regex: /^_/
        }
      },
      format: {
        // ✅ NOVO: Ukloni komentare
        comments: false,
        // ✅ NOVO: Maksimalna kompresija
        ecma: 2020
      }
    },
    
    rollupOptions: {
      output: {
        // ✅ KRITIČNO: POBOLJŠAN chunk splitting!
        manualChunks: (id) => {
          // ✅ React Core (mali, često cached)
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          
          // ✅ FIREBASE - Razdvojeno za LAZY LOADING!
          if (id.includes('firebase/app')) {
            return 'firebase-core';
          }
          if (id.includes('firebase/firestore') || id.includes('@firebase/firestore')) {
            return 'firebase-firestore';
          }
          if (id.includes('firebase/auth') || id.includes('@firebase/auth')) {
            return 'firebase-auth';
          }
          if (id.includes('firebase/storage') || id.includes('@firebase/storage')) {
            return 'firebase-storage';
          }
          
          // ✅ UI Libraries (grupirano po funkcionalnosti)
          if (id.includes('lucide-react')) {
            return 'ui-icons';
          }
          if (id.includes('sonner')) {
            return 'ui-toast';
          }
          
          // ✅ Radix UI Components (heavy, separate chunk)
          if (id.includes('@radix-ui/')) {
  // ✅ Ne grupiraj SVE Radix u jedan chunk!
  // Svaki Radix component ide u svoj mini-chunk
  const match = id.match(/@radix-ui\/react-([^/]+)/);
  if (match) {
    return `radix-${match[1]}`;
  }
  return 'ui-radix';
}
          
          // ✅ Routing
          if (id.includes('react-router-dom')) {
            return 'routing';
          }
          
          // ✅ Maps (heavy library!)
          if (id.includes('leaflet') || id.includes('react-leaflet')) {
            return 'maps';
          }
          
          // ✅ NOVO: Vercel Analytics (separate)
          if (id.includes('@vercel/analytics')) {
            return 'analytics';
          }
          
          // ✅ Sve ostalo iz node_modules ide u vendor
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        },
        
        // ✅ Optimized file naming za browser caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop() : 'chunk';
          return `assets/js/[name]-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // ✅ Organiziraj assets po tipu
          let extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            extType = 'images';
          } else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
            extType = 'fonts';
          }
          return `assets/${extType}/[name]-[hash].[ext]`;
        },
        
        // ✅ NOVO: Compact output
        compact: true,
        
        // ✅ NOVO: Hoisting za bolju tree-shaking
        hoistTransitiveImports: false,
      },
      
      // ✅ NOVO: Tree-shaking optimizacije
      treeshake: {
        moduleSideEffects: 'no-external',
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    
    // ✅ Chunk size warning threshold
    chunkSizeWarningLimit: 800, // ✅ Smanjen sa 1000 na 800
    
    // ✅ Sourcemaps OFF za production (manji bundle)
    sourcemap: false,
    
    // ✅ NOVO: CSS code splitting
    cssCodeSplit: true,
    
    // ✅ NOVO: Minify CSS
    cssMinify: true,
    
    // ✅ NOVO: Report compressed size (za debugging)
    reportCompressedSize: true,
  },
  
  // ✅ OPTIMIZED: Dependency pre-bundling
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'lucide-react',
      // ✅ NE includiraj Firebase - lazy load ih!
    ],
    exclude: [
      // ✅ Firebase se NE pre-bundlea - lazy load!
      'firebase/app',
      'firebase/firestore',
      'firebase/auth',
      'firebase/storage',
      '@firebase/app',
      '@firebase/firestore',
      '@firebase/auth',
      '@firebase/storage',
    ],
    esbuildOptions: {
      target: 'es2020',
      // ✅ NOVO: Additional esbuild optimizations
      drop: ['console', 'debugger'],
      legalComments: 'none',
    }
  },
  
  server: {
    port: 5173,
    open: true,
    hmr: { 
      overlay: false 
    },
    host: true, // Enable network access
  },
  
  preview: {
    port: 4173,
    open: true,
    host: true, // Enable network access
  },
  
  // ✅ NOVO: Experimental features
  experimental: {
    // Render built-in optimization hints
    renderBuiltUrl(filename, { hostType }) {
      if (hostType === 'js') {
        return { runtime: `window.__assetsPath('${filename}')` };
      } else {
        return { relative: true };
      }
    },
  },
});