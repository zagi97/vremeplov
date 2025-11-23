// src/services/user/userActivityService.ts - User activity tracking
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { UserActivity } from '../../types/user.types';
import { userFollowService } from './userFollowService';

const timestamp = () => Timestamp.now();

class UserActivityService {
  /**
   * Add user activity
   */
  async addUserActivity(
    userId: string,
    type: UserActivity['type'],
    targetId?: string,
    metadata?: UserActivity['metadata']
  ): Promise<void> {
    try {
      await addDoc(collection(db, 'activities'), {
        userId,
        type,
        targetId,
        metadata,
        createdAt: timestamp()
      });
    } catch (error) {
      console.error('Error adding user activity:', error);
    }
  }

  /**
   * Get user activities
   */
  async getUserActivities(userId: string, limitCount: number = 20): Promise<UserActivity[]> {
    try {
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const activityDocs = await getDocs(activitiesQuery);
      return activityDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserActivity[];
    } catch (error) {
      console.error('Error fetching user activities:', error);
      return [];
    }
  }

  /**
   * Get activity feed (following users' activities)
   */
  async getActivityFeed(userId: string, limitCount: number = 50): Promise<UserActivity[]> {
    try {
      // Get users that current user is following
      const following = await userFollowService.getUserFollowing(userId);
      const followingIds = following.map(user => user.uid);

      if (followingIds.length === 0) return [];

      // Get activities from followed users
      const activitiesQuery = query(
        collection(db, 'activities'),
        where('userId', 'in', followingIds.slice(0, 10)), // Firestore limitation
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const activityDocs = await getDocs(activitiesQuery);
      return activityDocs.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserActivity[];
    } catch (error) {
      console.error('Error fetching activity feed:', error);
      return [];
    }
  }
}

export const userActivityService = new UserActivityService();
