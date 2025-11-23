// src/services/user/userLeaderboardService.ts - Leaderboard and community statistics
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Photo } from '../firebaseService';
import type {
  LeaderboardUser,
  CommunityStats,
  MonthlyHighlights,
  UserProfile
} from '../../types/user.types';
import { userStatsService } from './userStatsService';

class UserLeaderboardService {
  /**
   * Get leaderboard data
   */
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
          periodStats = await userStatsService.getUserStatsForPeriod(doc.id, dateFilter);
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

  /**
   * Get user's most recent photo
   */
  private async getUserMostRecentPhoto(userId: string) {
    try {
      const { photoService } = await import('../firebaseService');
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

  /**
   * Get community statistics
   */
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
          where('createdAt', '>=', startDate)
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

  /**
   * Get monthly highlights
   */
  async getMonthlyHighlights(): Promise<MonthlyHighlights> {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Get photos from this month
      const { photoService } = await import('../firebaseService');
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
      const mostLikedPhoto = thisMonthPhotos.reduce<Photo | null>(
        (max, photo) => (photo.likes || 0) > (max?.likes || 0) ? photo : max,
        null
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

  /**
   * Get yearly highlights
   */
  async getYearlyHighlights(): Promise<MonthlyHighlights> {
    try {
      const now = new Date();
      const thisYear = new Date(now.getFullYear(), 0, 1); // 1. siječnja ove godine
      const lastYear = new Date(now.getFullYear() - 1, 0, 1); // 1. siječnja prošle godine

      // Get photos from this year
      const { photoService } = await import('../firebaseService');
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
      const mostLikedPhoto = thisYearPhotos.reduce<Photo | null>(
        (max, photo) => (photo.likes || 0) > (max?.likes || 0) ? photo : max,
        null
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
        return joinDate >= lastYear && joinDate < thisYear;
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
}

export const userLeaderboardService = new UserLeaderboardService();
