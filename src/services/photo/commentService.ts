// src/services/photo/commentService.ts
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
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { mapDocumentsWithId } from '../../utils/firestoreMappers';
import type { Comment } from '../firebaseService';

export class CommentService {
  private commentsCollection = collection(db, 'comments');
  private photosCollection = collection(db, 'photos');

  // ========================================
  // COMMENT OPERATIONS
  // ========================================

  /**
   * Add comment to photo
   */
  async addComment(photoId: string, text: string, userId: string, userName: string): Promise<string> {
    try {
      const comment: Omit<Comment, 'id'> = {
        photoId,
        userId,
        userName,
        text,
        createdAt: Timestamp.now(),
        isApproved: true
      };

      const docRef = await addDoc(this.commentsCollection, comment);

      // Create user activity
      if (userId) {
        const photoDoc = await getDoc(doc(this.photosCollection, photoId));
        const photoData = photoDoc.data();

        const { userService } = await import('../user');

        await userService.addUserActivity(
          userId,
          'comment_added',
          photoId,
          {
            photoTitle: photoData?.description || 'Unknown photo',
            location: photoData?.location,
            targetId: photoId
          }
        );
      } else {
        console.warn('⚠️ No userId provided - activity not created');
      }

      return docRef.id;
    } catch (error) {
      console.error('❌ Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for photo
   */
  async getCommentsByPhotoId(photoId: string): Promise<Comment[]> {
    try {
      const q = query(
        this.commentsCollection,
        where('photoId', '==', photoId),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<Comment>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting comments:', error);
      throw error;
    }
  }

  // ========================================
  // ADMIN COMMENT MODERATION
  // ========================================

  /**
   * Get all comments for admin moderation
   * OPTIMIZED: Reduced from 200+ queries (for 100 comments) to ~3 queries!
   */
  async getAllCommentsForAdmin(): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      // ✅ OPTIMIZATION 1: Collect all unique user and photo IDs first
      const userIds = new Set<string>();
      const photoIds = new Set<string>();
      const commentsData = snapshot.docs.map(commentDoc => {
        const data = commentDoc.data();
        if (data.userId) userIds.add(data.userId);
        if (data.photoId) photoIds.add(data.photoId);
        return { id: commentDoc.id, ...data };
      });

      // ✅ OPTIMIZATION 2: Batch fetch all users and photos
      const userIdsArray = Array.from(userIds);
      const photoIdsArray = Array.from(photoIds);

      // Fetch users in batches (Firestore 'in' limit is 10)
      const userMap = new Map<string, any>();
      const BATCH_SIZE = 10;

      for (let i = 0; i < userIdsArray.length; i += BATCH_SIZE) {
        const batch = userIdsArray.slice(i, i + BATCH_SIZE);
        const usersQuery = query(collection(db, 'users'), where('uid', 'in', batch));
        const usersSnapshot = await getDocs(usersQuery);
        usersSnapshot.docs.forEach(userDoc => {
          userMap.set(userDoc.id, userDoc.data());
        });
      }

      // Fetch photos in batches
      const photoMap = new Map<string, any>();
      for (let i = 0; i < photoIdsArray.length; i += BATCH_SIZE) {
        const batch = photoIdsArray.slice(i, i + BATCH_SIZE);
        const photosQuery = query(collection(db, 'photos'), where('__name__', 'in', batch));
        const photosSnapshot = await getDocs(photosQuery);
        photosSnapshot.docs.forEach(photoDoc => {
          photoMap.set(photoDoc.id, photoDoc.data());
        });
      }

      // ✅ OPTIMIZATION 3: Map data from pre-fetched maps
      const comments: Comment[] = commentsData.map(data => {
        let userName = 'Unknown User';
        let userEmail = '';

        if (data.userId) {
          const userData = userMap.get(data.userId);
          if (userData) {
            userName = userData.displayName || userData.email || 'Unknown User';
            userEmail = userData.email || '';
          }
        }

        let photoTitle = 'Unknown Photo';
        let photoLocation = '';

        if (data.photoId) {
          const photoData = photoMap.get(data.photoId);
          if (photoData) {
            photoTitle = photoData.description || 'Untitled Photo';
            photoLocation = photoData.location || '';
          }
        }

        return {
          ...data,
          userName,
          userEmail,
          photoTitle,
          photoLocation,
          createdAt: data.createdAt
        } as Comment;
      });

      return comments;

    } catch (error) {
      console.error('❌ Error loading comments for admin:', error);
      throw error;
    }
  }

  /**
   * Delete a comment (admin only)
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await deleteDoc(commentRef);
    } catch (error) {
      console.error('❌ Error deleting comment:', error);
      throw error;
    }
  }

  /**
   * Flag a comment as inappropriate
   */
  async flagComment(commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        isFlagged: true,
        flaggedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ Error flagging comment:', error);
      throw error;
    }
  }

  /**
   * Unflag a comment
   */
  async unflagComment(commentId: string): Promise<void> {
    try {
      const commentRef = doc(db, 'comments', commentId);
      await updateDoc(commentRef, {
        isFlagged: false,
        flaggedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('❌ Error unflagging comment:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const commentService = new CommentService();
