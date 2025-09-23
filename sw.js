// Kreirajte public/sw.js

const CACHE_NAME = 'vremeplov-v1.0.0';
const STATIC_CACHE = 'vremeplov-static-v1';
const DYNAMIC_CACHE = 'vremeplov-dynamic-v1';
const IMAGE_CACHE = 'vremeplov-images-v1';

// Files to cache immediately (essential for offline)
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/favicon.ico'
];

// Firebase endpoints to cache
const FIREBASE_ENDPOINTS = [
  'firestore.googleapis.com',
  'firebasestorage.googleapis.com'
];

// Image domains to cache
const IMAGE_DOMAINS = [
  'images.unsplash.com',
  'firebasestorage.googleapis.com'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  console.log('SW: Install event');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('SW: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('SW: Static assets cached');
        return self.skipWaiting(); // Force activation
      })
  );
});

// Activate event - cleanup old caches
self.addEventListener('activate', (event) => {
  console.log('SW: Activate event');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old versions
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== IMAGE_CACHE) {
              console.log('SW: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('SW: Cache cleanup complete');
        return self.clients.claim(); // Take control immediately
      })
  );
});

// Fetch event - handle different types of requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else if (isFirebaseRequest(request)) {
    event.respondWith(handleFirebaseRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handleDynamicRequest(request));
  }
});

// Check if request is for an image
function isImageRequest(request) {
  const url = new URL(request.url);
  return request.destination === 'image' || 
         IMAGE_DOMAINS.some(domain => url.hostname.includes(domain)) ||
         /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url.pathname);
}

// Check if request is to Firebase
function isFirebaseRequest(request) {
  const url = new URL(request.url);
  return FIREBASE_ENDPOINTS.some(endpoint => url.hostname.includes(endpoint));
}

// Check if request is for static asset
function isStaticAsset(request) {
  const url = new URL(request.url);
  return url.origin === self.location.origin && 
         (url.pathname.startsWith('/static/') || 
          url.pathname.includes('.js') || 
          url.pathname.includes('.css') ||
          STATIC_ASSETS.includes(url.pathname));
}

// Handle image requests - Cache First strategy
async function handleImageRequest(request) {
  try {
    const cache = await caches.open(IMAGE_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Image served from cache:', request.url);
      return cachedResponse;
    }

    console.log('SW: Fetching image:', request.url);
    const response = await fetch(request);
    
    // ✅ DODAJ OVO - ne pokušavaj cache-irati 404 slike
    if (response.status === 404) {
      console.log('SW: Image not found (404), not caching:', request.url);
      return response;
    }
    
    if (response.ok) {
      cache.put(request, response.clone());
      console.log('SW: Image cached:', request.url);
    }
    
    return response;
  } catch (error) {
    console.log('SW: Image fetch failed:', error);
    
    // ✅ DODAJ PROPER FALLBACK
    return new Response(
      '<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f3f4f6"/><text x="50%" y="50%" text-anchor="middle" fill="#6b7280">Slika nije dostupna</text></svg>',
      { 
        headers: { 'Content-Type': 'image/svg+xml' },
        status: 200 
      }
    );
  }
}

// Handle Firebase requests - Network First with cache fallback
async function handleFirebaseRequest(request) {
  try {
    console.log('SW: Firebase request:', request.url);
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
      console.log('SW: Firebase response cached');
    }
    
    return response;
  } catch (error) {
    console.log('SW: Firebase fetch failed, trying cache');
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Firebase served from cache');
      return cachedResponse;
    }
    
    throw error;
  }
}

// Handle static assets - Cache First
async function handleStaticRequest(request) {
  try {
    const cache = await caches.open(STATIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Static asset served from cache:', request.url);
      return cachedResponse;
    }

    const response = await fetch(request);
    if (response.ok) {
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.log('SW: Static asset fetch failed:', error);
    throw error;
  }
}

// Handle dynamic requests - Network First
async function handleDynamicRequest(request) {
  try {
    const response = await fetch(request);
    
    if (response.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    const cache = await caches.open(DYNAMIC_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      console.log('SW: Dynamic content served from cache');
      return cachedResponse;
    }
    
    // Fallback for navigation requests
    if (request.mode === 'navigate') {
      const fallback = await caches.match('/');
      if (fallback) {
        return fallback;
      }
    }
    
    throw error;
  }
}

// Background sync for offline photo uploads (advanced feature)
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-photos') {
    console.log('SW: Background sync triggered');
    event.waitUntil(syncOfflineUploads());
  }
});

// Handle offline upload queue
async function syncOfflineUploads() {
  try {
    // Get offline uploads from IndexedDB
    const uploads = await getOfflineUploads();
    
    for (const upload of uploads) {
      try {
        // Attempt to upload
        await retryUpload(upload);
        await removeOfflineUpload(upload.id);
        console.log('SW: Offline upload synced:', upload.id);
      } catch (error) {
        console.log('SW: Upload still failing:', upload.id, error);
      }
    }
  } catch (error) {
    console.log('SW: Background sync failed:', error);
  }
}

// Placeholder functions for offline upload handling
async function getOfflineUploads() {
  // Implement IndexedDB reading
  return [];
}

async function retryUpload(upload) {
  // Implement upload retry logic
  throw new Error('Not implemented');
}

async function removeOfflineUpload(id) {
  // Implement IndexedDB removal
}