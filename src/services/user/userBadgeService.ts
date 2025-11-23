// src/services/user/userBadgeService.ts - Badge system
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import type { Badge, UserProfile } from '../../types/user.types';
import { userProfileService } from './userProfileService';
import { userActivityService } from './userActivityService';

class UserBadgeService {
  /**
   * Check and award badges
   */
  async checkAndAwardBadges(userId: string): Promise<string[]> {
    try {
      const userProfile = await userProfileService.getUserProfile(userId);
      if (!userProfile) return [];

      // Get user's photos to check badge requirements
      const { photoService } = await import('../firebaseService');
      const userPhotos = await photoService.getPhotosByUploader(userId);

      const badges = this.getBadgeDefinitions();
      const newBadges: string[] = [];

      for (const badge of badges) {
        if (!userProfile.badges.includes(badge.id) && badge.checkFunction(userProfile, userPhotos)) {
          newBadges.push(badge.id);

          // Add activity for badge earned
          await userActivityService.addUserActivity(userId, 'badge_earned', undefined, {
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

  /**
   * Badge definitions
   */
  getBadgeDefinitions(): Badge[] {
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
}

export const userBadgeService = new UserBadgeService();
