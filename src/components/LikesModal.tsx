// src/components/LikesModal.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, getDoc, limit } from 'firebase/firestore';
import { getAvatarColor, getUserInitials } from "@/utils/avatarUtils";
import { cn } from "@/lib/utils";

interface LikedByUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  email?: string;
}

interface LikesModalProps {
  photoId: string;
  isOpen: boolean;
  onClose: () => void;
  totalLikes: number;
}

export const LikesModal: React.FC<LikesModalProps> = ({
  photoId,
  isOpen,
  onClose,
  totalLikes
}) => {
  const { t } = useLanguage();
  const [likedByUsers, setLikedByUsers] = useState<LikedByUser[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !photoId) {
      // Debug: Store why modal didn't fetch
      (window as any).__likesModalDebug = {
        reason: 'Modal not opened or photoId missing',
        isOpen,
        photoId,
        timestamp: new Date().toISOString()
      };
      return;
    }

    const fetchLikedByUsers = async () => {
      setLoading(true);
      try {
        // Get all likes for this photo
        const likesRef = collection(db, 'userLikes');
        const q = query(likesRef, where('photoId', '==', photoId), limit(100));
        const snapshot = await getDocs(q);

        // Get unique user IDs
        const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId)));

        // Fetch user details for each user ID
        const userPromises = userIds.map(async (userId) => {
          try {
            // Direct document fetch instead of query
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();

              // Better fallback chain for displayName
              const displayName = userData.displayName
                || userData.email?.split('@')[0]
                || `User-${userId.substring(0, 8)}`
                || 'Unknown User';

              return {
                uid: userId,
                displayName,
                photoURL: userData.photoURL,
                email: userData.email
              };
            }

            return null;
          } catch (error) {
            console.error('[LikesModal] Error fetching user:', userId, error);
            return null;
          }
        });

        const users = (await Promise.all(userPromises)).filter((u): u is LikedByUser => u !== null);

        // Store debug info in window for inspection
        (window as any).__likesModalDebug = {
          photoId,
          likesCount: snapshot.size,
          userIds,
          usersFound: users.length,
          users: users.map(u => ({ uid: u.uid, displayName: u.displayName })),
          timestamp: new Date().toISOString()
        };

        setLikedByUsers(users);
      } catch (error) {
        console.error('[LikesModal] Error fetching liked by users:', error);
        // Store debug info in window for inspection
        (window as any).__likesModalDebug = {
          error,
          photoId,
          timestamp: new Date().toISOString()
        };
      } finally {
        setLoading(false);
      }
    };

    fetchLikedByUsers();
  }, [isOpen, photoId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md dark:bg-gray-800 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            {t('photoDetail.likedBy')}
          </DialogTitle>
        </DialogHeader>

        <div className="mt-4 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-2">
                  <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : likedByUsers.length > 0 ? (
            <div className="space-y-2">
              {likedByUsers.map((user) => (
                <Link
                  key={user.uid}
                  to={`/user/${user.uid}`}
                  onClick={onClose}
                  className="flex items-center gap-3 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback className={cn(getAvatarColor(user.uid), "text-white")}>
                      {getUserInitials(user.displayName, user.email || null)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
                    {user.displayName}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">
              {t('photoDetail.noLikesYet')}
            </p>
          )}
        </div>

        {!loading && likedByUsers.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
              {totalLikes} {totalLikes === 1 ? t('photoDetail.person') : t('photoDetail.people')}
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
