// scripts/fixSingleUser.ts
// Fix stats for a single user (Kruno Vremeplov)
// Run with: npx tsx scripts/fixSingleUser.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

import { userStatsService } from '../src/services/user/userStatsService';

async function main() {
  const userId = 'BH9KlvRSkbMwyLA6p5bckJ8B4gc2'; // Kruno Vremeplov

  console.log(`🔧 Recalculating stats for user: ${userId}\n`);

  try {
    await userStatsService.forceRecalculateUserStats(userId);
    console.log('\n✅ SUCCESS! Stats updated for Kruno Vremeplov.');
    console.log('📊 Refresh the leaderboard to see the changes.');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED:', error);
    process.exit(1);
  }
}

main();
