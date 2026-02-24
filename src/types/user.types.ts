// src/types/user.types.ts - User-related type definitions
import { Timestamp } from 'firebase/firestore';

// ========================================
// 🎯 USER TIER SYSTEM
// ========================================

export enum UserTier {
  NEW_USER = 'NEW_USER',           // 0-4 odobrene slike
  VERIFIED = 'VERIFIED',           // 5-19 odobrenih slika
  CONTRIBUTOR = 'CONTRIBUTOR',     // 20-49 odobrenih slika
  POWER_USER = 'POWER_USER'        // 50+ odobrenih slika
}

export const USER_TIER_LIMITS = {
  [UserTier.NEW_USER]: 1,      // 1 slika/dan
  [UserTier.VERIFIED]: 3,      // 3 slike/dan
  [UserTier.CONTRIBUTOR]: 5,   // 5 slika/dan
  [UserTier.POWER_USER]: 10    // 10 slika/dan
};

export const USER_TIER_REQUIREMENTS = {
  [UserTier.VERIFIED]: 5,      // Treba 5 odobrenih slika
  [UserTier.CONTRIBUTOR]: 20,  // Treba 20 odobrenih slika
  [UserTier.POWER_USER]: 50    // Treba 50 odobrenih slika
};

// ========================================
// 👤 USER PROFILE INTERFACES
// ========================================

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  joinedAt: Timestamp;
  lastActive: Timestamp;
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

// ========================================
// 👥 FOLLOW SYSTEM INTERFACES
// ========================================

export interface FollowRelationship {
  id?: string;
  followerId: string;
  followingId: string;
  createdAt: Timestamp;
}

// ========================================
// 📊 USER ACTIVITY INTERFACES
// ========================================

export interface UserActivity {
  id?: string;
  userId: string;
  type: 'photo_upload' | 'photo_like' | 'user_follow' | 'badge_earned' | 'comment_added' | 'person_tagged' | 'story_published' | 'story_liked';
  metadata?: {
    photoTitle?: string;
    storyTitle?: string;
    targetUserName?: string;
    badgeName?: string;
    location?: string;
    targetId?: string; // photo ID, user ID, etc.
  };
  createdAt: Timestamp;
}

// ========================================
// 🏆 BADGE SYSTEM INTERFACES
// ========================================

export interface Badge {
  id: string;
  name: string;
  description: string;
  iconName: string;
  color: string;
  requirement: string;
  checkFunction: (profile: UserProfile, photos: { id: string }[]) => boolean;
}

// ========================================
// 📈 LEADERBOARD INTERFACES
// ========================================

export interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  rank: number;
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  locationsCount: number;
  totalStories: number;
  joinDate: string;
  badges: string[];
  recentPhotoUrl?: string;
}

export interface CommunityStats {
  totalMembers: number;
  photosShared: number;
  locationsDocumented: number;
  totalLikes: number;
  totalStories: number;
}

export interface MonthlyHighlights {
  mostActiveLocation: {
    name: string;
    photoCount: number;
  };
  photoOfTheMonth: {
    id: string | null;
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
  suspendedUntil?: Timestamp | null;
  suspendReason?: string;
  suspendedAt?: Timestamp;
  suspendedBy?: string; // Admin UID
  bannedAt?: Timestamp;
  banReason?: string;
  bannedBy?: string;
}

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
