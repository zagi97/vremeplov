/**
 * Profile Stats Component
 * Displays user statistics (photos, likes, views, locations, followers, following)
 */

import React from 'react';
import { Camera, Heart, Eye, MapPin, Users, UserPlus } from 'lucide-react';

interface ProfileStatsProps {
  stats: {
    totalPhotos: number;
    totalLikes: number;
    totalViews: number;
    locationsContributed: number;
    followers: number;
    following: number;
  };
  t: (key: string) => string;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({ stats, t }) => {
  return (
    <div className="grid grid-cols-2 gap-4 mb-6">
      <div className="bg-blue-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-blue-600 mb-1">
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.photos')}</span>
        </div>
        <p className="text-2xl font-bold text-blue-900">{stats.totalPhotos}</p>
      </div>

      <div className="bg-red-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-red-600 mb-1">
          <Heart className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.likes')}</span>
        </div>
        <p className="text-2xl font-bold text-red-900">{stats.totalLikes}</p>
      </div>

      <div className="bg-purple-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-purple-600 mb-1">
          <Eye className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.views')}</span>
        </div>
        <p className="text-2xl font-bold text-purple-900">{stats.totalViews}</p>
      </div>

      <div className="bg-green-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-green-600 mb-1">
          <MapPin className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.locations')}</span>
        </div>
        <p className="text-2xl font-bold text-green-900">{stats.locationsContributed}</p>
      </div>

      <div className="bg-pink-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-pink-600 mb-1">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.followers')}</span>
        </div>
        <p className="text-2xl font-bold text-pink-900">{stats.followers}</p>
      </div>

      <div className="bg-indigo-50 p-3 rounded-lg">
        <div className="flex items-center gap-2 text-indigo-600 mb-1">
          <UserPlus className="h-4 w-4" />
          <span className="text-sm font-medium">{t('profile.following')}</span>
        </div>
        <p className="text-2xl font-bold text-indigo-900">{stats.following}</p>
      </div>
    </div>
  );
};
