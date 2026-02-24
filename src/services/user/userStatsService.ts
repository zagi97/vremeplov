// src/services/user/userStatsService.ts - User statistics management
import {
  doc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserProfile } from '../../types/user.types';

class UserStatsService {
  /**
   * Update user stats (call this after photo upload, like, etc.)
   */
  async updateUserStats(userId: string, statUpdates: Partial<UserProfile['stats']>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const updates: Record<string, number> = {};

      // Set absolute values (not incremental)
      Object.entries(statUpdates).forEach(([key, value]) => {
        if (typeof value === 'number') {
          updates[`stats.${key}`] = value;
        }
      });

      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  /**
   * Force recalculate stats from actual Firebase data - Optimized
   */
  async forceRecalculateUserStats(userId: string): Promise<void> {
    try {
      const { photoService } = await import('../firebaseService');

      // ✅ Try getPhotosByUploader first, fallback to getAllPhotos if index is missing
      let allUserPhotos;
      try {
        allUserPhotos = await photoService.getPhotosByUploader(userId);
      } catch (error: any) {
        console.warn(`⚠️  getPhotosByUploader failed for ${userId}, using fallback. Error: ${error.message}`);
        // Fallback: Get all photos and filter manually (slower but works without index)
        const allPhotos = await photoService.getAllPhotos();
        allUserPhotos = allPhotos.filter(p =>
          p.uploaderId === userId || p.authorId === userId
        );
      }

      // ✅ Filter to only count APPROVED photos for stats (pending photos don't count toward leaderboard)
      const userPhotos = allUserPhotos.filter(photo => photo.isApproved === true);

      if (userPhotos.length === 0) {
        await this.updateUserStats(userId, {
          totalPhotos: 0,
          totalLikes: 0,
          totalViews: 0,
          locationsContributed: 0
        });
        return;
      }

      // Batch fetch all likes for all user photos at once
      const photoIds = userPhotos.map(p => p.id).filter(Boolean) as string[];
      let totalLikes = 0;
      const photoLikeCounts = new Map<string, number>();

      if (photoIds.length > 0) {
        // Firestore 'in' limit is 10, so batch
        const BATCH_SIZE = 10;
        for (let i = 0; i < photoIds.length; i += BATCH_SIZE) {
          const batch = photoIds.slice(i, i + BATCH_SIZE);
          const likesQuery = query(
            collection(db, 'userLikes'),
            where('photoId', 'in', batch)
          );
          const likesSnapshot = await getDocs(likesQuery);

          likesSnapshot.docs.forEach(doc => {
            const photoId = doc.data().photoId;
            photoLikeCounts.set(photoId, (photoLikeCounts.get(photoId) || 0) + 1);
          });
        }

        // Update photos with incorrect like counts
        const updatePromises: Promise<void>[] = [];
        for (const photo of userPhotos) {
          if (photo.id) {
            const actualLikes = photoLikeCounts.get(photo.id) || 0;
            totalLikes += actualLikes;

            if (photo.likes !== actualLikes) {
              updatePromises.push(
                updateDoc(doc(db, 'photos', photo.id), {
                  likes: actualLikes
                })
              );
            }
          }
        }

        // Execute all photo updates in parallel
        await Promise.all(updatePromises);
      }

      // Calculate other stats
      const totalViews = userPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(userPhotos.map(photo => photo.location)).size;

      // Update user stats with correct values
      await this.updateUserStats(userId, {
        totalPhotos: userPhotos.length,
        totalLikes: totalLikes,
        totalViews: totalViews,
        locationsContributed: uniqueLocations
      });
    } catch (error) {
      console.error('Error force recalculating user stats:', error);
      throw error;
    }
  }

  /**
   * Fix all photos' like counts based on userLikes collection - Optimized
   */
  async fixAllPhotoLikeCounts(): Promise<void> {
    try {
      const { photoService } = await import('../firebaseService');
      const allPhotos = await photoService.getAllPhotos();

      if (allPhotos.length === 0) return;

      // Batch fetch all likes for all photos at once
      const photoIds = allPhotos.map(p => p.id).filter(Boolean) as string[];
      const photoLikeCounts = new Map<string, number>();

      if (photoIds.length > 0) {
        // Firestore 'in' limit is 10, so batch
        const BATCH_SIZE = 10;
        for (let i = 0; i < photoIds.length; i += BATCH_SIZE) {
          const batch = photoIds.slice(i, i + BATCH_SIZE);
          const likesQuery = query(
            collection(db, 'userLikes'),
            where('photoId', 'in', batch)
          );
          const likesSnapshot = await getDocs(likesQuery);

          likesSnapshot.docs.forEach(doc => {
            const photoId = doc.data().photoId;
            photoLikeCounts.set(photoId, (photoLikeCounts.get(photoId) || 0) + 1);
          });
        }

        // Update photos with incorrect like counts
        const updatePromises: Promise<void>[] = [];
        for (const photo of allPhotos) {
          if (photo.id) {
            const actualLikes = photoLikeCounts.get(photo.id) || 0;

            if (photo.likes !== actualLikes) {
              updatePromises.push(
                updateDoc(doc(db, 'photos', photo.id), {
                  likes: actualLikes
                })
              );
            }
          }
        }

        // Execute all photo updates in parallel
        await Promise.all(updatePromises);
      }
    } catch (error) {
      console.error('Error fixing photo like counts:', error);
      throw error;
    }
  }

  /**
   * ADMIN ONLY: Recalculate stats for all users
   * Use this after changing stats calculation logic or fixing data
   */
  async recalculateAllUserStats(): Promise<{ success: number; failed: number; errors: string[] }> {
    try {
      console.log('🔵 Starting recalculation for ALL users...');

      const usersSnapshot = await getDocs(collection(db, 'users'));
      const userIds = usersSnapshot.docs.map(doc => doc.id);

      console.log(`📊 Found ${userIds.length} users to process`);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];

      // Process users in batches of 5 to avoid rate limits
      const BATCH_SIZE = 5;
      for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
        const batch = userIds.slice(i, i + BATCH_SIZE);

        const results = await Promise.allSettled(
          batch.map(userId => this.forceRecalculateUserStats(userId))
        );

        results.forEach((result, index) => {
          const userId = batch[index];
          if (result.status === 'fulfilled') {
            success++;
            console.log(`✅ [${success}/${userIds.length}] Recalculated stats for user: ${userId}`);
          } else {
            failed++;
            const error = `User ${userId}: ${result.reason}`;
            errors.push(error);
            console.error(`❌ [${i + index + 1}/${userIds.length}] ${error}`);
          }
        });

        // Small delay between batches
        if (i + BATCH_SIZE < userIds.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`✅ Recalculation complete! Success: ${success}, Failed: ${failed}`);

      return { success, failed, errors };
    } catch (error) {
      console.error('❌ Error in recalculateAllUserStats:', error);
      throw error;
    }
  }

  /**
   * Get user stats for a specific time period
   */
  async getUserStatsForPeriod(userId: string, fromDate: Date): Promise<UserProfile['stats']> {
    try {
      // Query approved photos by uploader within time period directly
      const photosQuery = query(
        collection(db, 'photos'),
        where('uploaderId', '==', userId),
        where('isApproved', '==', true),
        where('createdAt', '>=', fromDate)
      );

      const snapshot = await getDocs(photosQuery);
      const periodPhotos = snapshot.docs.map(doc => doc.data());

      const totalLikes = periodPhotos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalViews = periodPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(periodPhotos.map(photo => photo.location)).size;

      return {
        totalPhotos: periodPhotos.length,
        totalLikes,
        totalViews,
        locationsContributed: uniqueLocations,
        followers: 0, // Not time-dependent
        following: 0  // Not time-dependent
      };
    } catch (error) {
      console.error('Error calculating period stats:', error);
      return {
        totalPhotos: 0,
        totalLikes: 0,
        totalViews: 0,
        locationsContributed: 0,
        followers: 0,
        following: 0
      };
    }
  }
}

export const userStatsService = new UserStatsService();
