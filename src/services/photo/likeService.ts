// src/services/photo/likeService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserLike } from '../firebaseService';

export class LikeService {
  private userLikesCollection = collection(db, 'userLikes');
  private photosCollection = collection(db, 'photos');

  // ========================================
  // LIKE OPERATIONS
  // ========================================

  /**
   * Check if user has already liked this photo
   */
  async hasUserLiked(photoId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        this.userLikesCollection,
        where('photoId', '==', photoId),
        where('userId', '==', userId),
        limit(1)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user like:', error);
      return false;
    }
  }

  /**
   * Toggle like for photo (handles both like and unlike)
   */
  async toggleLike(photoId: string, userId: string): Promise<{ liked: boolean; newLikesCount: number }> {
    try {
      const hasLiked = await this.hasUserLiked(photoId, userId);

      const docRef = doc(this.photosCollection, photoId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        throw new Error('Photo not found');
      }

      const photoData = docSnap.data();
      const currentLikes = photoData.likes || 0;

      if (hasLiked) {
        // ========== UNLIKE ==========

        // 1. Remove like record
        const likeQuery = query(
          this.userLikesCollection,
          where('photoId', '==', photoId),
          where('userId', '==', userId),
          limit(1)
        );
        const likeSnapshot = await getDocs(likeQuery);
        const deletePromises = likeSnapshot.docs.map(doc => deleteDoc(doc.ref));
        await Promise.all(deletePromises);

        // 2. Decrement like count
        const newLikesCount = Math.max(0, currentLikes - 1);
        await updateDoc(docRef, {
          likes: newLikesCount,
          updatedAt: Timestamp.now()
        });

        // 3. Delete activity
        try {
          const activitiesQuery = query(
            collection(db, 'activities'),
            where('userId', '==', userId),
            where('type', '==', 'photo_like'),
            limit(10)
          );

          const activitiesSnapshot = await getDocs(activitiesQuery);

          // Filter activities for this specific photo
          const relevantActivities = activitiesSnapshot.docs.filter(doc => {
            const data = doc.data();
            return data.metadata?.targetId === photoId;
          });

          if (relevantActivities.length > 0) {
            const deleteActivityPromises = relevantActivities.map(doc => deleteDoc(doc.ref));
            await Promise.all(deleteActivityPromises);
          }
        } catch (activityError) {
          console.error('⚠️ Error deleting activity (non-critical):', activityError);
        }

        // 4. Update owner stats
        if (photoData.authorId) {
          try {
            const { userService } = await import('../user');
            const ownerProfile = await userService.getUserProfile(photoData.authorId);
            if (ownerProfile) {
              await userService.updateUserStats(photoData.authorId, {
                totalLikes: Math.max(0, ownerProfile.stats.totalLikes - 1)
              });
            }
          } catch (statsError) {
            console.error('⚠️ Error updating owner stats (non-critical):', statsError);
          }
        }

        return { liked: false, newLikesCount };

      } else {
        // ========== LIKE ==========

        // 1. Record the like
        await addDoc(this.userLikesCollection, {
          photoId,
          userId,
          createdAt: Timestamp.now()
        });

        // 2. Increment like count
        const newLikesCount = currentLikes + 1;
        await updateDoc(docRef, {
          likes: newLikesCount,
          updatedAt: Timestamp.now()
        });

        // 3. Add activity
        const { userService } = await import('../user');
        await userService.addUserActivity(
          userId,
          'photo_like',
          photoId,
          {
            photoTitle: photoData.description,
            location: photoData.location,
            targetId: photoId
          }
        );

        // 4. Update owner stats
        if (photoData.authorId) {
          const ownerProfile = await userService.getUserProfile(photoData.authorId);
          if (ownerProfile) {
            await userService.updateUserStats(photoData.authorId, {
              totalLikes: ownerProfile.stats.totalLikes + 1
            });
            await userService.checkAndAwardBadges(photoData.authorId);
          }
        }

        return { liked: true, newLikesCount };
      }
    } catch (error) {
      console.error('❌ Error toggling like:', error);
      throw error;
    }
  }

  /**
   * Like a photo (separate method for clarity)
   */
  async likePhoto(photoId: string, userId: string): Promise<number> {
    const result = await this.toggleLike(photoId, userId);
    if (!result.liked) {
      throw new Error('Photo was already liked or unlike operation occurred');
    }
    return result.newLikesCount;
  }

  /**
   * Unlike a photo (separate method for clarity)
   */
  async unlikePhoto(photoId: string, userId: string): Promise<number> {
    const result = await this.toggleLike(photoId, userId);
    if (result.liked) {
      throw new Error('Photo was not liked or like operation occurred');
    }
    return result.newLikesCount;
  }

  /**
   * Check if user liked photo (alias for consistency)
   */
  async checkIfUserLikedPhoto(photoId: string, userId: string): Promise<boolean> {
    return this.hasUserLiked(photoId, userId);
  }
}

// Create singleton instance
export const likeService = new LikeService();
