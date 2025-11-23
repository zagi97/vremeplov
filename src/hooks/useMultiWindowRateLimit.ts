/**
 * Multi-window rate limiting hook
 * Supports multiple time windows (minute, hour, day) for rate limiting
 * Used for comments, tags, and other user actions with complex rate limits
 */

import { useState, useEffect, useCallback } from 'react';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

/**
 * Time window configuration
 */
export interface TimeWindow {
  /** Maximum requests allowed in this window */
  maxRequests: number;
  /** Duration in milliseconds */
  duration: number;
  /** Label for display (e.g., "per minute", "per hour") */
  label: string;
}

/**
 * Multi-window rate limit configuration
 */
export interface MultiWindowRateLimitConfig {
  /** Firestore collection name to check */
  collectionName: string;
  /** Field name for user ID in Firestore */
  userIdField: string;
  /** Field name for timestamp in Firestore */
  timestampField: string;
  /** Time windows to check (ordered by priority) */
  timeWindows: TimeWindow[];
  /** Additional query filters */
  additionalFilters?: { field: string; value: any }[];
}

/**
 * Rate limit state
 */
export interface MultiWindowRateLimitState {
  /** Whether user is currently rate limited */
  isLimited: boolean;
  /** Reason for rate limit (if limited) */
  reason: string;
  /** Counts per time window */
  counts: number[];
  /** When user can perform action again */
  nextAvailableTime?: Date;
  /** Loading state */
  loading: boolean;
}

/**
 * Hook for multi-window rate limiting
 * @param userId - Current user ID
 * @param config - Rate limit configuration
 * @returns Rate limit state and refresh function
 */
export const useMultiWindowRateLimit = (
  userId: string | undefined,
  config: MultiWindowRateLimitConfig
): [MultiWindowRateLimitState, () => Promise<void>] => {
  const [state, setState] = useState<MultiWindowRateLimitState>({
    isLimited: false,
    reason: '',
    counts: config.timeWindows.map(() => 0),
    loading: false
  });

  /**
   * Check rate limits across all time windows
   */
  const checkRateLimit = useCallback(async () => {
    if (!userId) {
      setState({
        isLimited: false,
        reason: '',
        counts: config.timeWindows.map(() => 0),
        loading: false
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true }));

    try {
      const now = new Date();
      const counts: number[] = [];
      let isLimited = false;
      let reason = '';
      let nextAvailableTime: Date | undefined;

      // Build query
      let q = query(
        collection(db, config.collectionName),
        where(config.userIdField, '==', userId)
      );

      // Add additional filters
      if (config.additionalFilters) {
        config.additionalFilters.forEach(filter => {
          q = query(q, where(filter.field, '==', filter.value));
        });
      }

      const snapshot = await getDocs(q);
      const documents = snapshot.docs.map(doc => {
        const data = doc.data();
        const timestamp = data[config.timestampField];
        return {
          ...data,
          createdAt: timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp)
        };
      });

      // Check each time window
      for (let i = 0; i < config.timeWindows.length; i++) {
        const window = config.timeWindows[i];
        const windowStart = new Date(now.getTime() - window.duration);

        const count = documents.filter(
          doc => doc.createdAt && doc.createdAt > windowStart
        ).length;

        counts.push(count);

        // Check if limit exceeded
        if (count >= window.maxRequests && !isLimited) {
          isLimited = true;
          reason = `Dostigao si limit od ${window.maxRequests} ${window.label}`;

          // Find next available time
          const docsInWindow = documents
            .filter(doc => doc.createdAt && doc.createdAt > windowStart)
            .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

          if (docsInWindow.length > 0) {
            const oldestDoc = docsInWindow[0];
            nextAvailableTime = new Date(oldestDoc.createdAt.getTime() + window.duration);
          }
        }
      }

      setState({
        isLimited,
        reason,
        counts,
        nextAvailableTime,
        loading: false
      });
    } catch (error) {
      console.error('Error checking rate limit:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [userId, config]);

  // Auto-check on mount and when userId changes
  useEffect(() => {
    checkRateLimit();
  }, [checkRateLimit]);

  return [state, checkRateLimit];
};

// ============================================================================
// PRESET CONFIGURATIONS
// ============================================================================

/**
 * Rate limit configuration for photo comments
 */
export const COMMENT_RATE_LIMIT_CONFIG: MultiWindowRateLimitConfig = {
  collectionName: 'comments',
  userIdField: 'userId',
  timestampField: 'createdAt',
  timeWindows: [
    { maxRequests: 2, duration: 60 * 1000, label: 'u minuti' },
    { maxRequests: 15, duration: 60 * 60 * 1000, label: 'po satu' },
    { maxRequests: 30, duration: 24 * 60 * 60 * 1000, label: 'dnevno' }
  ]
};

/**
 * Rate limit configuration for photo tags
 */
export const TAG_RATE_LIMIT_CONFIG: MultiWindowRateLimitConfig = {
  collectionName: 'taggedPersons',
  userIdField: 'taggedBy',
  timestampField: 'taggedAt',
  timeWindows: [
    { maxRequests: 10, duration: 60 * 60 * 1000, label: 'po satu' },
    { maxRequests: 20, duration: 24 * 60 * 60 * 1000, label: 'dnevno' }
  ]
};

/**
 * Hook for comment rate limiting
 */
export const useCommentRateLimit = (userId: string | undefined) => {
  return useMultiWindowRateLimit(userId, COMMENT_RATE_LIMIT_CONFIG);
};

/**
 * Hook for tag rate limiting
 */
export const useTagRateLimit = (userId: string | undefined, photoId?: string) => {
  const config = photoId
    ? {
        ...TAG_RATE_LIMIT_CONFIG,
        additionalFilters: [{ field: 'photoId', value: photoId }]
      }
    : TAG_RATE_LIMIT_CONFIG;

  return useMultiWindowRateLimit(userId, config);
};
