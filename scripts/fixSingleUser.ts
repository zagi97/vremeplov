// scripts/fixSingleUser.ts
// Debug script to recalculate stats for a single user with detailed logging
// Run with: npx tsx scripts/fixSingleUser.ts

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  query,
  where,
  getDocs,
  doc,
  getDoc,
  updateDoc
} from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Firebase config
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

// =====================================
// 🎯 CHANGE THIS TO YOUR USER ID
// =====================================
const TARGET_USER_ID = 'BH9KlvRSkbMwyLA6p5bckJ8B4gc2'; // Kruno Vremeplov

async function debugUserStats() {
  console.log('🔍 DEBUG: Fixing stats for user:', TARGET_USER_ID);
  console.log('='.repeat(60));

  try {
    // =====================================
    // STEP 1: Get user document
    // =====================================
    console.log('\n📋 STEP 1: Fetching user document...');
    const userRef = doc(db, 'users', TARGET_USER_ID);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      console.error('❌ User document does not exist!');
      return;
    }

    const userData = userSnap.data();
    console.log('✅ User found:', userData.displayName);
    console.log('   - Email:', userData.email);
    console.log('   - isAdmin:', userData.isAdmin);
    console.log('   - Current stats:', JSON.stringify(userData.stats, null, 2));

    // =====================================
    // STEP 2: Query photos by uploaderId
    // =====================================
    console.log('\n📷 STEP 2: Querying photos by uploaderId...');
    const photosQuery = query(
      collection(db, 'photos'),
      where('uploaderId', '==', TARGET_USER_ID)
    );
    const photosSnapshot = await getDocs(photosQuery);

    console.log(`   Found ${photosSnapshot.size} photos with uploaderId = ${TARGET_USER_ID}`);

    if (photosSnapshot.size === 0) {
      // Try alternative field - authorId
      console.log('\n⚠️  No photos found! Trying authorId field...');
      const authorQuery = query(
        collection(db, 'photos'),
        where('authorId', '==', TARGET_USER_ID)
      );
      const authorSnapshot = await getDocs(authorQuery);
      console.log(`   Found ${authorSnapshot.size} photos with authorId = ${TARGET_USER_ID}`);

      if (authorSnapshot.size > 0) {
        console.log('\n🔴 PROBLEM IDENTIFIED: Photos have authorId but not uploaderId!');
        console.log('   The getPhotosByUploader() function queries by uploaderId.');
      }
    }

    // =====================================
    // STEP 3: List all photos details
    // =====================================
    console.log('\n📋 STEP 3: Photo details:');
    const photos: any[] = [];

    photosSnapshot.forEach((docSnap) => {
      const photo = { id: docSnap.id, ...docSnap.data() };
      photos.push(photo);
      console.log(`\n   Photo ID: ${docSnap.id}`);
      console.log(`   - location: ${photo.location}`);
      console.log(`   - isApproved: ${photo.isApproved}`);
      console.log(`   - likes: ${photo.likes}`);
      console.log(`   - views: ${photo.views}`);
      console.log(`   - uploaderId: ${photo.uploaderId}`);
      console.log(`   - authorId: ${photo.authorId}`);
    });

    // Filter only approved photos
    const approvedPhotos = photos.filter(p => p.isApproved === true);
    console.log(`\n✅ Approved photos count: ${approvedPhotos.length}`);

    // =====================================
    // STEP 4: Calculate correct stats
    // =====================================
    console.log('\n📊 STEP 4: Calculating correct stats...');

    // Get actual likes from userLikes collection
    let totalLikes = 0;
    const photoIds = approvedPhotos.map(p => p.id);

    if (photoIds.length > 0) {
      for (const photoId of photoIds) {
        const likesQuery = query(
          collection(db, 'userLikes'),
          where('photoId', '==', photoId)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const likeCount = likesSnapshot.size;
        totalLikes += likeCount;
        console.log(`   - Photo ${photoId}: ${likeCount} likes (from userLikes)`);
      }
    }

    const totalViews = approvedPhotos.reduce((sum, p) => sum + (p.views || 0), 0);
    const uniqueLocations = new Set(approvedPhotos.map(p => p.location)).size;

    const correctStats = {
      totalPhotos: approvedPhotos.length,
      totalLikes: totalLikes,
      totalViews: totalViews,
      locationsContributed: uniqueLocations
    };

    console.log('\n📈 Calculated stats:');
    console.log(JSON.stringify(correctStats, null, 2));

    // =====================================
    // STEP 5: Update user document
    // =====================================
    console.log('\n💾 STEP 5: Updating user stats...');

    try {
      await updateDoc(userRef, {
        'stats.totalPhotos': correctStats.totalPhotos,
        'stats.totalLikes': correctStats.totalLikes,
        'stats.totalViews': correctStats.totalViews,
        'stats.locationsContributed': correctStats.locationsContributed
      });
      console.log('✅ User stats updated successfully!');
    } catch (updateError: any) {
      console.error('❌ Failed to update user stats!');
      console.error('   Error code:', updateError.code);
      console.error('   Error message:', updateError.message);

      if (updateError.code === 'permission-denied') {
        console.log('\n🔴 PERMISSION DENIED - Firebase Security Rules are blocking the update!');
        console.log('   This is likely because:');
        console.log('   1. The script is running without authentication');
        console.log('   2. Or the rules don\'t allow stats updates from this context');
      }
    }

    // =====================================
    // STEP 6: Verify update
    // =====================================
    console.log('\n🔍 STEP 6: Verifying update...');
    const verifySnap = await getDoc(userRef);
    const verifyData = verifySnap.data();
    console.log('   Final stats:', JSON.stringify(verifyData?.stats, null, 2));

    console.log('\n' + '='.repeat(60));
    console.log('✨ Debug complete!');

  } catch (error: any) {
    console.error('\n❌ FATAL ERROR:', error);
    console.error('   Code:', error.code);
    console.error('   Message:', error.message);
    console.error('   Stack:', error.stack);
  }

  process.exit(0);
}

debugUserStats();
