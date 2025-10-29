// src/lib/firebase.ts - OPTIMIZED VERSION
import { initializeApp, type FirebaseApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase app immediately (lightweight)
const app: FirebaseApp = initializeApp(firebaseConfig);

// ✅ LAZY LOAD Firestore (used on most pages)
let firestoreInstance: any = null;
export const getDb = async () => {
  if (!firestoreInstance) {
    const { getFirestore } = await import('firebase/firestore');
    firestoreInstance = getFirestore(app);
  }
  return firestoreInstance;
};

// ✅ LAZY LOAD Storage (used only on upload pages)
let storageInstance: any = null;
export const getStorageInstance = async () => {
  if (!storageInstance) {
    const { getStorage } = await import('firebase/storage');
    storageInstance = getStorage(app);
  }
  return storageInstance;
};

// ✅ LAZY LOAD Auth (used on login/signup pages)
let authInstance: any = null;
export const getAuthInstance = async () => {
  if (!authInstance) {
    const { getAuth, GoogleAuthProvider } = await import('firebase/auth');
    authInstance = getAuth(app);
    
    // Setup Google provider
    const googleProvider = new GoogleAuthProvider();
    googleProvider.addScope('profile');
    googleProvider.addScope('email');
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    (authInstance as any).googleProvider = googleProvider;
  }
  return authInstance;
};

// ✅ Export Google Provider helper
export const getGoogleProvider = async () => {
  const auth = await getAuthInstance();
  return (auth as any).googleProvider;
};

// Keep old exports for backward compatibility (will be deprecated)
// These will be lazy-loaded on first access
export let db: any = null;
export let storage: any = null;
export let auth: any = null;
export let googleProvider: any = null;

// Initialize on first access
const initLegacyExports = async () => {
  if (!db) db = await getDb();
  if (!storage) storage = await getStorageInstance();
  if (!auth) auth = await getAuthInstance();
  if (!googleProvider) googleProvider = await getGoogleProvider();
};

// Auto-initialize after a short delay (non-blocking)
setTimeout(() => {
  initLegacyExports().catch(console.error);
}, 100);

export default app;