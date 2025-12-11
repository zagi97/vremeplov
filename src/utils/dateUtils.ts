/**
 * Date utility functions for formatting timestamps
 */

import { Timestamp } from 'firebase/firestore';

/**
 * Type for timestamp values - can be Firebase Timestamp or Date
 */
export type TimestampValue = Timestamp | Date | { toDate: () => Date } | string | null | undefined;

/**
 * Translation function type
 */
type TranslationFunction = (key: string) => string;

/**
 * Converts a timestamp value to a Date object
 */
export function toDate(timestamp: TimestampValue): Date | null {
  if (!timestamp) return null;

  // Firebase Timestamp with toDate method
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    return timestamp.toDate();
  }

  // Already a Date object
  if (timestamp instanceof Date) {
    return timestamp;
  }

  // String timestamp
  if (typeof timestamp === 'string') {
    return new Date(timestamp);
  }

  return null;
}

/**
 * Formats a timestamp as relative time (e.g., "2 hours ago", "prije 3 dana")
 *
 * @param timestamp - Firebase Timestamp, Date, or string
 * @param language - Language code ('hr' or 'en')
 * @param t - Translation function
 * @returns Formatted relative time string
 */
export function formatTimeAgo(
  timestamp: TimestampValue,
  language: string,
  t: TranslationFunction
): string {
  const date = toDate(timestamp);
  if (!date) return '';

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return t('notifications.time.justNow');

  if (language === 'hr') {
    if (diffMins < 60) return `${t('notifications.time.ago')} ${diffMins} ${t('notifications.time.min')}`;
    if (diffHours < 24) return `${t('notifications.time.ago')} ${diffHours}${t('notifications.time.hours')}`;
    if (diffDays < 7) return `${t('notifications.time.ago')} ${diffDays}${t('notifications.time.days')}`;
    return date.toLocaleDateString('hr-HR', { day: 'numeric', month: 'short', year: 'numeric' });
  } else {
    if (diffMins < 60) return `${diffMins} ${t('notifications.time.min')}`;
    if (diffHours < 24) return `${diffHours}${t('notifications.time.hours')}`;
    if (diffDays < 7) return `${diffDays}${t('notifications.time.days')}`;
    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}

/**
 * Formats a timestamp as a short date with time
 * Used for activity feeds and user profiles
 *
 * @param timestamp - Firebase Timestamp, Date, or string
 * @returns Formatted date string (e.g., "6. pro 2025, 22:52")
 */
export function formatActivityDate(timestamp: TimestampValue): string {
  const date = toDate(timestamp);
  if (!date) return '';

  return date.toLocaleDateString('hr-HR', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Formats a timestamp as a full date
 *
 * @param timestamp - Firebase Timestamp, Date, or string
 * @param locale - Locale string (default: 'hr-HR')
 * @returns Formatted date string
 */
export function formatFullDate(timestamp: TimestampValue, locale: string = 'hr-HR'): string {
  const date = toDate(timestamp);
  if (!date) return '';

  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Formats a timestamp as time only
 *
 * @param timestamp - Firebase Timestamp, Date, or string
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime(timestamp: TimestampValue): string {
  const date = toDate(timestamp);
  if (!date) return '';

  return date.toLocaleTimeString('hr-HR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}
