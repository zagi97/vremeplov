import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage, translateWithParams } from '../contexts/LanguageContext';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from '../services/notificationService';
import { useCommentRateLimit, COMMENT_RATE_LIMIT_CONFIG } from '@/hooks/useMultiWindowRateLimit';

export interface Comment {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  date: string;
  photoId: string;
}

interface UsePhotoCommentsParams {
  photoId: string;
  photoAuthor?: string;
  photoAuthorId?: string;
  isPhotoPending?: boolean;
  isStory?: boolean;
  storyTitle?: string;
}

export function usePhotoComments({
  photoId,
  photoAuthor,
  photoAuthorId,
  isPhotoPending = false,
  isStory = false,
  storyTitle,
}: UsePhotoCommentsParams) {
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const [visibleCount, setVisibleCount] = useState(10);
  const COMMENTS_PER_PAGE = 10;

  // Rate limiting
  const [rateLimitState, refreshRateLimit] = useCommentRateLimit(user?.uid);
  const [recentSubmissions, setRecentSubmissions] = useState<number[]>([]);

  const MAX_COMMENTS_PER_MINUTE = COMMENT_RATE_LIMIT_CONFIG.timeWindows[0].maxRequests;
  const MAX_COMMENTS_PER_HOUR = COMMENT_RATE_LIMIT_CONFIG.timeWindows[1].maxRequests;
  const MAX_COMMENTS_PER_DAY = COMMENT_RATE_LIMIT_CONFIG.timeWindows[2].maxRequests;

  // Fetch comments
  const fetchComments = useCallback(async () => {
    if (!photoId) {
      setLoading(false);
      return;
    }

    try {
      const commentsRef = collection(db, 'comments');
      const q = query(
        commentsRef,
        where('photoId', '==', photoId),
        where('isApproved', '==', true),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const fetchedComments: Comment[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        fetchedComments.push({
          id: doc.id,
          userId: data.userId || '',
          userName: data.userName || 'Nepoznato',
          text: data.text || '',
          photoId: data.photoId || '',
          date: data.createdAt
            ? (() => {
                const date = new Date(data.createdAt.toMillis());
                const day = String(date.getDate()).padStart(2, '0');
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const year = date.getFullYear();
                const hours = String(date.getHours()).padStart(2, '0');
                const minutes = String(date.getMinutes()).padStart(2, '0');
                return `${day}.${month}.${year}. ${hours}:${minutes}`;
              })()
            : 'Upravo sad',
        });
      });

      setComments(fetchedComments);
    } catch (error) {
      console.error('Greška pri dohvaćanju komentara:', error);
      toast.error(t('comments.loadError'));
    } finally {
      setLoading(false);
    }
  }, [photoId, t]);

  // Load comments on mount
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Rate limit calculations
  const commentsInLastMinute = rateLimitState.counts[0] || 0;
  const commentsInLastHour = rateLimitState.counts[1] || 0;
  const commentsInLastDay = rateLimitState.counts[2] || 0;

  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const recentSubmissionsInLastMinute = recentSubmissions.filter(ts => ts > oneMinuteAgo).length;
  const totalCommentsInLastMinute = Math.max(commentsInLastMinute, recentSubmissionsInLastMinute);

  const canComment = !isPhotoPending && !rateLimitState.isLimited && totalCommentsInLastMinute < MAX_COMMENTS_PER_MINUTE;

  const loadMoreComments = useCallback(() => {
    setVisibleCount(prev => prev + COMMENTS_PER_PAGE);
  }, [COMMENTS_PER_PAGE]);

  const handleSignInToComment = useCallback(async () => {
    await signInWithGoogle();
  }, [signInWithGoogle]);

  const formatRemainingTime = useCallback((date?: Date) => {
    if (!date) return 'sada';

    const now = new Date();
    const diff = date.getTime() - now.getTime();

    if (diff <= 0) return 'sada';

    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));

    if (hours > 0) return `za ${hours}h`;
    if (minutes > 0) return `za ${minutes} min`;
    return 'uskoro';
  }, []);

  // Get rate limit message for UI
  const getRateLimitMessage = useCallback(() => {
    if (totalCommentsInLastMinute >= MAX_COMMENTS_PER_MINUTE) {
      return translateWithParams(t, 'rateLimit.canCommentAgainIn', { time: formatRemainingTime(rateLimitState.nextAvailableTime) });
    }
    if (commentsInLastHour >= MAX_COMMENTS_PER_HOUR) {
      return translateWithParams(t, 'rateLimit.hourlyLimitReached', { limit: MAX_COMMENTS_PER_HOUR });
    }
    if (commentsInLastDay >= MAX_COMMENTS_PER_DAY) {
      return translateWithParams(t, 'rateLimit.dailyLimitReached', { limit: MAX_COMMENTS_PER_DAY });
    }
    return '';
  }, [totalCommentsInLastMinute, commentsInLastHour, commentsInLastDay, MAX_COMMENTS_PER_MINUTE, MAX_COMMENTS_PER_HOUR, MAX_COMMENTS_PER_DAY, rateLimitState.nextAvailableTime, formatRemainingTime, t]);

  // Get rate limit error message for submit
  const getRateLimitErrorMessage = useCallback(() => {
    if (totalCommentsInLastMinute >= MAX_COMMENTS_PER_MINUTE) {
      return translateWithParams(t, 'rateLimit.errorMinute', { limit: MAX_COMMENTS_PER_MINUTE });
    }
    if (commentsInLastHour >= MAX_COMMENTS_PER_HOUR) {
      return translateWithParams(t, 'rateLimit.errorHour', { limit: MAX_COMMENTS_PER_HOUR });
    }
    if (commentsInLastDay >= MAX_COMMENTS_PER_DAY) {
      return translateWithParams(t, 'rateLimit.errorDay', { limit: MAX_COMMENTS_PER_DAY });
    }
    return '';
  }, [totalCommentsInLastMinute, commentsInLastHour, commentsInLastDay, MAX_COMMENTS_PER_MINUTE, MAX_COMMENTS_PER_HOUR, MAX_COMMENTS_PER_DAY, t]);

  const handleSubmitComment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newComment.trim()) {
      toast.error(t('comments.emptyComment'));
      return;
    }

    if (!user) {
      toast.error(t('comments.mustBeSignedIn'));
      return;
    }

    if (!canComment) {
      const errorMessage = getRateLimitErrorMessage();
      toast.error(errorMessage, { duration: 5000 });
      return;
    }

    setIsSubmitting(true);

    try {
      const { commentService } = await import('../services/photo/commentService');

      await commentService.addComment(
        photoId,
        newComment.trim(),
        user.uid,
        user.displayName || user.email || 'Nepoznato'
      );

      // Track this submission client-side
      const submissionTime = Date.now();
      setRecentSubmissions(prev => {
        const oneMinuteAgo = submissionTime - 60 * 1000;
        return [...prev.filter(ts => ts > oneMinuteAgo), submissionTime];
      });

      // Send notification to photo/story owner
      if (photoAuthorId && photoAuthorId !== user.uid) {
        try {
          if (isStory) {
            await notificationService.notifyStoryComment(
              photoAuthorId,
              user.uid,
              user.displayName || 'Anonymous',
              photoId,
              storyTitle || 'priča',
              user.photoURL || undefined
            );
          } else {
            await notificationService.notifyNewComment(
              photoAuthorId,
              user.uid,
              user.displayName || 'Anonymous',
              photoId,
              photoAuthor || 'untitled photo',
              user.photoURL || undefined
            );
          }
        } catch (notifError) {
          console.error('Failed to send comment notification:', notifError);
        }
      }

      setNewComment('');
      toast.success(t('comments.commentAdded'));

      // Refresh rate limit info
      await refreshRateLimit();
      setTimeout(() => {
        refreshRateLimit();
      }, 1000);

      // Refresh comments
      await fetchComments();
    } catch (error) {
      console.error('Greška pri dodavanju komentara:', error);
      toast.error(t('comments.postError'));
    } finally {
      setIsSubmitting(false);
    }
  }, [newComment, user, canComment, getRateLimitErrorMessage, photoId, photoAuthorId, isStory, storyTitle, photoAuthor, refreshRateLimit, fetchComments, t]);

  return {
    // State
    comments,
    newComment,
    setNewComment,
    loading,
    isSubmitting,
    visibleCount,
    canComment,
    user,

    // Rate limit info
    isPhotoPending,
    getRateLimitMessage,

    // Handlers
    handleSubmitComment,
    handleSignInToComment,
    loadMoreComments,

    // i18n
    t,
  };
}
