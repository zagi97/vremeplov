// src/components/PhotoDetails/PhotoStats.tsx
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Heart, Eye, Users, Clock } from "lucide-react";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { User } from 'firebase/auth';
import { LikesModal } from "@/components/LikesModal";

interface PhotoStatsProps {
  photoId: string;
  views: number;
  likes: number;
  taggedPersonsCount: number;
  userHasLiked: boolean;
  likeLoading: boolean;
  user: User | null;
  hasPendingTags: boolean;
  onLike: () => void;
  isPhotoPending?: boolean;
}

export const PhotoStats: React.FC<PhotoStatsProps> = ({
  photoId,
  views,
  likes,
  taggedPersonsCount,
  userHasLiked,
  likeLoading,
  user,
  hasPendingTags,
  onLike,
  isPhotoPending = false
}) => {
  const { t, language } = useLanguage();
  const { signInWithGoogle } = useAuth();
  const [likesModalOpen, setLikesModalOpen] = useState(false);

  const pluralize = (count: number, singular: string, few: string, many: string) => {
    if (language === 'hr') {
      const lastDigit = count % 10;
      const lastTwoDigits = count % 100;
      if (count === 1) return singular;
      if (lastDigit >= 2 && lastDigit <= 4 && !(lastTwoDigits >= 12 && lastTwoDigits <= 14)) return few;
      return many;
    }
    return count === 1 ? singular : many;
  };

  const viewsText = pluralize(views, t('photoDetail.viewsSingular'), t('photoDetail.viewsFew') || t('photoDetail.views'), t('photoDetail.views'));
  const likesText = pluralize(likes, t('photoDetail.likesSingular'), t('photoDetail.likesFew') || t('photoDetail.likes'), t('photoDetail.likes'));

  return (
    <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
      {/* Desktop layout (md and up) - original design */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Eye className="h-5 w-5" />
            <span className="text-sm">{views} {viewsText}</span>
          </div>
          <button
            onClick={() => likes > 0 && setLikesModalOpen(true)}
            className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 ${likes > 0 ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors' : ''}`}
            disabled={likes === 0}
          >
            <Heart className={`h-5 w-5 ${userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm">{likes} {likesText}</span>
          </button>
          {taggedPersonsCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-5 w-5" />
              <span className="text-sm">{taggedPersonsCount} {t('photoDetail.taggedPeople')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              onClick={onLike}
              disabled={likeLoading || isPhotoPending}
              variant={userHasLiked ? "default" : "outline"}
              className={`flex items-center gap-2 ${
                userHasLiked
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
              }`}
            >
              {likeLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Heart className={`h-4 w-4 ${userHasLiked ? "fill-current" : ""}`} />
              )}
              {userHasLiked ? t('photoDetail.unlikePhoto') : t('photoDetail.likePhoto')}
            </Button>
          ) : (
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              disabled={isPhotoPending}
              className="flex items-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <Heart className="h-4 w-4" />
              {t('photoDetail.signInToLike')}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile layout (below md) - stacked design */}
      <div className="md:hidden space-y-3">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Eye className="h-5 w-5" />
            <span className="text-sm">{views} {viewsText}</span>
          </div>
          <button
            onClick={() => likes > 0 && setLikesModalOpen(true)}
            className={`flex items-center gap-2 text-gray-600 dark:text-gray-400 ${likes > 0 ? 'hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors' : ''}`}
            disabled={likes === 0}
          >
            <Heart className={`h-5 w-5 ${userHasLiked ? 'fill-red-500 text-red-500' : ''}`} />
            <span className="text-sm">{likes} {likesText}</span>
          </button>
          {taggedPersonsCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <Users className="h-5 w-5" />
              <span className="text-sm">{taggedPersonsCount} {t('photoDetail.taggedPeople')}</span>
            </div>
          )}
        </div>

        {/* Like Button - full width */}
        <div className="w-full">
          {user ? (
            <Button
              onClick={onLike}
              disabled={likeLoading || isPhotoPending}
              variant={userHasLiked ? "default" : "outline"}
              className={`w-full flex items-center justify-center gap-2 ${
                userHasLiked
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "hover:bg-red-50 dark:hover:bg-red-950 hover:text-red-600 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800"
              }`}
            >
              {likeLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              ) : (
                <Heart className={`h-4 w-4 ${userHasLiked ? "fill-current" : ""}`} />
              )}
              {userHasLiked ? t('photoDetail.unlikePhoto') : t('photoDetail.likePhoto')}
            </Button>
          ) : (
            <Button
              onClick={signInWithGoogle}
              variant="outline"
              disabled={isPhotoPending}
              className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800"
            >
              <Heart className="h-4 w-4" />
              {t('photoDetail.signInToLike')}
            </Button>
          )}
        </div>
      </div>

      {/* Hover instruction for tagged persons */}
      {taggedPersonsCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
            <Users className="h-4 w-4 flex-shrink-0" />
            <span className="hidden md:inline">{t('photo.tag.tip.desktop')}</span>
            <span className="md:hidden">{t('photo.tag.tip.mobile')}</span>
          </p>
        </div>
      )}

      {/* Pending tags notification */}
      {hasPendingTags && (
        <div className="mt-4 p-3 bg-orange-50 dark:bg-orange-900/30 rounded-lg border border-orange-200 dark:border-orange-800">
          <p className="text-sm text-orange-800 dark:text-orange-300 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('photo.tag.pendingInfo')}
          </p>
        </div>
      )}

      <LikesModal
        photoId={photoId}
        isOpen={likesModalOpen}
        onClose={() => setLikesModalOpen(false)}
        totalLikes={likes}
      />
    </div>
  );
};

