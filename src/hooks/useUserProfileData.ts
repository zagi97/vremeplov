/**
 * Custom hook for loading user profile data
 */

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { photoService, Photo } from '../services/firebaseService';
import { userService, UserProfile, UserActivity } from '../services/userService';
import { User } from 'firebase/auth';

interface UseUserProfileDataParams {
  userId: string | undefined;
  currentUser: User | null;
  photoLimit: number;
  activityLimit: number;
  t: (key: string) => string;
}

interface UseUserProfileDataReturn {
  profile: UserProfile | null;
  userPhotos: Photo[];
  userActivities: UserActivity[];
  loading: boolean;
  isOwnProfile: boolean;
  isFollowing: boolean;
  hasMorePhotos: boolean;
  hasMoreActivities: boolean;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  setIsFollowing: React.Dispatch<React.SetStateAction<boolean>>;
  setUserPhotos: React.Dispatch<React.SetStateAction<Photo[]>>;
  setHasMorePhotos: React.Dispatch<React.SetStateAction<boolean>>;
  setUserActivities: React.Dispatch<React.SetStateAction<UserActivity[]>>;
  setHasMoreActivities: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useUserProfileData = ({
  userId,
  currentUser,
  photoLimit,
  activityLimit,
  t,
}: UseUserProfileDataParams): UseUserProfileDataReturn => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [hasMoreActivities, setHasMoreActivities] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadUserProfile = async () => {
      if (!userId) return;

      try {
        if (!isCancelled) setLoading(true);

        const ownProfile = currentUser?.uid === userId;

        let userProfile = await userService.getUserProfile(userId);

        // Create profile if it's own profile and doesn't exist
        if (!userProfile && ownProfile && currentUser && !isCancelled) {
          await userService.createUserProfile(currentUser.uid, {
            displayName: currentUser.displayName || currentUser.email || 'Unknown User',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || undefined,
            bio: t('profile.defaultBio'),
          });
          userProfile = await userService.getUserProfile(userId);
        }

        if (!userProfile) {
          if (!isCancelled) setProfile(null);
          return;
        }

        // Load photos with limit
        const photos = await photoService.getPhotosByUploader(userId, photoLimit);

        // Check if there are more photos
        const morePhotos = await photoService.getPhotosByUploader(userId, photoLimit + 1);
        const hasMore = morePhotos.length > photoLimit;

        // Calculate stats from ALL photos
        const allPhotos = await photoService.getPhotosByUploader(userId);
        const totalLikes = allPhotos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
        const totalViews = allPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
        const uniqueLocations = new Set(allPhotos.map((photo) => photo.location)).size;

        const needsUpdate =
          userProfile.stats.totalPhotos !== allPhotos.length ||
          userProfile.stats.totalLikes !== totalLikes ||
          userProfile.stats.totalViews !== totalViews ||
          userProfile.stats.locationsContributed !== uniqueLocations;

        let finalProfile = userProfile;

        if (needsUpdate) {
          const updatedStats = {
            totalPhotos: allPhotos.length,
            totalLikes: totalLikes,
            totalViews: totalViews,
            locationsContributed: uniqueLocations,
          };

          await userService.updateUserStats(userId, updatedStats);
          const updatedProfile = await userService.getUserProfile(userId);
          finalProfile = updatedProfile || userProfile;
        }

        if (allPhotos.length > 0 || needsUpdate) {
          await userService.checkAndAwardBadges(userId);
          const profileWithBadges = await userService.getUserProfile(userId);
          finalProfile = profileWithBadges || finalProfile;
        }

        // Check follow status
        let followStatus = false;
        if (currentUser && !ownProfile) {
          followStatus = await userService.checkIfFollowing(currentUser.uid, userId);
        }

        // Load activities
        const activities = await userService.getUserActivities(userId, activityLimit);
        const moreActivities = await userService.getUserActivities(userId, activityLimit + 1);
        const hasMoreAct = moreActivities.length > activityLimit;

        // All state updates at once
        if (!isCancelled) {
          setIsOwnProfile(ownProfile);
          setProfile(finalProfile);
          setUserPhotos(photos);
          setHasMorePhotos(hasMore);
          setIsFollowing(followStatus);
          setUserActivities(activities);
          setHasMoreActivities(hasMoreAct);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading user profile:', error);
          toast.error(t('profile.loadError'));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadUserProfile();

    return () => {
      isCancelled = true;
    };
  }, [userId, currentUser, t, activityLimit, photoLimit]);

  return {
    profile,
    userPhotos,
    userActivities,
    loading,
    isOwnProfile,
    isFollowing,
    hasMorePhotos,
    hasMoreActivities,
    setProfile,
    setIsFollowing,
    setUserPhotos,
    setHasMorePhotos,
    setUserActivities,
    setHasMoreActivities,
  };
};
