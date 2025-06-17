import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Add these imports at the very top of src/main.tsx
import { db } from './lib/firebase';
import { collection } from 'firebase/firestore';

// Add this test right after imports
console.log('🔥 Testing Firebase...');
try {
  const testRef = collection(db, 'test');
  console.log('✅ Firebase connected successfully!');
} catch (error) {
  console.error('❌ Firebase error:', error);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
