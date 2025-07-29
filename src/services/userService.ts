// src/services/userService.ts - Prilagođeno tvojoj Firebase strukturi
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  deleteDoc,
  onSnapshot,
  orderBy,
  limit,
  serverTimestamp,
  increment,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase'; // Koristi tvoju Firebase konfiguraciju

// Koristit ću Timestamp iz tvoje Firebase konfiguracije
const timestamp = () => Timestamp.now();

// Extended user profile interface
export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: any;
  lastActive: any;
  stats: {
    totalPhotos: number;
    totalLikes: number;
    totalViews: number;
    locationsContributed: number;
    followers: number;
    following: number;
  };
  badges: string[];
  settings: {
    isProfilePublic: boolean;
    allowFollows: boolean;
    emailNotifications: boolean;
  };
}

// Follow relationship interface
export interface FollowRelationship {
  id?: string;
  followerId: string;
  followingId: string;
  createdAt: any;
}

// User activity interface
export interface UserActivity {
  id?: string;
  userId: string;
  type: 'photo_upload' | 'photo_like' | 'user_follow' | 'badge_earned' | 'comment_added';
  targetId?: string; // photo ID, user ID, etc.
  metadata?: {
    photoTitle?: string;
    targetUserName?: string;
    badgeName?: string;
    location?: string;
  };
  createdAt: any;
}

// Badge definition interface
export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  requirement: string;
  checkFunction: (profile: UserProfile, photos: any[]) => boolean;
}

class UserService {
  // Create or update user profile
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

  // Get user profile by ID
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  // Update user profile
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

  // Follow/Unfollow user functions
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
      await this.addUserActivity(followerId, 'user_follow', followingId, {
        targetUserName: (await this.getUserProfile(followingId))?.displayName
      });

    } catch (error) {
      console.error('Error following user:', error);
      throw error;
    }
  }

  async unfollowUser(followerId: string, followingId: string): Promise<void> {
    try {
      // Find and delete follow relationship
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', followerId),
        where('followingId', '==', followingId)
      );
      
      const followDocs = await getDocs(followsQuery);
      
      for (const followDoc of followDocs.docs) {
        await deleteDoc(followDoc.ref);
      }

      // Update counts
      const followingUserRef = doc(db, 'users', followingId);
      await updateDoc(followingUserRef, {
        'stats.followers': increment(-1)
      });

      const followerUserRef = doc(db, 'users', followerId);
      await updateDoc(followerUserRef, {
        'stats.following': increment(-1)
      });

    } catch (error) {
      console.error('Error unfollowing user:', error);
      throw error;
    }
  }

  // Check if user is following another user
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

  // Get user followers
  async getUserFollowers(userId: string): Promise<UserProfile[]> {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followingId', '==', userId)
      );
      
      const followDocs = await getDocs(followsQuery);
      const followerIds = followDocs.docs.map(doc => doc.data().followerId);
      
      const followers: UserProfile[] = [];
      for (const followerId of followerIds) {
        const follower = await this.getUserProfile(followerId);
        if (follower) followers.push(follower);
      }
      
      return followers;
    } catch (error) {
      console.error('Error fetching followers:', error);
      return [];
    }
  }

  // Get users that user is following
  async getUserFollowing(userId: string): Promise<UserProfile[]> {
    try {
      const followsQuery = query(
        collection(db, 'follows'),
        where('followerId', '==', userId)
      );
      
      const followDocs = await getDocs(followsQuery);
      const followingIds = followDocs.docs.map(doc => doc.data().followingId);
      
      const following: UserProfile[] = [];
      for (const followingId of followingIds) {
        const user = await this.getUserProfile(followingId);
        if (user) following.push(user);
      }
      
      return following;
    } catch (error) {
      console.error('Error fetching following:', error);
      return [];
    }
  }

  // Add user activity
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

  // Get user activities
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

  // Update user stats (call this after photo upload, like, etc.)
  async updateUserStats(userId: string, statUpdates: Partial<UserProfile['stats']>): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      const updates: any = {};
      
      Object.entries(statUpdates).forEach(([key, value]) => {
        if (typeof value === 'number') {
          updates[`stats.${key}`] = increment(value);
        }
      });
      
      await updateDoc(userRef, updates);
    } catch (error) {
      console.error('Error updating user stats:', error);
      throw error;
    }
  }

  // Badge system
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    try {
      const userProfile = await this.getUserProfile(userId);
      if (!userProfile) return [];

      // Get user's photos to check badge requirements
      // Koristimo tvoj postojeći photoService
      const { photoService } = await import('./firebaseService');
      const userPhotos = await photoService.getPhotosByUploader(userId);

      const badges = this.getBadgeDefinitions();
      const newBadges: string[] = [];

      for (const badge of badges) {
        if (!userProfile.badges.includes(badge.id) && badge.checkFunction(userProfile, userPhotos)) {
          newBadges.push(badge.id);
          
          // Add activity for badge earned
          await this.addUserActivity(userId, 'badge_earned', undefined, {
            badgeName: badge.name
          });
        }
      }

      if (newBadges.length > 0) {
        await updateDoc(doc(db, 'users', userId), {
          badges: [...userProfile.badges, ...newBadges]
        });
      }

      return newBadges;
    } catch (error) {
      console.error('Error checking badges:', error);
      return [];
    }
  }

  // Badge definitions
  private getBadgeDefinitions(): Badge[] {
    return [
      {
        id: 'photographer',
        name: 'Photographer',
        description: 'Uploaded first photo',
        iconName: 'Camera',
        color: 'bg-blue-500',
        requirement: '1+ photos',
        checkFunction: (profile, photos) => photos.length >= 1
      },
      {
        id: 'historian',
        name: 'Local Historian',
        description: 'Uploaded 10+ historical photos',
        iconName: 'Medal',
        color: 'bg-purple-500',
        requirement: '10+ photos',
        checkFunction: (profile, photos) => photos.length >= 10
      },
      {
        id: 'explorer',
        name: 'Heritage Explorer',
        description: 'Contributed to 5+ locations',
        iconName: 'MapPin',
        color: 'bg-green-500',
        requirement: '5+ locations',
        checkFunction: (profile, photos) => {
          const uniqueLocations = new Set(photos.map(p => p.location));
          return uniqueLocations.size >= 5;
        }
      },
      {
        id: 'popular',
        name: 'Community Favorite',
        description: 'Received 100+ total likes',
        iconName: 'Heart',
        color: 'bg-red-500',
        requirement: '100+ likes',
        checkFunction: (profile) => profile.stats.totalLikes >= 100
      },
      {
        id: 'social',
        name: 'Social Butterfly',
        description: 'Has 50+ followers',
        iconName: 'Users',
        color: 'bg-pink-500',
        requirement: '50+ followers',
        checkFunction: (profile) => profile.stats.followers >= 50
      },
      {
        id: 'veteran',
        name: 'Heritage Veteran',
        description: 'Member for 1+ year',
        iconName: 'Crown',
        color: 'bg-yellow-500',
        requirement: '1+ year',
        checkFunction: (profile) => {
          const joinDate = profile.joinedAt?.toDate ? profile.joinedAt.toDate() : new Date(profile.joinedAt);
          const yearsSince = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
          return yearsSince >= 1;
        }
      },
      {
        id: 'legend',
        name: 'Heritage Legend',
        description: 'Uploaded 50+ photos',
        iconName: 'Trophy',
        color: 'bg-orange-500',
        requirement: '50+ photos',
        checkFunction: (profile, photos) => photos.length >= 50
      }
    ];
  }

  // Search users
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

  // Real-time listener for user profile changes
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

  // Get activity feed (following users' activities)
  async getActivityFeed(userId: string, limitCount: number = 50): Promise<UserActivity[]> {
    try {
      // Get users that current user is following
      const following = await this.getUserFollowing(userId);
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

export const userService = new UserService();