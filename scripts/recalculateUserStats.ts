// scripts/recalculateUserStats.ts
// Helper script to recalculate user stats after fixing stat calculation logic
// Run with: npx tsx scripts/recalculateUserStats.ts

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Firebase config - adjust if needed
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import the stats service
import { userStatsService } from '../src/services/user/userStatsService';

async function main() {
  console.log('🚀 Starting user stats recalculation...\n');

  try {
    // Recalculate stats for all users
    const result = await userStatsService.recalculateAllUserStats();

    console.log('\n' + '='.repeat(50));
    console.log('📊 RECALCULATION COMPLETE');
    console.log('='.repeat(50));
    console.log(`✅ Successfully recalculated: ${result.success} users`);
    console.log(`❌ Failed: ${result.failed} users`);

    if (result.errors.length > 0) {
      console.log('\n⚠️  Errors:');
      result.errors.forEach(err => console.log(`  - ${err}`));
    }

    console.log('\n✨ All done! User stats have been updated to reflect only approved photos.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
