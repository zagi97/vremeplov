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
      const userPhotos = await photoService.getPhotosByUploader(userId);

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
   * Get user stats for a specific time period
   */
  async getUserStatsForPeriod(userId: string, fromDate: Date): Promise<UserProfile['stats']> {
    try {
      // Get photos uploaded since the date
      const { photoService } = await import('../firebaseService');
      const allPhotos = await photoService.getPhotosByUploader(userId);

      const periodPhotos = allPhotos.filter(photo => {
        const photoDate = photo.createdAt?.toDate() || new Date(photo.uploadedAt || 0);
        return photoDate >= fromDate;
      });

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
