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
  Timestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '../lib/firebase';

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

// ✅ RATE LIMITING CONSTANTS
const MAX_COMMENTS_PER_MINUTE = 2;
const MAX_COMMENTS_PER_HOUR = 15;
const MAX_COMMENTS_PER_DAY = 30;

const PhotoComments = ({ photoId, photoAuthor, photoAuthorId }: PhotoCommentsProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, signInWithGoogle } = useAuth();
  const { t } = useLanguage();

  // ✅ RATE LIMITING STATE
  const [rateLimitInfo, setRateLimitInfo] = useState<{
    commentsInLastMinute: number;
    commentsInLastHour: number;
    commentsInLastDay: number;
    canComment: boolean;
    nextAvailableTime?: Date;
  }>({
    commentsInLastMinute: 0,
    commentsInLastHour: 0,
    commentsInLastDay: 0,
    canComment: true
  });

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
              ? new Date(data.createdAt.toMillis()).toLocaleDateString('hr-HR', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })
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

  // ✅ CHECK RATE LIMIT - kad se korisnik učita
  useEffect(() => {
    if (!user) return;
    checkUserCommentRateLimit();
  }, [user]);

  // ✅ FUNKCIJA ZA PROVJERU RATE LIMITA
  const checkUserCommentRateLimit = async () => {
  if (!user) return;

  try {
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const commentsRef = collection(db, 'comments');
    
    // ✅ PROMJENA: Samo where userId (bez createdAt)
    const q = query(
      commentsRef,
      where('userId', '==', user.uid)
    );

    const snapshot = await getDocs(q);
    
    // ✅ PROMJENA: Filtriraj client-side umjesto server-side
    const userComments = snapshot.docs
      .map(doc => ({
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }))
      .filter(c => c.createdAt && c.createdAt > oneDayAgo); // ✅ Samo zadnjih 24h

    const commentsInLastMinute = userComments.filter(
      c => c.createdAt && c.createdAt > oneMinuteAgo
    ).length;

    const commentsInLastHour = userComments.filter(
      c => c.createdAt && c.createdAt > oneHourAgo
    ).length;

    const commentsInLastDay = userComments.length;

    let canComment = true;
    let nextAvailableTime: Date | undefined;

    if (commentsInLastMinute >= MAX_COMMENTS_PER_MINUTE) {
      canComment = false;
      const oldestInMinute = userComments
        .filter(c => c.createdAt && c.createdAt > oneMinuteAgo)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      
      if (oldestInMinute?.createdAt) {
        nextAvailableTime = new Date(oldestInMinute.createdAt.getTime() + 60 * 1000);
      }
    } else if (commentsInLastHour >= MAX_COMMENTS_PER_HOUR) {
      canComment = false;
      const oldestInHour = userComments
        .filter(c => c.createdAt && c.createdAt > oneHourAgo)
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      
      if (oldestInHour?.createdAt) {
        nextAvailableTime = new Date(oldestInHour.createdAt.getTime() + 60 * 60 * 1000);
      }
    } else if (commentsInLastDay >= MAX_COMMENTS_PER_DAY) {
      canComment = false;
      const oldestInDay = userComments
        .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
      
      if (oldestInDay?.createdAt) {
        nextAvailableTime = new Date(oldestInDay.createdAt.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    setRateLimitInfo({
      commentsInLastMinute,
      commentsInLastHour,
      commentsInLastDay,
      canComment,
      nextAvailableTime
    });

  } catch (error) {
    console.error('Error checking rate limit:', error);
  }
};

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
    if (!rateLimitInfo.canComment) {
      let errorMessage = '';
      
      if (rateLimitInfo.commentsInLastMinute >= MAX_COMMENTS_PER_MINUTE) {
        errorMessage = `🚫 Možeš objaviti najviše ${MAX_COMMENTS_PER_MINUTE} komentara u minuti.\n\nPričekaj malo! ⏱️`;
      } else if (rateLimitInfo.commentsInLastHour >= MAX_COMMENTS_PER_HOUR) {
        errorMessage = `🚫 Dostigao si limit od ${MAX_COMMENTS_PER_HOUR} komentara po satu.\n\nPokušaj ponovo kasnije! ⏰`;
      } else if (rateLimitInfo.commentsInLastDay >= MAX_COMMENTS_PER_DAY) {
        errorMessage = `🚫 Dostigao si dnevni limit od ${MAX_COMMENTS_PER_DAY} komentara.\n\nVrati se sutra! 📅`;
      }

      toast.error(errorMessage, { duration: 5000 });
      return;
    }

    setIsSubmitting(true);

    try {
      const { photoService } = await import('../services/firebaseService');
      
      await photoService.addComment(
        photoId,
        newComment.trim(),
        user.uid
      );
      
      setNewComment("");
      toast.success(t('comments.commentAdded'));
      
      // ✅ REFRESH rate limit info after successful comment
      await checkUserCommentRateLimit();
      
    } catch (error) {
      console.error('Greška pri dodavanju komentara:', error);
      toast.error(t('comments.postError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // ✅ FORMAT REMAINING TIME
  const formatRemainingTime = (date: Date) => {
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
          {/* ✅ RATE LIMIT WARNING */}
          {!rateLimitInfo.canComment && (
            <div className="mb-4 p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800 mb-1">
                    Dostigao si limit komentara
                  </p>
                  <p className="text-sm text-orange-700">
                    {rateLimitInfo.commentsInLastMinute >= MAX_COMMENTS_PER_MINUTE && (
                      <>Možeš komentirati ponovno {rateLimitInfo.nextAvailableTime && formatRemainingTime(rateLimitInfo.nextAvailableTime)}.</>
                    )}
                    {rateLimitInfo.commentsInLastHour >= MAX_COMMENTS_PER_HOUR && rateLimitInfo.commentsInLastMinute < MAX_COMMENTS_PER_MINUTE && (
                      <>Dostigao si satni limit ({MAX_COMMENTS_PER_HOUR} komentara/sat).</>
                    )}
                    {rateLimitInfo.commentsInLastDay >= MAX_COMMENTS_PER_DAY && rateLimitInfo.commentsInLastHour < MAX_COMMENTS_PER_HOUR && (
                      <>Dostigao si dnevni limit ({MAX_COMMENTS_PER_DAY} komentara/dan).</>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ✅ RATE LIMIT INFO (uvijek prikaži) */}
          <div className="mb-3 text-xs text-gray-500 flex items-center gap-4 flex-wrap">
            <span>
              Minutno: {rateLimitInfo.commentsInLastMinute}/{MAX_COMMENTS_PER_MINUTE}
            </span>
            <span>
              Satno: {rateLimitInfo.commentsInLastHour}/{MAX_COMMENTS_PER_HOUR}
            </span>
            <span>
              Dnevno: {rateLimitInfo.commentsInLastDay}/{MAX_COMMENTS_PER_DAY}
            </span>
          </div>

          <form onSubmit={handleSubmitComment}>
            <Textarea 
              placeholder={t('comments.placeholder')}
              className="min-h-[80px] mb-2 w-full"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={250}
              disabled={!rateLimitInfo.canComment || isSubmitting}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CharacterCounter currentLength={newComment.length} maxLength={250} />
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!newComment.trim() || !rateLimitInfo.canComment || isSubmitting}
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
            className="bg-blue-600 hover:bg-blue-700"
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