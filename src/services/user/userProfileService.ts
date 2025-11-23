// src/services/user/userProfileService.ts - User profile CRUD operations
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserProfile } from '../../types/user.types';

const timestamp = () => Timestamp.now();

class UserProfileService {
  /**
   * Create or update user profile
   */
  async createUserProfile(uid: string, userData: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', uid);
    const defaultProfile: Partial<UserProfile> = {
      uid,
      joinedAt: timestamp(),
      lastActive: timestamp(),
      stats: {
        totalPhotos: 0,
        totalLikes: 0,
        totalViews: 0,
        locationsContributed: 0,
        followers: 0,
        following: 0,
      },
      badges: [],
      settings: {
        isProfilePublic: true,
        allowFollows: true,
        emailNotifications: true,
      },
      ...userData
    };

    await setDoc(userRef, defaultProfile, { merge: true });
  }

  /**
   * Get user profile by ID
   */
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();

        // Ensure stats object exists with default values for backward compatibility
        const profile: UserProfile = {
          ...data,
          stats: {
            totalPhotos: data.stats?.totalPhotos ?? 0,
            totalLikes: data.stats?.totalLikes ?? 0,
            totalViews: data.stats?.totalViews ?? 0,
            locationsContributed: data.stats?.locationsContributed ?? 0,
            followers: data.stats?.followers ?? 0,
            following: data.stats?.following ?? 0,
          },
          badges: data.badges || [],
        } as UserProfile;

        return profile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
    try {
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        ...updates,
        lastActive: timestamp()
      });
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Search users
   */
  async searchUsers(searchTerm: string, limitCount: number = 10): Promise<UserProfile[]> {
    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('displayName', '>=', searchTerm),
        where('displayName', '<=', searchTerm + '\uf8ff'),
        limit(limitCount)
      );

      const userDocs = await getDocs(usersQuery);
      return userDocs.docs.map(doc => doc.data() as UserProfile);
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Real-time listener for user profile changes
   */
  subscribeToUserProfile(userId: string, callback: (profile: UserProfile | null) => void): () => void {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback(doc.data() as UserProfile);
      } else {
        callback(null);
      }
    });
  }
}

export const userProfileService = new UserProfileService();
