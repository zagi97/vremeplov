/**
 * User Profile Helper Functions
 */

import {
  Camera,
  Medal,
  MapPin,
  Heart,
  Users,
  Crown,
  Trophy,
  Award,
} from 'lucide-react';
import { UserActivity } from '@/services/userService';
import { ACTIVITY_DISPLAY } from '@/constants/activityIcons';

export interface BadgeDetails {
  name: string;
  icon: any;
  color: string;
}

/**
 * Get badge details (name, icon, color) for a given badge ID
 */
export const getBadgeDetails = (badgeId: string, t: (key: string) => string): BadgeDetails => {
  const badges: { [key: string]: BadgeDetails } = {
    photographer: {
      name: t('profile.badgePhotographer'),
      icon: Camera,
      color: 'bg-blue-500',
    },
    historian: {
      name: t('profile.badgeHistorian'),
      icon: Medal,
      color: 'bg-purple-500',
    },
    explorer: {
      name: t('profile.badgeExplorer'),
      icon: MapPin,
      color: 'bg-green-500',
    },
    popular: {
      name: t('profile.badgePopular'),
      icon: Heart,
      color: 'bg-red-500',
    },
    social: {
      name: t('profile.badgeSocial'),
      icon: Users,
      color: 'bg-pink-500',
    },
    veteran: {
      name: t('profile.badgeVeteran'),
      icon: Crown,
      color: 'bg-yellow-500',
    },
    legend: {
      name: t('profile.badgeLegend'),
      icon: Trophy,
      color: 'bg-orange-500',
    },
  };

  return badges[badgeId] || { name: badgeId, icon: Award, color: 'bg-gray-500' };
};

/**
 * Get activity display info (icon, color, text) for a given activity type
 */
export const getActivityDisplay = (activityType: string, t: (key: string) => string) => {
  const activityTranslations: { [key: string]: string } = {
    photo_upload: t('profile.activityUploaded'),
    photo_like: t('profile.activityLiked'),
    user_follow: t('profile.activityFollowed'),
    badge_earned: t('profile.activityBadge'),
    comment_added: t('profile.activityComment'),
    person_tagged: t('profile.activityTagged'),
  };

  return {
    ...ACTIVITY_DISPLAY[activityType],
    text: activityTranslations[activityType] || activityType,
  };
};

/**
 * Get navigation link for an activity
 */
export const getActivityLink = (activity: UserActivity): string | null => {
  switch (activity.type) {
    case 'photo_upload':
    case 'photo_like':
    case 'comment_added':
    case 'person_tagged':
      return activity.metadata?.targetId ? `/photo/${activity.metadata.targetId}` : null;
    case 'user_follow':
      return activity.metadata?.targetId ? `/user/${activity.metadata.targetId}` : null;
    default:
      return null;
  }
};
