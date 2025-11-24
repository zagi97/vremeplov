// src/services/user/userFollowService.ts - Follow/unfollow functionality
import {
  doc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  updateDoc,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserProfile } from '../../types/user.types';
import { userProfileService } from './userProfileService';
import { userActivityService } from './userActivityService';

const timestamp = () => Timestamp.now();

class UserFollowService {
  /**
   * Follow user
   */
  async followUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Check if already following
      const existingFollow = await this.checkIfFollowing(followerId, followingId);
      if (existingFollow) return;

      // Add follow relationship
      await addDoc(collection(db, 'follows'), {
        followerId,
        followingId,
        createdAt: timestamp()
      });

      // Update follower count for the user being followed
      const followingUserRef = doc(db, 'users', followingId);
      await updateDoc(followingUserRef, {
        'stats.followers': increment(1)
      });

      // Update following count for the follower
      const followerUserRef = doc(db, 'users', followerId);
      await updateDoc(followerUserRef, {
        'stats.following': increment(1)
      });

      // Add activity
      const followingUserProfile = await userProfileService.getUserProfile(followingId);
      await userActivityService.addUserActivity(followerId, 'user_follow', followingId, {
        targetUserName: followingUserProfile?.displayName
      });

    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  /**
   * Unfollow user
   * OPTIMIZED: Parallel deletes and updates instead of sequential
   */
  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Find and delete follow relationship
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );

      const followDocs = await getDocs(followsQuery);

      // ✅ OPTIMIZATION: Parallel deletes instead of sequential
      const deletePromises = followDocs.docs.map(followDoc => deleteDoc(followDoc.ref));

      // ✅ OPTIMIZATION: Execute deletes and updates in parallel
      const followingUserRef = doc(db, 'users', followingId);
      const followerUserRef = doc(db, 'users', followerId);

      await Promise.all([
        ...deletePromises,
        updateDoc(followingUserRef, { 'stats.followers': increment(-1) }),
        updateDoc(followerUserRef, { 'stats.following': increment(-1) })
      ]);

    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  /**
   * Check if user is following another user
   */
  async checkIfFollowing(followerId: string, followingId: string): Promise<boolean> {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );

      const followDocs = await getDocs(followsQuery);
      return !followDocs.empty;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  /**
   * Get user followers - Optimized with batch fetching
   */
  async getUserFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );

      const followDocs = await getDocs(followsQuery);
      const followerIds = followDocs.docs.map(doc => doc.data().followerId);

      if (followerIds.length === 0) return [];

      // Firestore 'in' operator limit is 10, so batch requests
      const followers: UserProfile[] = [];
      const BATCH_SIZE = 10;

      for (let i = 0; i < followerIds.length; i += BATCH_SIZE) {
        const batch = followerIds.slice(i, i + BATCH_SIZE);
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', 'in', batch)
        );

        const userDocs = await getDocs(usersQuery);
        userDocs.docs.forEach(doc => {
          const data = doc.data();
          followers.push({
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
          } as UserProfile);
        });
      }

      return followers;
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  /**
   * Get users that user is following - Optimized with batch fetching
   */
  async getUserFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );

      const followDocs = await getDocs(followsQuery);
      const followingIds = followDocs.docs.map(doc => doc.data().followingId);

      if (followingIds.length === 0) return [];

      // Firestore 'in' operator limit is 10, so batch requests
      const following: UserProfile[] = [];
      const BATCH_SIZE = 10;

      for (let i = 0; i < followingIds.length; i += BATCH_SIZE) {
        const batch = followingIds.slice(i, i + BATCH_SIZE);
        const usersQuery = query(
          collection(db, 'users'),
          where('uid', 'in', batch)
        );

        const userDocs = await getDocs(usersQuery);
        userDocs.docs.forEach(doc => {
          const data = doc.data();
          following.push({
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
          } as UserProfile);
        });
      }

      return following;
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }
}

export const userFollowService = new UserFollowService();
