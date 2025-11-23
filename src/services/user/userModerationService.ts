// src/services/user/userModerationService.ts - User moderation (suspend, ban, delete)
import {
  doc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserStatus, UserProfileExtended } from '../../types/user.types';
import { userProfileService } from './userProfileService';

class UserModerationService {
  /**
   * Get all users for admin dashboard
   */
  async getAllUsersForAdmin(): Promise<UserProfileExtended[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('joinedAt', 'desc')
      );

      const userDocs = await getDocs(usersQuery);
      return userDocs.docs.map(doc => ({
        uid: doc.id,
        ...doc.data()
      } as UserProfileExtended));
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  /**
   * Suspend user for specific duration
   * @param userId - User UID
   * @param days - Number of days (7, 30, 90)
   * @param reason - Reason for suspension
   * @param adminUid - Admin who suspended
   */
  async suspendUser(userId: string, days: number, reason: string, adminUid: string): Promise<void> {
    try {
      const suspendUntil = new Date();
      suspendUntil.setDate(suspendUntil.getDate() + days);

      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'suspended',
        suspendedAt: Timestamp.now(),
        suspendedUntil: Timestamp.fromDate(suspendUntil),
        suspendReason: reason,
        suspendedBy: adminUid
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      throw error;
    }
  }

  /**
   * Ban user permanently
   * @param userId - User UID
   * @param reason - Reason for ban
   * @param adminUid - Admin who banned
   */
  async banUser(userId: string, reason: string, adminUid: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'banned',
        bannedAt: Timestamp.now(),
        banReason: reason,
        bannedBy: adminUid,
        // Clear suspension data if exists
        suspendedAt: null,
        suspendedUntil: null,
        suspendReason: null,
        suspendedBy: null
      });
    } catch (error) {
      console.error('Error banning user:', error);
      throw error;
    }
  }

  /**
   * Unsuspend user (restore to active)
   * @param userId - User UID
   */
  async unsuspendUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'active',
        suspendedAt: null,
        suspendedUntil: null,
        suspendReason: null,
        suspendedBy: null
      });
    } catch (error) {
      console.error('Error unsuspending user:', error);
      throw error;
    }
  }

  /**
   * Unban user (restore to active)
   * @param userId - User UID
   */
  async unbanUser(userId: string): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: 'active',
        bannedAt: null,
        banReason: null,
        bannedBy: null
      });
    } catch (error) {
      console.error('Error unbanning user:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently suspended or banned
   */
  async checkUserStatus(userId: string): Promise<{
    status: UserStatus;
    canPost: boolean;
    message?: string;
  }> {
    try {
      const userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) {
        return { status: 'active', canPost: true };
      }

      const extendedProfile = userProfile as UserProfileExtended;

      // Check if banned
      if (extendedProfile.status === 'banned') {
        return {
          status: 'banned',
          canPost: false,
          message: `Your account has been permanently banned. Reason: ${extendedProfile.banReason || 'No reason provided'}`
        };
      }

      // Check if suspended
      if (extendedProfile.status === 'suspended' && extendedProfile.suspendedUntil) {
        const suspendUntilDate = extendedProfile.suspendedUntil.toDate();
        const now = new Date();

        if (now < suspendUntilDate) {
          // Still suspended
          return {
            status: 'suspended',
            canPost: false,
            message: `Your account is suspended until ${suspendUntilDate.toLocaleDateString('hr-HR')}. Reason: ${extendedProfile.suspendReason || 'No reason provided'}`
          };
        } else {
          // Suspension expired - auto unsuspend
          await this.unsuspendUser(userId);
          return {
            status: 'active',
            canPost: true,
            message: 'Your suspension has expired. Welcome back!'
          };
        }
      }

      return { status: 'active', canPost: true };
    } catch (error) {
      console.error('Error checking user status:', error);
      return { status: 'active', canPost: true };
    }
  }

  /**
   * Delete user account permanently (GDPR compliance)
   * WARNING: This deletes ALL user data!
   */
  async deleteUserAccount(userId: string): Promise<void> {
    try {
      // 1. Delete user's photos
      const { photoService } = await import('../firebaseService');
      const userPhotos = await photoService.getPhotosByUploader(userId);

      for (const photo of userPhotos) {
        if (photo.id) {
          await photoService.deletePhoto(photo.id);
        }
      }

      // 2. Delete user's comments
      const commentsQuery = query(
        collection(db, 'comments'),
        where('userId', '==', userId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      for (const commentDoc of commentsSnapshot.docs) {
        await deleteDoc(commentDoc.ref);
      }

      // 3. Delete user's tags
      const tagsQuery = query(
        collection(db, 'taggedPersons'),
        where('addedByUid', '==', userId)
      );
      const tagsSnapshot = await getDocs(tagsQuery);
      for (const tagDoc of tagsSnapshot.docs) {
        await deleteDoc(tagDoc.ref);
      }

      // 4. Delete user's activities
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId)
      );
      const activitiesSnapshot = await getDocs(activitiesQuery);
      for (const activityDoc of activitiesSnapshot.docs) {
        await deleteDoc(activityDoc.ref);
      }

      // 5. Delete user's likes
      const likesQuery = query(
        collection(db, 'userLikes'),
        where('userId', '==', userId)
      );
      const likesSnapshot = await getDocs(likesQuery);
      for (const likeDoc of likesSnapshot.docs) {
        await deleteDoc(likeDoc.ref);
      }

      // 6. Delete user's views
      const viewsQuery = query(
        collection(db, 'userViews'),
        where('userId', '==', userId)
      );
      const viewsSnapshot = await getDocs(viewsQuery);
      for (const viewDoc of viewsSnapshot.docs) {
        await deleteDoc(viewDoc.ref);
      }

      // 7. Delete follows
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      const followsSnapshot = await getDocs(followsQuery);
      for (const followDoc of followsSnapshot.docs) {
        await deleteDoc(followDoc.ref);
      }

      // 8. Finally, delete user document
      await deleteDoc(doc(db, 'users', userId));
    } catch (error) {
      console.error('Error deleting user account:', error);
      throw error;
    }
  }
}

export const userModerationService = new UserModerationService();
