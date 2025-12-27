import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from './contexts/ThemeContext';

// ✅ IMMEDIATE: Only core App component
import App from './App.tsx'

// ✅ LAZY: Firebase initialization (defer to background)
const initializeFirebase = async () => {
  try {
    const { db } = await import('./lib/firebase');
    const { collection } = await import('firebase/firestore');

    const testRef = collection(db, 'test');
  } catch (error) {
    console.error('❌ Firebase error:', error);
  }
};

// ✅ Service Worker message handler
const setupMessageHandler = (): void => {
  if (!navigator.serviceWorker) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        break;
      case 'BACKGROUND_SYNC_SUCCESS':
        window.dispatchEvent(new CustomEvent('sync-completed', {
          detail: { tag: event.data.tag }
        }));
        break;
      case 'BACKGROUND_SYNC_FAILED':
        console.error('❌ Background sync failed:', event.data.tag, event.data.error);
        break;
      default:
        break;
    }
  });
};

// ✅ OPTIMIZED: Service Worker initialization with better deferring
const initializeServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this browser');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    });

    // Setup update handler
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          // Pošalji custom event da komponente mogu reagirati
          window.dispatchEvent(new CustomEvent('app-update-available'));

          // Opcionalno: Automatski prompt (možeš ovo prebaciti u komponentu)
          if (confirm('Nova verzija aplikacije je dostupna. Želite li ažurirati?')) {
            window.location.reload();
          }
        }
      });
    });

    // Background sync
    if (registration.sync) {
      await registration.sync.register('background-sync-photos');
      await registration.sync.register('background-sync-offline-actions');
    } else {
      console.warn('⚠️ Background sync not supported in this browser');
    }
    
    // Setup message handler
    setupMessageHandler();
    
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
};

// ✅ RENDER APP IMMEDIATELY (no blocking!)
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Analytics />
    </ThemeProvider>
  </StrictMode>,
);

// ✅ OPTIMIZED: Defer everything until after page is interactive
window.addEventListener('load', () => {
  // 🔒 FIX: Service Worker MORA biti registriran pouzdano (ne preko requestIdleCallback)
  // PWA funkcionalnost ne smije biti opcionalna!
  initializeServiceWorker();

  // ✅ Firebase može biti deferirano jer nije kritično za prvi render
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeFirebase();
    }, { timeout: 2000 }); // Max 2s delay
  } else {
    setTimeout(() => {
      initializeFirebase();
    }, 100); // Small delay
  }
});

// ✅ Check if error is a chunk loading error
function isChunkLoadError(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const patterns = [
    'dynamically imported module',
    'loading chunk',
    'failed to fetch',
    'loading css chunk',
    'unable to preload',
    'failed to load module',
    'syntaxerror',
    'unexpected token \'<\'', // HTML returned instead of JS (404 redirect)
    'is not valid javascript',
    'error loading',
  ];
  return patterns.some(pattern => lowerMessage.includes(pattern));
}

// ✅ Global error handling za service worker i chunk errors
window.addEventListener('error', (event) => {
  if (event.filename?.includes('sw.js')) {
    console.error('Service Worker error:', event.error);
  }

  // Handle chunk loading errors (after new deployment)
  const message = event.message || event.error?.message || '';
  if (isChunkLoadError(message)) {
    console.log('🔄 [ERROR] Chunk error detected:', message);
    handleChunkError();
  }
});

// ✅ Global handler for async chunk loading errors
window.addEventListener('unhandledrejection', (event) => {
  const message = event.reason?.message || String(event.reason) || '';

  if (isChunkLoadError(message)) {
    console.log('🔄 [UNHANDLED REJECTION] Chunk error detected:', message);
    event.preventDefault(); // Prevent default error logging
    handleChunkError();
  }
});

// ✅ Handle chunk loading error - reload once
function handleChunkError() {
  const reloadKey = 'chunk_error_reload';
  const lastReload = sessionStorage.getItem(reloadKey);
  const now = Date.now();

  // Only reload if we haven't reloaded in the last 10 seconds
  if (!lastReload || (now - parseInt(lastReload)) > 10000) {
    console.log('🔄 Chunk loading error - reloading page...');
    sessionStorage.setItem(reloadKey, now.toString());
    window.location.reload();
  } else {
    console.warn('⚠️ Chunk reload already attempted recently, not reloading again');
  }
}