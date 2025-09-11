import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'

// Firebase imports
import { db } from './lib/firebase';
import { collection } from 'firebase/firestore';

// Firebase connection test
console.log('🔥 Testing Firebase...');
try {
  const testRef = collection(db, 'test');
  console.log('✅ Firebase connected successfully!');
} catch (error) {
  console.error('❌ Firebase error:', error);
}

// Service Worker utilities
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('⚠️ Service Worker not supported in this browser');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Uvijek provjeri za updates
    });
    
    console.log('✅ Service Worker registered successfully:', registration.scope);
    return registration;
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
    return null;
  }
};

const setupUpdateHandler = (registration: ServiceWorkerRegistration): void => {
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
};

const setupBackgroundSync = async (registration: ServiceWorkerRegistration): Promise<void> => {
  if (!registration.sync) {
    console.warn('⚠️ Background sync not supported in this browser');
    return;
  }

  try {
    // Registriraj sync tagove koje ćeš koristiti
    await registration.sync.register('background-sync-photos');
    await registration.sync.register('background-sync-offline-actions');
    
    console.log('📱 Background sync registered successfully');
  } catch (error) {
    console.error('❌ Background sync registration failed:', error);
  }
};

const setupMessageHandler = (): void => {
  navigator.serviceWorker.addEventListener('message', (event) => {
    console.log('📨 Message from service worker:', event.data);
    
    switch (event.data.type) {
      case 'CACHE_UPDATED':
        console.log('💾 Cache updated:', event.data.cacheName);
        break;
      case 'BACKGROUND_SYNC_SUCCESS':
        console.log('✅ Background sync completed:', event.data.tag);
        // Trigger UI update
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

// Main service worker initialization
const initializeServiceWorker = async (): Promise<void> => {
  const registration = await registerServiceWorker();
  if (!registration) return;

  setupUpdateHandler(registration);
  await setupBackgroundSync(registration);
  setupMessageHandler();
};

// Initialize everything
window.addEventListener('load', () => {
  initializeServiceWorker().catch(error => {
    console.error('Service Worker initialization failed:', error);
  });
});

// Global error handling za service worker
window.addEventListener('error', (event) => {
  if (event.filename?.includes('sw.js')) {
    console.error('Service Worker error:', event.error);
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
)