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
  type: 'photo_upload' | 'photo_like' | 'user_follow' | 'badge_earned' | 'comment_added'| 'person_tagged'; 
  
  metadata?: {
    photoTitle?: string;
    targetUserName?: string;
    badgeName?: string;
    location?: string;
    targetId?: string; // photo ID, user ID, etc.
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

// Leaderboard interfaces
export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  rank: number;
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  locationsCount: number;
  joinDate: string;
  badges: string[];
  recentPhotoUrl?: string;
}

export interface CommunityStats {
  totalMembers: number;
  photosShared: number;
  locationsDocumented: number;
  totalLikes: number;
}

export interface MonthlyHighlights {
  mostActiveLocation: {
    name: string;
    photoCount: number;
  };
  photoOfTheMonth: {
    title: string;
    author: string;
  };
  newMembers: {
    count: number;
    percentageChange: number;
  };
}

// ========================================
// 🔒 USER MODERATION INTERFACES
// ========================================

export type UserStatus = 'active' | 'suspended' | 'banned';

export interface UserSuspension {
  status: UserStatus;
  suspendedUntil?: Timestamp | null; // Kada istječe suspenzija
  suspendReason?: string;
  suspendedAt?: Timestamp;
  suspendedBy?: string; // Admin UID
  bannedAt?: Timestamp;
  banReason?: string;
  bannedBy?: string;
}

// Extended UserProfile s moderation poljima
export interface UserProfileExtended extends UserProfile {
  status?: UserStatus;
  suspendedUntil?: Timestamp | null;
  suspendReason?: string;
  suspendedAt?: Timestamp;
  suspendedBy?: string;
  bannedAt?: Timestamp;
  banReason?: string;
  bannedBy?: string;
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
    
    // ✅ Set absolute values (not incremental)
    Object.entries(statUpdates).forEach(([key, value]) => {
      if (typeof value === 'number') {
        updates[`stats.${key}`] = value; // Direct assignment
      }
    });
    
    console.log(`Updating user ${userId} stats:`, updates);
    await updateDoc(userRef, updates);
    console.log('User stats updated successfully');
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
}

// ✅ Better method: Update stats by recalculating from photos
// Force recalculate stats from actual Firebase data
async forceRecalculateUserStats(userId: string): Promise<void> {
  try {
    console.log(`Force recalculating stats for user ${userId}`);
    
    // Get all user's photos
    const { photoService } = await import('./firebaseService');
    const userPhotos = await photoService.getPhotosByUploader(userId);
    
    console.log(`Found ${userPhotos.length} photos for user`);
    
    // Calculate actual likes from userLikes collection for each photo
    let totalLikes = 0;
    for (const photo of userPhotos) {
      if (photo.id) {
        // Count actual likes from userLikes collection
        const likesQuery = query(
          collection(db, 'userLikes'),
          where('photoId', '==', photo.id)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const actualLikes = likesSnapshot.size;
        
        // Update the photo's like count if it's wrong
        if (photo.likes !== actualLikes) {
          console.log(`Fixing photo ${photo.id}: ${photo.likes} → ${actualLikes} likes`);
          await updateDoc(doc(db, 'photos', photo.id), {
            likes: actualLikes
          });
        }
        
        totalLikes += actualLikes;
      }
    }
    
    // Calculate other stats
    const totalViews = userPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
    const uniqueLocations = new Set(userPhotos.map(photo => photo.location)).size;
    
    // Update user stats with correct values
    await this.updateUserStats(userId, {
      totalPhotos: userPhotos.length,
      totalLikes: totalLikes, // This is the corrected value
      totalViews: totalViews,
      locationsContributed: uniqueLocations
    });
    
    console.log(`Updated user stats:`, {
      totalPhotos: userPhotos.length,
      totalLikes: totalLikes,
      totalViews: totalViews,
      locationsContributed: uniqueLocations
    });
    
  } catch (error) {
    console.error('Error force recalculating user stats:', error);
    throw error;
  }
}

// Fix all photos' like counts based on userLikes collection
async fixAllPhotoLikeCounts(): Promise<void> {
  try {
    console.log('Fixing all photo like counts...');
    
    // Get all photos
    const { photoService } = await import('./firebaseService');
    const allPhotos = await photoService.getAllPhotos();
    
    for (const photo of allPhotos) {
      if (photo.id) {
        // Count actual likes from userLikes collection
        const likesQuery = query(
          collection(db, 'userLikes'),
          where('photoId', '==', photo.id)
        );
        const likesSnapshot = await getDocs(likesQuery);
        const actualLikes = likesSnapshot.size;
        
        // Update if different
        if (photo.likes !== actualLikes) {
          console.log(`Fixing photo ${photo.id}: ${photo.likes} → ${actualLikes} likes`);
          await updateDoc(doc(db, 'photos', photo.id), {
            likes: actualLikes
          });
        }
      }
    }
    
    console.log('All photo like counts fixed!');
  } catch (error) {
    console.error('Error fixing photo like counts:', error);
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
        checkFunction: (_profile, photos) => photos.length >= 1
      },
      {
        id: 'historian',
        name: 'Local Historian',
        description: 'Uploaded 10+ historical photos',
        iconName: 'Medal',
        color: 'bg-purple-500',
        requirement: '10+ photos',
        checkFunction: (_profile, photos) => photos.length >= 10
      },
      {
        id: 'explorer',
        name: 'Heritage Explorer',
        description: 'Contributed to 5+ locations',
        iconName: 'MapPin',
        color: 'bg-green-500',
        requirement: '5+ locations',
        checkFunction: (_profile, photos) => {
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
        checkFunction: (_profile, photos) => photos.length >= 50
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

  // Get leaderboard data
  async getLeaderboard(
    timePeriod: 'all-time' | 'this-year' | 'this-month' = 'all-time', 
    limitCount: number = 10
  ): Promise<{
    photos: LeaderboardUser[];
    likes: LeaderboardUser[];
    locations: LeaderboardUser[];
    recent: LeaderboardUser[];
  }> {
    try {
      // Calculate date filter based on time period
      let dateFilter: Date | null = null;
      const now = new Date();
      
      switch (timePeriod) {
        case 'this-year':
          dateFilter = new Date(now.getFullYear(), 0, 1); // January 1st of current year
          break;
        case 'this-month':
          dateFilter = new Date(now.getFullYear(), now.getMonth(), 1); // 1st of current month
          break;
        default:
          dateFilter = null; // All time
      }

      // Get all users with their stats
      const usersQuery = query(
        collection(db, 'users'),
        orderBy('stats.totalPhotos', 'desc'),
        limit(50) // Get more than needed for processing
      );
      
      const userDocs = await getDocs(usersQuery);
      const users: LeaderboardUser[] = [];

      for (const doc of userDocs.docs) {
        const userData = doc.data() as UserProfile;
        
        // If filtering by time period, calculate stats for that period
        let periodStats = userData.stats;
        if (dateFilter) {
          periodStats = await this.getUserStatsForPeriod(doc.id, dateFilter);
        }

        // Get user's most recent photo for preview
        const recentPhoto = await this.getUserMostRecentPhoto(doc.id);

        users.push({
          uid: doc.id,
          displayName: userData.displayName,
          photoURL: userData.photoURL,
          rank: 0, // Will be set after sorting
          totalPhotos: periodStats.totalPhotos,
          totalLikes: periodStats.totalLikes,
          totalViews: periodStats.totalViews,
          locationsCount: periodStats.locationsContributed,
          joinDate: userData.joinedAt?.toDate()?.toISOString() || new Date().toISOString(),
          badges: userData.badges || [],
          recentPhotoUrl: recentPhoto?.imageUrl
        });
      }

      // Sort and rank users by different criteria
      const photoLeaders = [...users]
        .sort((a, b) => b.totalPhotos - a.totalPhotos)
        .slice(0, limitCount)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      const likeLeaders = [...users]
        .sort((a, b) => b.totalLikes - a.totalLikes)
        .slice(0, limitCount)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      const locationLeaders = [...users]
        .sort((a, b) => b.locationsCount - a.locationsCount)
        .slice(0, limitCount)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      const recentMembers = [...users]
        .sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
        .slice(0, limitCount)
        .map((user, index) => ({ ...user, rank: index + 1 }));

      return {
        photos: photoLeaders,
        likes: likeLeaders,
        locations: locationLeaders,
        recent: recentMembers
      };

    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }

    // Get user stats for a specific time period
  private async getUserStatsForPeriod(userId: string, fromDate: Date): Promise<UserProfile['stats']> {
    try {
      // Get photos uploaded since the date
      const { photoService } = await import('./firebaseService');
      const allPhotos = await photoService.getPhotosByUploader(userId);
      
      const periodPhotos = allPhotos.filter(photo => {
        const photoDate = photo.createdAt?.toDate() || new Date(photo.uploadedAt || 0);
        return photoDate >= fromDate;
      });

      const totalLikes = periodPhotos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalViews = periodPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(periodPhotos.map(photo => photo.location)).size;

      return {
        totalPhotos: periodPhotos.length,
        totalLikes,
        totalViews,
        locationsContributed: uniqueLocations,
        followers: 0, // Not time-dependent
        following: 0  // Not time-dependent
      };
    } catch (error) {
      console.error('Error calculating period stats:', error);
      return {
        totalPhotos: 0,
        totalLikes: 0,
        totalViews: 0,
        locationsContributed: 0,
        followers: 0,
        following: 0
      };
    }
  }

  // Get user's most recent photo
  private async getUserMostRecentPhoto(userId: string) {
    try {
      const { photoService } = await import('./firebaseService');
      const photos = await photoService.getPhotosByUploader(userId);
      
      if (photos.length === 0) return null;
      
      // Sort by creation date and return the most recent
      const sortedPhotos = photos.sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(a.uploadedAt || 0);
        const dateB = b.createdAt?.toDate() || new Date(b.uploadedAt || 0);
        return dateB.getTime() - dateA.getTime();
      });

      return sortedPhotos[0];
    } catch (error) {
      console.error('Error fetching recent photo:', error);
      return null;
    }
  }

  // Get community statistics
  async getCommunityStats(timePeriod: string = 'all-time'): Promise<CommunityStats> {
  try {
    // Date filters based on time period
    let startDate: Date | null = null;
    const now = new Date();
    
    switch (timePeriod) {
      case 'this-month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'this-year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      // 'all-time' - no filter
    }

    // Optimized query for photos with date filter
    let photosQuery = query(
      collection(db, 'photos'),
      where('isApproved', '==', true)
    );
    
    if (startDate) {
      photosQuery = query(
        collection(db, 'photos'),
        where('isApproved', '==', true),
        where('createdAt', '>=', startDate) // ← Promjena ovdje
      );
    }
    
    const [usersSnapshot, photosSnapshot] = await Promise.all([
      getDocs(query(collection(db, 'users'))),
      getDocs(photosQuery)
    ]);

    const totalMembers = usersSnapshot.size;
    const photosShared = photosSnapshot.size;
    
    let totalLikes = 0;
    const locationSet = new Set<string>();
    
    photosSnapshot.docs.forEach(doc => {
      const photo = doc.data();
      totalLikes += photo.likes || 0;
      if (photo.location) locationSet.add(photo.location);
    });

    return {
      totalMembers,
      photosShared,
      locationsDocumented: locationSet.size,
      totalLikes
    };
  } catch (error) {
    console.error('Error fetching community stats:', error);
    return { totalMembers: 0, photosShared: 0, locationsDocumented: 0, totalLikes: 0 };
  }
}

  // Get monthly highlights
  async getMonthlyHighlights(): Promise<MonthlyHighlights> {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      
      // Get photos from this month
      const { photoService } = await import('./firebaseService');
      const allPhotos = await photoService.getAllPhotos();
      
      const thisMonthPhotos = allPhotos.filter(photo => {
        const photoDate = photo.createdAt?.toDate() || new Date(photo.uploadedAt || 0);
        return photoDate >= thisMonth;
      });

      const lastMonthPhotos = allPhotos.filter(photo => {
        const photoDate = photo.createdAt?.toDate() || new Date(photo.uploadedAt || 0);
        return photoDate >= lastMonth && photoDate < thisMonth;
      });

      // Most active location this month
      const locationCounts: { [location: string]: number } = {};
      thisMonthPhotos.forEach(photo => {
        locationCounts[photo.location] = (locationCounts[photo.location] || 0) + 1;
      });

      const mostActiveLocation = Object.entries(locationCounts).reduce(
        (max, [location, count]) => count > max.photoCount ? { name: location, photoCount: count } : max,
        { name: 'No activity', photoCount: 0 }
      );

      // Photo of the month (most liked this month)
      const mostLikedPhoto = thisMonthPhotos.reduce(
        (max, photo) => (photo.likes || 0) > (max?.likes || 0) ? photo : max,
        null as any
      );

      // New members this month
      const usersQuery = query(collection(db, 'users'));
      const userDocs = await getDocs(usersQuery);
      
      const thisMonthMembers = userDocs.docs.filter(doc => {
        const userData = doc.data();
        const joinDate = userData.joinedAt?.toDate() || new Date();
        return joinDate >= thisMonth;
      }).length;

      const lastMonthMembers = userDocs.docs.filter(doc => {
        const userData = doc.data();
        const joinDate = userData.joinedAt?.toDate() || new Date();
        return joinDate >= lastMonth && joinDate < thisMonth;
      }).length;

      const percentageChange = lastMonthMembers > 0 
        ? Math.round(((thisMonthMembers - lastMonthMembers) / lastMonthMembers) * 100)
        : 0;

      return {
        mostActiveLocation,
        photoOfTheMonth: {
          title: mostLikedPhoto?.description || 'No photos this month',
          author: mostLikedPhoto?.author || 'Unknown'
        },
        newMembers: {
          count: thisMonthMembers,
          percentageChange
        }
      };
    } catch (error) {
      console.error('Error fetching monthly highlights:', error);
      return {
        mostActiveLocation: { name: 'Error loading', photoCount: 0 },
        photoOfTheMonth: { title: 'Error loading', author: 'Unknown' },
        newMembers: { count: 0, percentageChange: 0 }
      };
    }
  }

  // Dodaj ovu funkciju u UserService klasu
async getYearlyHighlights(): Promise<MonthlyHighlights> {
  try {
    const now = new Date();
    const thisYear = new Date(now.getFullYear(), 0, 1); // 1. siječnja ove godine
    const lastYear = new Date(now.getFullYear() - 1, 0, 1); // 1. siječnja prošle godine
    
    // Get photos from this year
    const { photoService } = await import('./firebaseService');
    const allPhotos = await photoService.getAllPhotos();
    
    const thisYearPhotos = allPhotos.filter(photo => {
      const photoDate = photo.createdAt?.toDate() || new Date(photo.uploadedAt || 0);
      return photoDate >= thisYear;
    });
    
    // Most active location this year
    const locationCounts: { [location: string]: number } = {};
    thisYearPhotos.forEach(photo => {
      locationCounts[photo.location] = (locationCounts[photo.location] || 0) + 1;
    });

    const mostActiveLocation = Object.entries(locationCounts).reduce(
      (max, [location, count]) => count > max.photoCount ? { name: location, photoCount: count } : max,
      { name: 'No activity', photoCount: 0 }
    );

    // Most popular photo of the year (most liked this year)
    const mostLikedPhoto = thisYearPhotos.reduce(
      (max, photo) => (photo.likes || 0) > (max?.likes || 0) ? photo : max,
      null as any
    );

    // New members this year
    const usersQuery = query(collection(db, 'users'));
    const userDocs = await getDocs(usersQuery);
    
    const thisYearMembers = userDocs.docs.filter(doc => {
      const userData = doc.data();
      const joinDate = userData.joinedAt?.toDate() || new Date();
      return joinDate >= thisYear;
    }).length;

    const lastYearMembers = userDocs.docs.filter(doc => {
       const userData = doc.data();
  const joinDate = userData.joinedAt?.toDate() || new Date();
  return joinDate >= lastYear && joinDate < thisYear; // Promijeni endOfLastYear u thisYear
}).length;

    const percentageChange = lastYearMembers > 0 
      ? Math.round(((thisYearMembers - lastYearMembers) / lastYearMembers) * 100)
      : 0;

    return {
      mostActiveLocation,
      photoOfTheMonth: { // Naziv ostaje isti za kompatibilnost s interfaceom
        title: mostLikedPhoto?.description || 'No photos this year',
        author: mostLikedPhoto?.author || 'Unknown'
      },
      newMembers: {
        count: thisYearMembers,
        percentageChange
      }
    };
  } catch (error) {
    console.error('Error fetching yearly highlights:', error);
    return {
      mostActiveLocation: { name: 'Error loading', photoCount: 0 },
      photoOfTheMonth: { title: 'Error loading', author: 'Unknown' },
      newMembers: { count: 0, percentageChange: 0 }
    };
  }
}

// ========================================
// 👥 USER MANAGEMENT & MODERATION
// ========================================

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
    
    console.log(`✅ User ${userId} suspended for ${days} days`);
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
    
    console.log(`✅ User ${userId} banned permanently`);
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
    
    console.log(`✅ User ${userId} unsuspended`);
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
    
    console.log(`✅ User ${userId} unbanned`);
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
    const userProfile = await this.getUserProfile(userId);
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
    console.log(`⚠️ Starting permanent deletion of user ${userId}`);
    
    // 1. Delete user's photos
    const { photoService } = await import('./firebaseService');
    const userPhotos = await photoService.getPhotosByUploader(userId);
    
    for (const photo of userPhotos) {
      if (photo.id) {
        await photoService.deletePhoto(photo.id);
      }
    }
    console.log(`✅ Deleted ${userPhotos.length} photos`);
    
    // 2. Delete user's comments
    const commentsQuery = query(
      collection(db, 'comments'),
      where('userId', '==', userId)
    );
    const commentsSnapshot = await getDocs(commentsQuery);
    for (const commentDoc of commentsSnapshot.docs) {
      await deleteDoc(commentDoc.ref);
    }
    console.log(`✅ Deleted ${commentsSnapshot.size} comments`);
    
    // 3. Delete user's tags
    const tagsQuery = query(
      collection(db, 'taggedPersons'),
      where('addedByUid', '==', userId)
    );
    const tagsSnapshot = await getDocs(tagsQuery);
    for (const tagDoc of tagsSnapshot.docs) {
      await deleteDoc(tagDoc.ref);
    }
    console.log(`✅ Deleted ${tagsSnapshot.size} tags`);
    
    // 4. Delete user's activities
    const activitiesQuery = query(
      collection(db, 'activities'),
      where('userId', '==', userId)
    );
    const activitiesSnapshot = await getDocs(activitiesQuery);
    for (const activityDoc of activitiesSnapshot.docs) {
      await deleteDoc(activityDoc.ref);
    }
    console.log(`✅ Deleted ${activitiesSnapshot.size} activities`);
    
    // 5. Delete user's likes
    const likesQuery = query(
      collection(db, 'userLikes'),
      where('userId', '==', userId)
    );
    const likesSnapshot = await getDocs(likesQuery);
    for (const likeDoc of likesSnapshot.docs) {
      await deleteDoc(likeDoc.ref);
    }
    console.log(`✅ Deleted ${likesSnapshot.size} likes`);
    
    // 6. Delete user's views
    const viewsQuery = query(
      collection(db, 'userViews'),
      where('userId', '==', userId)
    );
    const viewsSnapshot = await getDocs(viewsQuery);
    for (const viewDoc of viewsSnapshot.docs) {
      await deleteDoc(viewDoc.ref);
    }
    console.log(`✅ Deleted ${viewsSnapshot.size} views`);
    
    // 7. Delete follows
    const followsQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    const followsSnapshot = await getDocs(followsQuery);
    for (const followDoc of followsSnapshot.docs) {
      await deleteDoc(followDoc.ref);
    }
    console.log(`✅ Deleted ${followsSnapshot.size} follows`);
    
    // 8. Finally, delete user document
    await deleteDoc(doc(db, 'users', userId));
    console.log(`✅ Deleted user document`);
    
    console.log(`✅ User ${userId} and all associated data deleted permanently`);
  } catch (error) {
    console.error('Error deleting user account:', error);
    throw error;
  }
}
}

export const userService = new UserService();