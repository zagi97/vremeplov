// src/components/PhotoComments.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { User, MessageSquare, Send, LogIn, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import { CharacterCounter } from "./ui/character-counter";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { notificationService } from '../services/notificationService';
import { useCommentRateLimit, COMMENT_RATE_LIMIT_CONFIG } from '@/hooks/useMultiWindowRateLimit';

interface Comment {
  id: string;
  userId: string;
  userName?: string;
  text: string;
  date: string;
  timestamp: Timestamp | null;
  photoId: string;
}

interface PhotoCommentsProps {
  photoId: string;
  photoAuthor?: string;
  photoAuthorId?: string;
}

const PhotoComments = ({ photoId, photoAuthor, photoAuthorId }: PhotoCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  // ✅ RATE LIMITING - using centralized hook
  const [rateLimitState, refreshRateLimit] = useCommentRateLimit(user?.uid);

  // ✅ CLIENT-SIDE FALLBACK: Track recent submissions in memory
  const [recentSubmissions, setRecentSubmissions] = useState<number[]>([]);

  // Extract constants for cleaner code
  const MAX_COMMENTS_PER_MINUTE = COMMENT_RATE_LIMIT_CONFIG.timeWindows[0].maxRequests;
  const MAX_COMMENTS_PER_HOUR = COMMENT_RATE_LIMIT_CONFIG.timeWindows[1].maxRequests;
  const MAX_COMMENTS_PER_DAY = COMMENT_RATE_LIMIT_CONFIG.timeWindows[2].maxRequests;

  // LIVE LISTENER za komentare
  useEffect(() => {
    if (!photoId) {
      setLoading(false);
      return;
    }

    const commentsRef = collection(db, 'comments');
    const q = query(
      commentsRef,
      where('photoId', '==', photoId),
      where('isApproved', '==', true),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const fetchedComments: Comment[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          fetchedComments.push({
            id: doc.id,
            userId: data.userId || '',
            userName: data.userName || 'Nepoznato',
            text: data.text || '',
            photoId: data.photoId || '',
            timestamp: data.createdAt || null,
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
              : 'Upravo sad'
          });
        });
        
        setComments(fetchedComments);
        setLoading(false);
      }, 
      (error) => {
        console.error('Greška pri dohvaćanju komentara:', error);
        toast.error(t('comments.loadError'));
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [photoId, t]);

  // Helper getters for cleaner code
  const commentsInLastMinute = rateLimitState.counts[0] || 0;
  const commentsInLastHour = rateLimitState.counts[1] || 0;
  const commentsInLastDay = rateLimitState.counts[2] || 0;

  // ✅ CLIENT-SIDE FALLBACK: Count recent submissions from memory
  const now = Date.now();
  const oneMinuteAgo = now - 60 * 1000;
  const recentSubmissionsInLastMinute = recentSubmissions.filter(ts => ts > oneMinuteAgo).length;

  // Combine Firestore data with client-side tracking
  const totalCommentsInLastMinute = Math.max(commentsInLastMinute, recentSubmissionsInLastMinute);

  const canComment = !rateLimitState.isLimited && totalCommentsInLastMinute < MAX_COMMENTS_PER_MINUTE;

  const handleSignInToComment = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('comments.signInSuccess'));
    } catch (error) {
      console.error('Greška pri prijavi:', error);
      toast.error(t('comments.signInError'));
    }
  };

const handleSubmitComment = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!newComment.trim()) {
    toast.error(t('comments.emptyComment'));
    return;
  }
  
  if (!user) {
    toast.error(t('comments.mustBeSignedIn'));
    return;
  }

  // ✅ RATE LIMIT PROVJERA
  if (!canComment) {
    let errorMessage = '';

    {/* Error poruke pri submitu komentara */}
if (totalCommentsInLastMinute >= MAX_COMMENTS_PER_MINUTE) {
  errorMessage = translateWithParams(t, 'rateLimit.errorMinute', { limit: MAX_COMMENTS_PER_MINUTE });
} else if (commentsInLastHour >= MAX_COMMENTS_PER_HOUR) {
  errorMessage = translateWithParams(t, 'rateLimit.errorHour', { limit: MAX_COMMENTS_PER_HOUR });
} else if (commentsInLastDay >= MAX_COMMENTS_PER_DAY) {
  errorMessage = translateWithParams(t, 'rateLimit.errorDay', { limit: MAX_COMMENTS_PER_DAY });
}

    toast.error(errorMessage, { duration: 5000 });
    return;
  }

  setIsSubmitting(true);

  try {
    const { commentService } = await import('../services/photo/commentService');

    // ✅ Use commentService instead of photoService
    await commentService.addComment(
      photoId,
      newComment.trim(),
      user.uid,
      user.displayName || user.email || 'Nepoznato'
    );

    // ✅ CLIENT-SIDE: Track this submission
    const submissionTime = Date.now();
    setRecentSubmissions(prev => {
      // Add new submission and clean up old ones (older than 1 minute)
      const oneMinuteAgo = submissionTime - 60 * 1000;
      return [...prev.filter(ts => ts > oneMinuteAgo), submissionTime];
    });

    // ✅✅✅ Send notification to photo owner
    if (photoAuthorId && photoAuthorId !== user.uid) {
      try {
        await notificationService.notifyNewComment(
          photoAuthorId,
          user.uid,
          user.displayName || 'Anonymous',
          photoId,
          photoAuthor || 'untitled photo',
          user.photoURL || undefined
        );
      } catch (notifError) {
        console.error('⚠️ Failed to send comment notification:', notifError);
      }
    }

    setNewComment("");
    toast.success(t('comments.commentAdded'));

    // ✅ REFRESH rate limit info after successful comment
    // Immediate refresh to update UI, then again after Firestore indexes
    await refreshRateLimit(); // Immediate
    setTimeout(() => {
      refreshRateLimit(); // After Firestore indexes (1s delay)
    }, 1000);

  } catch (error) {
    console.error('Greška pri dodavanju komentara:', error);
    toast.error(t('comments.postError'));
  } finally {
    setIsSubmitting(false);
  }
};

  // ✅ FORMAT REMAINING TIME
    const formatRemainingTime = (date?: Date) => {
      // If no date is provided, treat as "now"
      if (!date) return 'sada';
  
      const now = new Date();
      const diff = date.getTime() - now.getTime();
      
      if (diff <= 0) return 'sada';
      
      const minutes = Math.floor(diff / (60 * 1000));
      const hours = Math.floor(diff / (60 * 60 * 1000));
      
      if (hours > 0) return `za ${hours}h`;
      if (minutes > 0) return `za ${minutes} min`;
      return 'uskoro';
    };

  return (
    <div className="mt-8 px-4 sm:px-0">
      <h2 className="text-2xl font-bold mb-4 flex items-center">
        <MessageSquare className="h-5 w-5 mr-2 flex-shrink-0" />
        <span>
          {translateWithParams(t, 'comments.title', { count: comments.length })}
        </span>
      </h2>
      
      {user ? (
        <div className="mb-6">
          {/* RATE LIMIT WARNING (naranđasti okvir) */}
{!canComment && (
  <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
    <div className="flex items-start gap-3">
      <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
      <div>
        <p className="font-medium text-orange-800 mb-1">
          {t('rateLimit.commentWarningTitle')}
        </p>
        <p className="text-sm text-orange-700">
          {totalCommentsInLastMinute >= MAX_COMMENTS_PER_MINUTE && (
            <>{translateWithParams(t, 'rateLimit.canCommentAgainIn', { time: formatRemainingTime(rateLimitState.nextAvailableTime) })}</>
          )}
          {commentsInLastHour >= MAX_COMMENTS_PER_HOUR && totalCommentsInLastMinute < MAX_COMMENTS_PER_MINUTE && (
            <>{translateWithParams(t, 'rateLimit.hourlyLimitReached', { limit: MAX_COMMENTS_PER_HOUR })}</>
          )}
          {commentsInLastDay >= MAX_COMMENTS_PER_DAY && commentsInLastHour < MAX_COMMENTS_PER_HOUR && (
            <>{translateWithParams(t, 'rateLimit.dailyLimitReached', { limit: MAX_COMMENTS_PER_DAY })}</>
          )}
        </p>
      </div>
    </div>
  </div>
)}

          {/* ✅ RATE LIMIT INFO (uvijek prikaži) */}
          <div className="mb-3 text-xs text-gray-500 flex items-center gap-4 flex-wrap">
  <span>{t('comments.perMinute')}: {totalCommentsInLastMinute}/{MAX_COMMENTS_PER_MINUTE}</span>
  <span>{t('comments.perHour')}: {commentsInLastHour}/{MAX_COMMENTS_PER_HOUR}</span>
  <span>{t('comments.perDay')}: {commentsInLastDay}/{MAX_COMMENTS_PER_DAY}</span>
</div>

          <form onSubmit={handleSubmitComment}>
            <Textarea
              placeholder={t('comments.placeholder')}
              className="min-h-[80px] mb-2 w-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={250}
              disabled={!canComment || isSubmitting}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CharacterCounter currentLength={newComment.length} maxLength={250} />
              <Button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={!newComment.trim() || !canComment || isSubmitting}
              >
                <Send className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Šaljem...' : t('comments.postComment')}
              </Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="mb-6 p-6 bg-gray-50 rounded-lg text-center">
          <LogIn className="h-8 w-8 mx-auto mb-3 text-gray-400" />
          <p className="text-gray-600 mb-4 px-4">{t('comments.signInMessage')}</p>
          <Button
            onClick={handleSignInToComment}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <LogIn className="h-4 w-4 mr-2" />
            {t('comments.signInToComment')}
          </Button>
        </div>
      )}
      
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
            <p className="text-gray-500 mt-2">{t('comments.loading')}</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">
              {t('comments.noComments')}
            </p>
          </div>
        ) : (
          comments.map((comment) => {
            const isPhotoAuthor = photoAuthorId && comment.userId === photoAuthorId;
            
            return (
              <div 
                key={comment.id} 
                className="bg-gray-50 p-4 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-start justify-between mb-2 gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-600 flex-shrink-0" />
                      <span className="font-medium break-words">
                        {comment.userName || 'Nepoznato'}
                      </span>
                    </div>
                    {isPhotoAuthor && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full whitespace-nowrap">
                        {t('comments.author')}
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-xs sm:text-sm whitespace-nowrap">
                    {comment.date}
                  </span>
                </div>
                <p className="text-gray-700 break-words leading-relaxed">
                  {comment.text}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default PhotoComments;