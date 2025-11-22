/**
 * Centralized icon and color configuration for notifications and activities
 */

import {
  MessageCircle,
  Heart,
  UserPlus,
  Tag,
  Award,
  CheckCheck,
  X,
  Edit,
  Trash2,
  Ban,
  ShieldAlert,
  ShieldCheck,
  AlertCircle,
  Camera
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

/**
 * Icon configuration type
 */
export interface IconConfig {
  icon: LucideIcon;
  color: string;
}

/**
 * Activity display configuration (for user profiles)
 */
export interface ActivityConfig extends IconConfig {
  text: string;
}

/**
 * Notification icon configurations
 * Used in NotificationCenter and Notifications pages
 */
export const NOTIFICATION_ICONS: Record<string, IconConfig> = {
  new_comment: { icon: MessageCircle, color: 'text-blue-600 bg-blue-50' },
  new_like: { icon: Heart, color: 'text-red-600 bg-red-50' },
  new_follower: { icon: UserPlus, color: 'text-green-600 bg-green-50' },
  new_tag: { icon: Tag, color: 'text-orange-600 bg-orange-50' },
  badge_earned: { icon: Award, color: 'text-yellow-600 bg-yellow-50' },
  photo_approved: { icon: CheckCheck, color: 'text-green-600 bg-green-50' },
  photo_rejected: { icon: X, color: 'text-red-600 bg-red-50' },
  photo_edited: { icon: Edit, color: 'text-blue-600 bg-blue-50' },
  photo_deleted: { icon: Trash2, color: 'text-gray-600 bg-gray-50' },
  tag_approved: { icon: CheckCheck, color: 'text-green-600 bg-green-50' },
  tag_rejected: { icon: X, color: 'text-red-600 bg-red-50' },
  comment_deleted: { icon: Trash2, color: 'text-gray-600 bg-gray-50' },
  user_banned: { icon: Ban, color: 'text-red-600 bg-red-50' },
  user_suspended: { icon: ShieldAlert, color: 'text-orange-600 bg-orange-50' },
  user_unbanned: { icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
  user_unsuspended: { icon: ShieldCheck, color: 'text-green-600 bg-green-50' }
};

/**
 * Activity display configurations (for user profiles)
 */
export const ACTIVITY_DISPLAY: Record<string, ActivityConfig> = {
  photo_upload: { text: 'uploaded a photo', icon: Camera, color: 'text-blue-600' },
  photo_like: { text: 'liked a photo', icon: Heart, color: 'text-red-600' },
  user_follow: { text: 'started following', icon: UserPlus, color: 'text-green-600' },
  badge_earned: { text: 'earned a badge', icon: Award, color: 'text-yellow-600' },
  comment_added: { text: 'added a comment', icon: MessageCircle, color: 'text-purple-600' },
  person_tagged: { text: 'tagged someone in', icon: Tag, color: 'text-orange-600' }
};

/**
 * Default fallback icon for unknown notification types
 */
export const DEFAULT_NOTIFICATION_ICON: IconConfig = {
  icon: AlertCircle,
  color: 'text-gray-600 bg-gray-50'
};

/**
 * Gets notification icon configuration by type
 *
 * @param type - Notification type
 * @returns Icon configuration with icon component and color classes
 */
export function getNotificationIcon(type: string): IconConfig {
  return NOTIFICATION_ICONS[type] || DEFAULT_NOTIFICATION_ICON;
}

/**
 * Gets activity display configuration by type
 *
 * @param type - Activity type
 * @returns Activity configuration with icon, text, and color
 */
export function getActivityConfig(type: string): ActivityConfig | undefined {
  return ACTIVITY_DISPLAY[type];
}
