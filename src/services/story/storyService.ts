// src/services/story/storyService.ts
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
  limit,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { mapDocumentsWithId } from '../../utils/firestoreMappers';
import type { Story } from '../firebaseService';

// Cache konfiguracija
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuta
const locationStoryCache = new Map<string, { data: Story[], timestamp: number }>();

const isCacheValid = (timestamp: number): boolean => {
  return Date.now() - timestamp < CACHE_DURATION;
};

export class StoryService {
  private storiesCollection = collection(db, 'stories');

  // ========================================
  // STORY CRUD OPERATIONS
  // ========================================

  /**
   * Add new story
   */
  async addStory(storyData: {
    title: string;
    content: string;
    location: string;
  }): Promise<string> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error('Not authenticated');

      const now = Timestamp.now();

      const story = {
        title: storyData.title,
        content: storyData.content,
        location: storyData.location,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || currentUser.email || 'Unknown',
        createdAt: now,
        updatedAt: now,
        likes: 0,
        views: 0,
        isApproved: false,
      };

      const docRef = await addDoc(this.storiesCollection, story);

      // Invalidate cache
      this.clearLocationCache(storyData.location);

      // Add user activity (non-critical)
      try {
        const { userService } = await import('../user');
        await userService.addUserActivity(
          currentUser.uid,
          'story_published',
          docRef.id,
          {
            storyTitle: storyData.title,
            location: storyData.location,
            targetId: docRef.id
          }
        );
      } catch (activityError) {
        console.error('⚠️ Error adding story activity (non-critical):', activityError);
      }

      return docRef.id;
    } catch (error) {
      console.error('Error adding story:', error);
      throw error;
    }
  }

  /**
   * Get story by ID
   */
  async getStoryById(storyId: string): Promise<Story | null> {
    try {
      const docRef = doc(this.storiesCollection, storyId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          likes: docSnap.data().likes ?? 0,
          views: docSnap.data().views ?? 0,
          isApproved: docSnap.data().isApproved ?? false,
        } as Story;
      }
      return null;
    } catch (error) {
      console.error('Error getting story:', error);
      throw error;
    }
  }

  /**
   * Get stories by location (cached)
   */
  async getStoriesByLocation(location: string): Promise<Story[]> {
    try {
      const cacheKey = `location_${location}`;
      const cached = locationStoryCache.get(cacheKey);

      if (cached && isCacheValid(cached.timestamp)) {
        return cached.data;
      }

      const q = query(
        this.storiesCollection,
        where('location', '==', location),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const stories = mapDocumentsWithId<Story>(querySnapshot.docs);

      locationStoryCache.set(cacheKey, { data: stories, timestamp: Date.now() });

      return stories;
    } catch (error) {
      console.error('Error getting stories by location:', error);
      return [];
    }
  }

  /**
   * Get recent stories
   */
  async getRecentStories(limitCount: number = 10): Promise<Story[]> {
    try {
      const q = query(
        this.storiesCollection,
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<Story>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting recent stories:', error);
      return [];
    }
  }

  /**
   * Get all stories for admin dashboard
   */
  async getAllStoriesForAdmin(): Promise<Story[]> {
    try {
      const q = query(
        this.storiesCollection,
        orderBy('createdAt', 'desc'),
        limit(5000)
      );

      const querySnapshot = await getDocs(q);
      return mapDocumentsWithId<Story>(querySnapshot.docs);
    } catch (error) {
      console.error('Error getting all stories for admin:', error);
      return [];
    }
  }

  /**
   * Update story
   */
  async updateStory(storyId: string, updates: Partial<Story>): Promise<void> {
    try {
      const docRef = doc(this.storiesCollection, storyId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating story:', error);
      throw error;
    }
  }

  /**
   * Admin approve story
   */
  async approveStory(storyId: string, adminUid: string): Promise<void> {
    try {
      const storyDoc = await getDoc(doc(this.storiesCollection, storyId));
      if (!storyDoc.exists()) {
        throw new Error('Story not found');
      }

      const storyData = storyDoc.data();

      await updateDoc(doc(this.storiesCollection, storyId), {
        isApproved: true,
        approvedAt: Timestamp.now(),
        approvedBy: adminUid
      });

      // Clear cache
      if (storyData.location) {
        this.clearLocationCache(storyData.location);
      }

      // Send notification
      if (storyData.authorId) {
        try {
          const { notificationService } = await import('../notificationService');
          await notificationService.notifyStoryApproved(
            storyData.authorId,
            storyId,
            storyData.title || 'Untitled'
          );
        } catch (notificationError) {
          console.warn('Notification sending failed (non-critical):', notificationError);
        }
      }
    } catch (error) {
      console.error('Error approving story:', error);
      throw error;
    }
  }

  /**
   * Delete story
   */
  async deleteStory(storyId: string): Promise<void> {
    try {
      const storyDoc = await getDoc(doc(this.storiesCollection, storyId));
      if (storyDoc.exists()) {
        const storyData = storyDoc.data();
        if (storyData.location) {
          this.clearLocationCache(storyData.location);
        }
      }

      await deleteDoc(doc(this.storiesCollection, storyId));
    } catch (error) {
      console.error('Error deleting story:', error);
      throw error;
    }
  }

  /**
   * Get user's stories
   */
  async getUserStories(userId: string): Promise<Story[]> {
    try {
      const q = query(
        this.storiesCollection,
        where('authorId', '==', userId)
      );

      const querySnapshot = await getDocs(q);
      const stories = mapDocumentsWithId<Story>(querySnapshot.docs);
      // Sort client-side to avoid requiring composite index
      return stories.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      });
    } catch (error) {
      console.error('Error getting user stories:', error);
      return [];
    }
  }

  // ========================================
  // CACHE MANAGEMENT
  // ========================================

  clearLocationCache(location?: string) {
    if (location) {
      locationStoryCache.delete(`location_${location}`);
    } else {
      locationStoryCache.clear();
    }
  }
}

// Create singleton instance
export const storyService = new StoryService();
