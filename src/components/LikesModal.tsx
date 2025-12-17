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
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
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
    if (!isOpen || !photoId) return;

    const fetchLikedByUsers = async () => {
      setLoading(true);
      try {
        console.log('[LikesModal] Fetching likes for photoId:', photoId);

        // Get all likes for this photo
        const likesRef = collection(db, 'userLikes');
        const q = query(likesRef, where('photoId', '==', photoId));
        const snapshot = await getDocs(q);

        console.log('[LikesModal] Likes snapshot size:', snapshot.size);
        console.log('[LikesModal] Likes documents:', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));

        // DEBUG: Alert for production debugging
        alert(`🔍 DEBUG:\n\nLikes found: ${snapshot.size}\nPhoto ID: ${photoId}`);

        // Get unique user IDs
        const userIds = Array.from(new Set(snapshot.docs.map(doc => doc.data().userId)));
        console.log('[LikesModal] Unique user IDs:', userIds);

        // DEBUG: Alert user IDs
        alert(`👥 User IDs found:\n\n${userIds.join('\n')}\n\nTotal: ${userIds.length}`);

        // Fetch user details for each user ID
        const userPromises = userIds.map(async (userId) => {
          try {
            console.log('[LikesModal] Fetching user data for userId:', userId);

            // Direct document fetch instead of query
            const userDocRef = doc(db, 'users', userId);
            const userDocSnap = await getDoc(userDocRef);

            if (userDocSnap.exists()) {
              const userData = userDocSnap.data();
              console.log('[LikesModal] User data found:', userData);

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

            console.log('[LikesModal] No user document found for userId:', userId);
            return null;
          } catch (error) {
            console.error('[LikesModal] Error fetching user:', userId, error);
            return null;
          }
        });

        const users = (await Promise.all(userPromises)).filter((u): u is LikedByUser => u !== null);
        console.log('[LikesModal] Final users array:', users);

        // DEBUG: Alert final results
        alert(`✅ Final result:\n\nUsers to display: ${users.length}\nNames: ${users.map(u => u.displayName).join(', ')}`);

        setLikedByUsers(users);
      } catch (error) {
        console.error('[LikesModal] Error fetching liked by users:', error);
        console.error('[LikesModal] Error details:', JSON.stringify(error, null, 2));
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
