// src/pages/UserProfile.tsx - UPDATED filter widths
import { useState, useEffect, useMemo } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Edit,
  User,
  UserPlus,
  UserCheck,
  ArrowRight,
  Tag,
  MessageCircle,
  Award,
  Camera,
  Trophy,
  Star,
  Heart,
  Eye,
  Users,
  Filter,
  BookOpen
} from "lucide-react";
import LazyImage from "../components/LazyImage";
import { photoService, storyService, Story } from "../services/firebaseService";
import { userService, UserActivity } from "../services/user";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import Footer from "@/components/Footer";
import { notificationService } from '../services/notificationService';
import PageHeader from '@/components/PageHeader';
import { formatActivityDate, formatYear } from '../utils/dateUtils';
import LoadingScreen from '@/components/LoadingScreen';
import { useUserProfileData } from '@/hooks/useUserProfileData';
import { getActivityDisplay, getActivityLink, getBadgeDetails } from '@/utils/userProfileHelpers';
import { ProfileStats } from '@/components/UserProfile/ProfileStats';
import { ProfileBadges } from '@/components/UserProfile/ProfileBadges';
import { getAvatarColor, getUserInitials } from '@/utils/avatarUtils';
import { cn } from '@/lib/utils';
import EmptyState from '@/components/EmptyState';
import SEO from '@/components/SEO';




const UserProfilePage = () => {
  const { t } = useLanguage();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();

  // Pagination state
  const [activeTab, setActiveTab] = useState('photos');
  const [followLoading, setFollowLoading] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
  });
  const [activityLimit, setActivityLimit] = useState(10);
  const [photoLimit, setPhotoLimit] = useState(12);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);
  const [userStories, setUserStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);

  // Filter state for photos
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Use custom hook for profile data
  const {
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
    setUserActivities,
    setHasMorePhotos,
    setHasMoreActivities,
  } = useUserProfileData({
    userId,
    currentUser,
    photoLimit,
    activityLimit,
    t,
  });

  // Sync edit form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        displayName: profile.displayName,
        bio: profile.bio || '',
        location: profile.location || '',
      });
    }
  }, [profile]);

  // Load user stories
  useEffect(() => {
    const loadStories = async () => {
      if (!userId) return;
      setStoriesLoading(true);
      try {
        const stories = await storyService.getUserStories(userId);
        setUserStories(stories);
      } catch (error) {
        console.error('Error loading user stories:', error);
      } finally {
        setStoriesLoading(false);
      }
    };
    if (userId) loadStories();
  }, [userId]);

  // Get unique years from photos
  const availableYears = useMemo(() => {
    const years = userPhotos
      .map(photo => photo.year ? parseInt(photo.year, 10) : null)
      .filter((year): year is number => year !== null && !isNaN(year))
      .sort((a, b) => b - a); // Newest first
    return Array.from(new Set(years));
  }, [userPhotos]);

  // Filter and sort photos
  const filteredAndSortedPhotos = useMemo(() => {
    let filtered = [...userPhotos];

    // Filter by year
    if (selectedYear !== 'all') {
      filtered = filtered.filter(photo => photo.year?.toString() === selectedYear);
    }

    // Sort by upload date (createdAt timestamp)
    filtered.sort((a, b) => {
      const timestampA = a.createdAt?.toMillis() || 0;
      const timestampB = b.createdAt?.toMillis() || 0;
      return sortOrder === 'newest' ? timestampB - timestampA : timestampA - timestampB;
    });

    return filtered;
  }, [userPhotos, selectedYear, sortOrder]);

  const handleFollowToggle = async () => {
    if (!profile || !currentUser || isOwnProfile || followLoading) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await userService.unfollowUser(currentUser.uid, userId!);
        setIsFollowing(false);
        setProfile(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers - 1 }
        } : null);
        toast.success(t('profile.unfollowed'));
      } else {
        await userService.followUser(currentUser.uid, userId!);

        // ✅ Send notification to followed user
        if (userId) {
          try {
            await notificationService.notifyNewFollower(
              userId,
              currentUser.uid,
              currentUser.displayName || 'Anonymous',
              currentUser.photoURL || undefined
            );
          } catch (notifError) {
            console.error('⚠️ Failed to send follow notification:', notifError);
          }
        }

        setIsFollowing(true);
        setProfile(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers + 1 }
        } : null);
        toast.success(t('profile.nowFollowing'));
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error(t('profile.followError'));
    } finally {
      setFollowLoading(false);
    }
  };

  const handleEditProfile = async () => {
    if (!currentUser || !isOwnProfile) return;
    
    try {
      await userService.updateUserProfile(currentUser.uid, {
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location
      });
      
      setProfile(prev => prev ? {
        ...prev,
        displayName: editForm.displayName,
        bio: editForm.bio,
        location: editForm.location
      } : null);
      
      setEditProfileOpen(false);
      toast.success(t('profile.updateSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(t('profile.updateError'));
    }
  };

  // Load more activities
  const loadMoreActivities = async () => {
    if (!userId || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const newLimit = activityLimit + 10;
      const activities = await userService.getUserActivities(userId, newLimit);
      setUserActivities(activities);
      setActivityLimit(newLimit);
      
      const moreActivities = await userService.getUserActivities(userId, newLimit + 1);
      setHasMoreActivities(moreActivities.length > newLimit);
    } catch (error) {
      console.error('Error loading more activities:', error);
      toast.error(t('profile.loadMoreError'));
    } finally {
      setLoadingMore(false);
    }
  };

  // Load more photos
  const loadMorePhotos = async () => {
    if (!userId || loadingMorePhotos) return;
    
    setLoadingMorePhotos(true);
    try {
      const newLimit = photoLimit + 12;
      const photos = await photoService.getPhotosByUploader(userId, newLimit);
      setUserPhotos(photos);
      setPhotoLimit(newLimit);
      
      // Check if there are even more
      const morePhotos = await photoService.getPhotosByUploader(userId, newLimit + 1);
      setHasMorePhotos(morePhotos.length > newLimit);
      
      toast.success(t('profile.photosLoaded'));
    } catch (error) {
      console.error('Error loading more photos:', error);
      toast.error(t('profile.loadMorePhotosError'));
    } finally {
      setLoadingMorePhotos(false);
    }
  };

if (loading) {
  return <LoadingScreen message={t('profile.loadingProfile')} />;
}

  if (!profile) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      {/* SEO meta tags */}
      <SEO
        title={`${profile.displayName} - ${t('profile.title')}`}
        description={profile.bio || t('profile.defaultDescription')}
        url={`/user/${userId}`}
      />
      {/* Header */}
      <PageHeader title="Vremeplov.hr" />

      {/* Profile Section */}
<section className="pt-20 sm:pt-24 pb-8 px-4 bg-white dark:bg-gray-900 flex-1">
  <div className="container max-w-6xl mx-auto">
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Profile Info */}
      <div className="lg:w-1/3">
        <Card className="dark:bg-gray-800 dark:border-gray-700">
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                    <AvatarFallback className={cn(getAvatarColor(userId || ''), "text-white text-2xl")}>
                      {getUserInitials(profile.displayName, null)}
                    </AvatarFallback>
                  </Avatar>

                  <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-white">{profile.displayName}</h2>

                  {profile.bio && (
                    <p className="text-gray-600 dark:text-gray-300 mb-4">{profile.bio}</p>
                  )}

                  <div className="space-y-2 text-sm text-gray-500 dark:text-gray-400 mb-4">
                    {profile.location && (
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        {t('profile.joined')} {profile.joinedAt?.toDate ?
                          profile.joinedAt.toDate().toLocaleDateString('hr-HR', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric'
                          }) :
                          new Date().toLocaleDateString('hr-HR', {
                            day: 'numeric',
                            month: 'numeric',
                            year: 'numeric'
                          })
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
{isOwnProfile && (
  <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className="w-full mb-4">
        <Edit className="h-4 w-4 mr-2" />
        {t('profile.editProfile')}
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px] dark:bg-gray-800 dark:border-gray-700">
      <DialogHeader>
        <DialogTitle className="dark:text-white">{t('profile.editProfile')}</DialogTitle>
        <DialogDescription className="dark:text-gray-300">
          {t('profile.editProfileDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label className="text-sm font-medium dark:text-gray-200">{t('profile.displayName')}</label>
          <Input
            value={editForm.displayName}
            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder={t('profile.displayNamePlaceholder')}
            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            maxLength={50}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {editForm.displayName.length}/50
          </p>
        </div>
        <div>
          <label className="text-sm font-medium dark:text-gray-200">{t('profile.bio')}</label>
          <Textarea
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder={t('profile.tellAboutYourself')}
            rows={3}
            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            maxLength={200}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {editForm.bio.length}/200
          </p>
        </div>
        <div>
          <label className="text-sm font-medium dark:text-gray-200">{t('profile.locations')}</label>
          <Input
            value={editForm.location}
            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder={t('profile.yourLocation')}
            className="dark:bg-gray-700 dark:text-gray-100 dark:border-gray-600"
            maxLength={100}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {editForm.location.length}/100
          </p>
        </div>
        <div className="flex gap-2 pt-4">
          <Button onClick={handleEditProfile} className="flex-1">
            {t('profile.saveChanges')}
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditProfileOpen(false)}
            className="flex-1"
          >
            {t('profile.cancel')}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
)}

{!isOwnProfile && currentUser && (
  <Button
    variant={isFollowing ? "outline" : "default"}
    className="w-full mb-4"
    onClick={handleFollowToggle}
    disabled={followLoading}
  >
    {followLoading ? (
      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
    ) : isFollowing ? (
      <UserCheck className="h-4 w-4 mr-2" />
    ) : (
      <UserPlus className="h-4 w-4 mr-2" />
    )}
    {isFollowing ? t('profile.unfollow') : t('profile.follow')}
  </Button>
)}
                </CardContent>
              </Card>

              {/* Badges */}
              {profile.badges.length > 0 && (
                <Card className="mt-6 dark:bg-gray-800 dark:border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-white">
                      <Award className="h-5 w-5" />
                      {t('profile.achievements')} ({profile.badges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {profile.badges.map(badgeId => {
                        const badge = getBadgeDetails(badgeId, t);
                        const IconComponent = badge.icon;
                        return (
                          <div key={badgeId} className="text-center group relative">
                            <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center mx-auto mb-2 transition-transform hover:scale-110`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-xs font-medium dark:text-gray-200">{badge.name}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Content Tabs */}
            <div className="lg:w-2/3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-4 gap-1 bg-muted">
                  <TabsTrigger
                    value="photos"
                    title={t('profile.photos')}
                    className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:px-4 sm:gap-2"
                  >
                    <Camera className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('profile.photos')}</span>
                    <span className="sm:hidden">({profile.stats.totalPhotos})</span>
                    <span className="hidden sm:inline">({profile.stats.totalPhotos})</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="stories"
                    title={t('profile.stories')}
                    className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:px-4 sm:gap-2"
                  >
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('profile.stories')}</span>
                    <span className="sm:hidden">({userStories.length})</span>
                    <span className="hidden sm:inline">({userStories.length})</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="stats"
                    title={t('profile.statistics')}
                    className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:px-4 sm:gap-2"
                  >
                    <Trophy className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('profile.statistics')}</span>
                  </TabsTrigger>

                  <TabsTrigger
                    value="activity"
                    title={t('profile.activity')}
                    className="flex items-center gap-1 px-2 text-xs sm:text-sm sm:px-4 sm:gap-2"
                  >
                    <Star className="h-4 w-4 flex-shrink-0" />
                    <span className="hidden sm:inline">{t('profile.activity')}</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="mt-6">
                  {userPhotos.length > 0 ? (
                    <>
                      {/* Filters */}
                      <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
                          <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('profile.filterByYear')}:</span>
                          <Select value={selectedYear} onValueChange={setSelectedYear}>
                            <SelectTrigger className="flex-1 sm:w-[180px] dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                              <SelectValue placeholder={t('profile.allYears')} />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                              <SelectItem value="all" className="dark:text-gray-200">{t('profile.allYears')}</SelectItem>
                              {availableYears.map(year => (
                                <SelectItem key={year} value={year.toString()} className="dark:text-gray-200">
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 flex-1 sm:flex-initial">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">{t('profile.sortBy')}:</span>
                          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as 'newest' | 'oldest')}>
                            <SelectTrigger className="flex-1 sm:w-[180px] dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="dark:bg-gray-700 dark:border-gray-600">
                              <SelectItem value="newest" className="dark:text-gray-200">{t('profile.newestFirst')}</SelectItem>
                              <SelectItem value="oldest" className="dark:text-gray-200">{t('profile.oldestFirst')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <h3 className="font-semibold mb-2 text-center dark:text-white">{t('profile.collectionOverview')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              {profile.stats.totalPhotos}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">{t('profile.totalPhotos')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
                              {userStories.length}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">{t('profile.totalStories')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {profile.stats.locationsContributed}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">{t('profile.locations')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              {profile.stats.totalLikes}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">{t('profile.totalLikes')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {profile.stats.totalViews}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400">{t('profile.totalViews')}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Photo Grid with LazyImage */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredAndSortedPhotos.map((photo, index) => (
                          <Link
                            key={photo.id}
                            to={`/photo/${photo.id}`}
                            className="group block"
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full dark:bg-gray-800 dark:border-gray-700">
                              <div className="aspect-[4/3] overflow-hidden bg-gray-100 dark:bg-gray-700 relative">
                                <LazyImage
                                  src={photo.imageUrl}
                                  alt={photo.description}
                                  className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-200 ${!photo.isApproved ? 'opacity-60' : ''}`}
                                  responsiveImages={photo.responsiveImages}
                                  priority={index === 0}
                                />
                                {!photo.isApproved && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <div className="bg-yellow-500 text-white px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg flex items-center gap-1.5">
                                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      {t('profile.pendingApproval')}
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-lg mb-2 line-clamp-2 text-gray-900 dark:text-gray-100">
                                  {photo.description}
                                </h3>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span>{formatYear(photo.year, t)}</span>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{photo.location}</span>
                                </div>

                                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                                  <User className="h-4 w-4 mr-1 flex-shrink-0" />
                                  <span className="truncate">{(photo.author && photo.author !== 'Unknown' ? photo.author : null) || (photo.uploadedBy && photo.uploadedBy !== 'Unknown' ? photo.uploadedBy : null) || t('profile.unknown')}</span>
                                </div>

                                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
                                  <span className="flex items-center gap-1">
                                    <Heart className="h-3 w-3" />
                                    {photo.likes || 0}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Eye className="h-3 w-3" />
                                    {photo.views || 0}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>

                      {/* Load More Photos Button */}
                      {hasMorePhotos && userPhotos.length > 0 && (
                        <div className="text-center mt-6 pt-4 border-t">
                          <Button 
                            variant="outline" 
                            onClick={loadMorePhotos}
                            disabled={loadingMorePhotos}
                            className="w-full sm:w-auto"
                          >
                            {loadingMorePhotos ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                {t('profile.loading')}
                              </>
                            ) : (
                              <>
                                <Camera className="h-4 w-4 mr-2" />
                                {t('profile.loadMorePhotos')}
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-12">
  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
    {t('profile.noPhotosYet')}
  </h3>
  <p className="text-gray-600 dark:text-gray-400 mb-4">
    {isOwnProfile
      ? t('profile.startSharing')
      : t('profile.userHasntShared')
    }
  </p>
  {isOwnProfile && (
    <p className="text-sm text-gray-500 dark:text-gray-400">
      {t('profile.uploadFirstPhoto')}
    </p>
  )}
</div>
                  )}
                </TabsContent>

                <TabsContent value="stories" className="mt-6">
                  {storiesLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : userStories.length > 0 ? (
                    <div className="space-y-4">
                      {userStories.map((story) => (
                        <Link key={story.id} to={`/story/${story.id}`} className="block">
                          <Card className={`hover:shadow-lg transition-shadow dark:bg-gray-800 dark:border-gray-700 ${!story.isApproved ? 'opacity-75' : ''}`}>
                            <CardContent className="p-5 sm:p-6">
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                                  {story.title}
                                </h3>
                                {!story.isApproved && (
                                  <span className="bg-yellow-500 text-white px-2 py-0.5 rounded-full text-xs font-semibold whitespace-nowrap flex items-center gap-1">
                                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    {t('profile.pendingApproval')}
                                  </span>
                                )}
                              </div>
                              <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2 mb-3">
                                {story.content}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {story.location}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {story.createdAt?.toDate
                                    ? story.createdAt.toDate().toLocaleDateString('hr-HR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                      })
                                    : ''
                                  }
                                </span>
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {story.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {story.likes || 0}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        {t('profile.noStoriesYet')}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {isOwnProfile
                          ? t('profile.startWritingStories')
                          : t('profile.userHasntWrittenStories')
                        }
                      </p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
                  {(() => {
                    const approvedStories = userStories.filter(s => s.isApproved);
                    const storyLikes = approvedStories.reduce((sum, s) => sum + (s.likes || 0), 0);
                    const storyViews = approvedStories.reduce((sum, s) => sum + (s.views || 0), 0);
                    const storyUniqueLocations = new Set(approvedStories.map(s => s.location).filter(Boolean));
                    const photoUniqueLocations = new Set(userPhotos.map(p => p.location).filter(Boolean));
                    const combinedLocations = new Set([...photoUniqueLocations, ...storyUniqueLocations]);
                    const combinedUniqueLocations = Math.max(combinedLocations.size, profile.stats.locationsContributed);

                    return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Camera className="h-5 w-5" />
                          {t('profile.contributionStats')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.totalPhotos')}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{profile.stats.totalPhotos}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.totalStories')}</span>
                          <span className="font-bold text-indigo-600 dark:text-indigo-400">{userStories.length}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.uniqueLocations')}</span>
                          <span className="font-bold text-green-600 dark:text-green-400">{combinedUniqueLocations}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.totalLikesReceived')}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">{profile.stats.totalLikes + storyLikes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.totalViews')}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{profile.stats.totalViews + storyViews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.achievementsEarned')}</span>
                          <span className="font-bold text-yellow-600 dark:text-yellow-400">{profile.badges.length}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                          <Users className="h-5 w-5" />
                          {t('profile.communityImpact')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.followers')}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{profile.stats.followers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.following')}</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{profile.stats.following}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.avgLikesPerPhoto')}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {profile.stats.totalPhotos > 0
                              ? Math.round(profile.stats.totalLikes / profile.stats.totalPhotos)
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.avgViewsPerPhoto')}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {profile.stats.totalPhotos > 0
                              ? Math.round(profile.stats.totalViews / profile.stats.totalPhotos)
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.avgLikesPerStory')}</span>
                          <span className="font-bold text-red-600 dark:text-red-400">
                            {approvedStories.length > 0
                              ? Math.round(storyLikes / approvedStories.length)
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.avgViewsPerStory')}</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">
                            {approvedStories.length > 0
                              ? Math.round(storyViews / approvedStories.length)
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 dark:text-gray-300">{t('profile.memberSince')}</span>
                          <span className="font-bold text-gray-600 dark:text-gray-300">
                            {profile.joinedAt?.toDate ?
                              profile.joinedAt.toDate().toLocaleDateString('hr-HR') :
                              new Date().toLocaleDateString('hr-HR')
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                    );
                  })()}
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <Card className="dark:bg-gray-800 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <Star className="h-5 w-5" />
                        {t('profile.activity')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userActivities.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {userActivities.map(activity => {
                              const activityInfo = getActivityDisplay(activity.type, t);
                              const IconComponent = activityInfo.icon;
                              const activityLink = getActivityLink(activity);

                              return (
                                <Link
                                  key={activity.id}
                                  to={activityLink || '#'}
                                  className={`flex gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors ${
                                    activityLink
                                      ? 'hover:bg-gray-50 dark:hover:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600 cursor-pointer'
                                      : 'cursor-default'
                                  }`}
                                  onClick={(e) => !activityLink && e.preventDefault()}
                                >
                                  <div className={`p-2 rounded-full bg-gray-100 dark:bg-gray-700 ${activityInfo.color} flex-shrink-0 h-fit`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 sm:flex-wrap">
                                      <span className="font-medium text-gray-900 dark:text-gray-100">
                                        {profile.displayName}
                                      </span>
                                      <span className="text-gray-600 dark:text-gray-400 text-sm sm:text-base">
                                        {activityInfo.text}
                                      </span>

                                      {activity.metadata?.photoTitle && (
                                        <span className="font-medium text-blue-600 dark:text-blue-400 truncate">
                                          "{activity.metadata.photoTitle}"
                                        </span>
                                      )}
                                      {activity.metadata?.storyTitle && (
                                        <span className="font-medium text-indigo-600 dark:text-indigo-400 truncate">
                                          "{activity.metadata.storyTitle}"
                                        </span>
                                      )}
                                      {activity.metadata?.targetUserName && (
                                        <span className="font-medium text-blue-600 dark:text-blue-400">
                                          {activity.metadata.targetUserName}
                                        </span>
                                      )}
                                      {activity.metadata?.badgeName && (
                                        <span className="font-medium text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                                          <Award className="h-3 w-3" />
                                          {activity.metadata.badgeName}
                                        </span>
                                      )}
                                    </div>

                                    {activity.metadata?.location && (
                                      <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{activity.metadata.location}</span>
                                      </div>
                                    )}

                                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                      {formatActivityDate(activity.createdAt)}
                                    </div>
                                  </div>

                                  {activityLink && (
                                    <div className="flex items-center text-gray-400 dark:text-gray-500">
                                      <ArrowRight className="h-4 w-4" />
                                    </div>
                                  )}
                                </Link>
                              );
                            })}
                          </div>
                          
                          {/* Load More Activities Button */}
                          {hasMoreActivities && (
                            <div className="text-center mt-6 pt-4 border-t">
                              <Button 
                                variant="outline" 
                                onClick={loadMoreActivities}
                                disabled={loadingMore}
                                className="w-full sm:w-auto"
                              >
                                {loadingMore ? (
                                  <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                                    {t('profile.loading')}
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    {t('profile.loadMore')}
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <EmptyState
                          icon={Star}
                          title={t('profile.emptyActivity')}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default UserProfilePage;