import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Analytics } from '@vercel/analytics/react';

// ✅ IMMEDIATE: Only core App component
import App from './App.tsx'

// ✅ LAZY: Firebase initialization (defer to background)
const initializeFirebase = async () => {
  try {
    const { db } = await import('./lib/firebase');
    const { collection } = await import('firebase/firestore');
    
    console.log('🔥 Testing Firebase...');
    const testRef = collection(db, 'test');
    console.log('✅ Firebase connected successfully!');
  } catch (error) {
    console.error('❌ Firebase error:', error);
  }
};

// ✅ Service Worker message handler
const setupMessageHandler = (): void => {
  if (!navigator.serviceWorker) return;
  
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from service worker:', event.data);
    
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('💾 Cache updated:', event.data.cacheName);
        break;
      case 'BACKGROUND_SYNC_SUCCESS':
        console.log('✅ Background sync completed:', event.data.tag);
        window.dispatchEvent(new CustomEvent('sync-completed', { 
          detail: { tag: event.data.tag } 
        }));
        break;
      case 'BACKGROUND_SYNC_FAILED':
        console.error('❌ Background sync failed:', event.data.tag, event.data.error);
        break;
      default:
        console.log('Unknown message type:', event.data.type);
    }
  });
};

// ✅ LAZY: Service Worker initialization
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
    
    console.log('✅ Service Worker registered successfully:', registration.scope);
    
    // Setup update handler
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('🔄 New app update available!');
          
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
      console.log('📱 Background sync registered successfully');
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
    <App />
    <Analytics />
  </StrictMode>,
);

// ✅ DEFER: Initialize Firebase & SW after app loads
window.addEventListener('load', () => {
  // Use requestIdleCallback for better performance
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      initializeFirebase();
      initializeServiceWorker();
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      initializeFirebase();
      initializeServiceWorker();
    }, 1);
  }
});

// Global error handling za service worker
window.addEventListener('error', (event) => {
  if (event.filename?.includes('sw.js')) {
    console.error('Service Worker error:', event.error);
  }
});