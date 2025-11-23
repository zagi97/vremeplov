// src/components/PhotoDetails/PhotoStats.tsx
import React from 'react';
import { Button } from "@/components/ui/button";
import { Heart, Eye, Users, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

interface PhotoStatsProps {
  views: number;
  likes: number;
  taggedPersonsCount: number;
  userHasLiked: boolean;
  likeLoading: boolean;
  user: any;
  hasPendingTags: boolean;
  onLike: () => void;
}

export const PhotoStats: React.FC<PhotoStatsProps> = ({
  views,
  likes,
  taggedPersonsCount,
  userHasLiked,
  likeLoading,
  user,
  hasPendingTags,
  onLike
}) => {
  const { t } = useLanguage();

  return (
    <div className="p-6 border-b border-gray-200">
      {/* Desktop layout (md and up) - original design */}
      <div className="hidden md:flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-gray-600">
            <Eye className="h-5 w-5" />
            <span className="text-sm">{views} {t('photoDetail.views')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="h-5 w-5" />
            <span className="text-sm">{likes} {t('photoDetail.likes')}</span>
          </div>
          {taggedPersonsCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="h-5 w-5" />
              <span className="text-sm">{taggedPersonsCount} {t('photoDetail.taggedPeople')}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {user ? (
            <Button
              onClick={onLike}
              disabled={likeLoading}
              variant={userHasLiked ? "default" : "outline"}
              className={`flex items-center gap-2 ${
                userHasLiked
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
              onClick={() => {
                toast.info(t('photoDetail.signInMessage'));
              }}
              variant="outline"
              className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <Heart className="h-4 w-4" />
              {t('photoDetail.signInToLike')}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile layout (below md) - stacked design */}
      <div className="md:hidden space-y-4">
        {/* Stats */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-gray-600">
            <Eye className="h-5 w-5" />
            <span className="text-sm">{views} {t('photoDetail.views')}</span>
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <Heart className="h-5 w-5" />
            <span className="text-sm">{likes} {t('photoDetail.likes')}</span>
          </div>
          {taggedPersonsCount > 0 && (
            <div className="flex items-center gap-2 text-gray-600">
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
              disabled={likeLoading}
              variant={userHasLiked ? "default" : "outline"}
              className={`w-full flex items-center justify-center gap-2 ${
                userHasLiked
                  ? "bg-red-600 text-white hover:bg-red-700"
                  : "hover:bg-red-50 hover:text-red-600 hover:border-red-200"
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
              onClick={() => {
                toast.info(t('photoDetail.signInMessage'));
              }}
              variant="outline"
              className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
            >
              <Heart className="h-4 w-4" />
              {t('photoDetail.signInToLike')}
            </Button>
          )}
        </div>
      </div>

      {/* Hover instruction for tagged persons */}
      {taggedPersonsCount > 0 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800 flex flex-col gap-1">
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('photo.tag.tip.desktop')}
            </p>
            <p className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              {t('photo.tag.tip.mobile')}
            </p>
          </div>
        </div>
      )}

      {/* Pending tags notification */}
      {hasPendingTags && (
        <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-200">
          <p className="text-sm text-orange-800 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            {t('photo.tag.pendingInfo')}
          </p>
        </div>
      )}
    </div>
  );
};
