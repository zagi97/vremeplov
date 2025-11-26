// scripts/setAdminFlag.js
// This script updates the admin user document to set isAdmin: true
// Run this script ONCE after deploying the code changes

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';

// Firebase config - you should use your actual config
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const ADMIN_EMAIL = process.env.VITE_ADMIN_EMAIL || 'vremeplov.app@gmail.com';

async function setAdminFlag() {
  try {
    console.log('Initializing Firebase...');
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    console.log(`Looking for user with email: ${ADMIN_EMAIL}...`);

    // Query for user document by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', ADMIN_EMAIL));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.error(`ERROR: No user found with email ${ADMIN_EMAIL}`);
      console.log('\nPlease make sure:');
      console.log('1. The admin user has logged in at least once');
      console.log('2. The VITE_ADMIN_EMAIL environment variable is set correctly');
      process.exit(1);
    }

    // Update the admin user document
    for (const userDoc of querySnapshot.docs) {
      console.log(`Found user: ${userDoc.id}`);
      const userRef = doc(db, 'users', userDoc.id);

      await updateDoc(userRef, {
        isAdmin: true
      });

      console.log(`✅ Successfully set isAdmin: true for user ${userDoc.id}`);
      console.log('\nAdmin user can now:');
      console.log('- View pending photos in the admin dashboard');
      console.log('- Approve/reject photo submissions');
      console.log('- Manage user accounts');
    }

    console.log('\n✨ Done! You can now test the admin dashboard.');
    process.exit(0);

  } catch (error) {
    console.error('Error setting admin flag:', error);
    process.exit(1);
  }
}

setAdminFlag();
