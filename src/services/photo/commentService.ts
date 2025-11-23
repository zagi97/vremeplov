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
   */
  async getAllCommentsForAdmin(): Promise<Comment[]> {
    try {
      const commentsRef = collection(db, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const comments: Comment[] = [];

      for (const commentDoc of snapshot.docs) {
        const data = commentDoc.data();

        // Fetch user info
        let userName = 'Unknown User';
        let userEmail = '';

        if (data.userId) {
          try {
            const userDocRef = doc(db, 'users', data.userId);
            const userDoc = await getDoc(userDocRef);
            if (userDoc.exists()) {
              const userData = userDoc.data();
              userName = userData.displayName || userData.email || 'Unknown User';
              userEmail = userData.email || '';
            }
          } catch (error) {
            console.error('Error fetching user for comment:', error);
          }
        }

        // Fetch photo info
        let photoTitle = 'Unknown Photo';
        let photoLocation = '';

        if (data.photoId) {
          try {
            const photoDocRef = doc(db, 'photos', data.photoId);
            const photoDoc = await getDoc(photoDocRef);
            if (photoDoc.exists()) {
              const photoData = photoDoc.data();
              photoTitle = photoData.description || 'Untitled Photo';
              photoLocation = photoData.location || '';
            }
          } catch (error) {
            console.error('Error fetching photo for comment:', error);
          }
        }

        comments.push({
          id: commentDoc.id,
          ...data,
          userName,
          userEmail,
          photoTitle,
          photoLocation,
          createdAt: data.createdAt
        } as Comment);
      }

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
