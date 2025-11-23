// src/services/photo/viewService.ts
import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';

export class ViewService {
  private userViewsCollection = collection(db, 'userViews');
  private photosCollection = collection(db, 'photos');

  // ========================================
  // VIEW TRACKING
  // ========================================

  /**
   * Check if user has already viewed this photo
   */
  async hasUserViewed(photoId: string, userId: string): Promise<boolean> {
    try {
      const q = query(
        this.userViewsCollection,
        where('photoId', '==', photoId),
        where('userId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error('Error checking user view:', error);
      return false;
    }
  }

  /**
   * Increment photo views (only if user hasn't viewed before)
   */
  async incrementViews(photoId: string, userId: string): Promise<void> {
    try {
      // Check if user has already viewed this photo
      const hasViewed = await this.hasUserViewed(photoId, userId);
      if (hasViewed) {
        return; // User has already viewed this photo
      }

      // Record the user view
      await addDoc(this.userViewsCollection, {
        photoId,
        userId,
        createdAt: Timestamp.now()
      });

      // Increment the photo's view count
      const docRef = doc(this.photosCollection, photoId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const photoData = docSnap.data();
        const currentViews = photoData.views || 0;
        await updateDoc(docRef, {
          views: currentViews + 1,
          updatedAt: Timestamp.now()
        });

        // Update stats for photo owner
        if (photoData.authorId) {
          const { userService } = await import('../userService');
          await userService.updateUserStats(photoData.authorId, {
            totalViews: 1
          });
        }
      }
    } catch (error) {
      console.error('Error incrementing views:', error);
      // Don't throw error for view counting, it's not critical
    }
  }
}

// Create singleton instance
export const viewService = new ViewService();
