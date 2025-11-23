// src/pages/UserProfile.tsx - KOMPLETNA verzija sa Load More za fotografije
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Camera, 
  Heart, 
  Trophy,
  Star,
  UserPlus,
  UserCheck,
  Medal,
  Eye,
  Crown,
  Award,
  Edit,
  Users,
  ArrowRight,
  Tag,
  MessageCircle
} from "lucide-react";
import LazyImage from "../components/LazyImage";
import { photoService, Photo } from "../services/firebaseService";
import { userService, UserProfile, UserActivity } from "../services/userService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";
import Footer from "@/components/Footer";
import { notificationService } from '../services/notificationService';
import PageHeader from '@/components/PageHeader';
import { formatActivityDate } from '../utils/dateUtils';
import { ACTIVITY_DISPLAY } from '../constants/activityIcons';
import { UserProfileSkeleton } from '@/components/UserProfile/UserProfileSkeleton';




const UserProfilePage = () => {
  const { t } = useLanguage();
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [userActivities, setUserActivities] = useState<UserActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: '',
    bio: '',
    location: '',
  });
  
  // ✅ Activity pagination state
  const [hasMoreActivities, setHasMoreActivities] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activityLimit, setActivityLimit] = useState(10);
  
  // ✅ NEW - Photo pagination state
  const [photoLimit, setPhotoLimit] = useState(12);
  const [hasMorePhotos, setHasMorePhotos] = useState(false);
  const [loadingMorePhotos, setLoadingMorePhotos] = useState(false);

  // Badge definitions with proper icons - translated
  const getBadgeDetails = (badgeId: string) => {
    const badges: { [key: string]: any } = {
      photographer: { name: t('profile.badgePhotographer'), icon: Camera, color: 'bg-blue-500' },
      historian: { name: t('profile.badgeHistorian'), icon: Medal, color: 'bg-purple-500' },
      explorer: { name: t('profile.badgeExplorer'), icon: MapPin, color: 'bg-green-500' },
      popular: { name: t('profile.badgePopular'), icon: Heart, color: 'bg-red-500' },
      social: { name: t('profile.badgeSocial'), icon: Users, color: 'bg-pink-500' },
      veteran: { name: t('profile.badgeVeteran'), icon: Crown, color: 'bg-yellow-500' },
      legend: { name: t('profile.badgeLegend'), icon: Trophy, color: 'bg-orange-500' }
    };
    return badges[badgeId] || { name: badgeId, icon: Award, color: 'bg-gray-500' };
  };

  // Translated activity display
  const getActivityDisplay = (activityType: string) => {
    const activityTranslations: { [key: string]: string } = {
      photo_upload: t('profile.activityUploaded'),
      photo_like: t('profile.activityLiked'),
      user_follow: t('profile.activityFollowed'),
      badge_earned: t('profile.activityBadge'),
      comment_added: t('profile.activityComment'),
      person_tagged: t('profile.activityTagged')
    };
    
    return {
      ...ACTIVITY_DISPLAY[activityType],
      text: activityTranslations[activityType] || activityType
    };
  };

  // Get activity link based on type
  const getActivityLink = (activity: UserActivity): string | null => {
    switch(activity.type) {
      case 'photo_upload':
      case 'photo_like':
      case 'comment_added':
      case 'person_tagged':
        return activity.metadata?.targetId ? `/photo/${activity.metadata.targetId}` : null;
      case 'user_follow':
        return activity.metadata?.targetId ? `/user/${activity.metadata.targetId}` : null;
      default:
        return null;
    }
  };

  // ✅ Main useEffect with photo limit dependency
  useEffect(() => {
    let isCancelled = false;
    
    const loadUserProfile = async () => {
      if (!userId) return;
      
      try {
        if (!isCancelled) setLoading(true);
        
        const ownProfile = currentUser?.uid === userId;
        
        let userProfile = await userService.getUserProfile(userId);

        if (!userProfile && ownProfile && currentUser && !isCancelled) {
          await userService.createUserProfile(currentUser.uid, {
            displayName: currentUser.displayName || currentUser.email || 'Unknown User',
            email: currentUser.email || '',
            photoURL: currentUser.photoURL || undefined,
            bio: t('profile.defaultBio')
          });
          userProfile = await userService.getUserProfile(userId);
        }
        
        if (!userProfile) {
          if (!isCancelled) setProfile(null);
          return;
        }

        // ✅ Load photos with limit
        const photos = await photoService.getPhotosByUploader(userId, photoLimit);
        
        // ✅ Check if there are more photos
        const morePhotos = await photoService.getPhotosByUploader(userId, photoLimit + 1);
        const hasMore = morePhotos.length > photoLimit;
        
        // Calculate stats from ALL photos (not just displayed ones)
        const allPhotos = await photoService.getPhotosByUploader(userId);
        const totalLikes = allPhotos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
        const totalViews = allPhotos.reduce((sum, photo) => sum + (photo.views || 0), 0);
        const uniqueLocations = new Set(allPhotos.map(photo => photo.location)).size;

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
            locationsContributed: uniqueLocations
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
        
        // ✅ All state updates at once
        if (!isCancelled) {
          setIsOwnProfile(ownProfile);
          setProfile(finalProfile);
          setUserPhotos(photos);
          setHasMorePhotos(hasMore);
          setIsFollowing(followStatus);
          setUserActivities(activities);
          setHasMoreActivities(hasMoreAct);
          setEditForm({
            displayName: finalProfile.displayName,
            bio: finalProfile.bio || '',
            location: finalProfile.location || ''
          });
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
  }, [userId, currentUser, t, activityLimit, photoLimit]); // ✅ Added photoLimit

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

        // ✅✅✅ DODAJ OVAJ NOVI KOD ✅✅✅
      // Send notification to followed user
      if (userId) {
        try {
          await notificationService.notifyNewFollower(
            userId,                               // User being followed
            currentUser.uid,                      // Follower ID
            currentUser.displayName || 'Anonymous', // Follower name
            currentUser.photoURL || undefined     // Follower avatar
          );
          console.log('✅ Follow notification sent');
        } catch (notifError) {
          console.error('⚠️ Failed to send follow notification:', notifError);
        }
      }
      // ✅✅✅ KRAJ NOVOG KODA ✅✅✅

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

  // ✅ NEW - Load more photos
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

 // Zamijeni postojeći loading return s ovim:
if (loading) {
  return <UserProfileSkeleton />;
}

  if (!profile) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      {/* Header */}
      <PageHeader title="Vremeplov.hr" />

      {/* Profile Section */}
<section className="pt-20 sm:pt-24 pb-8 px-4 bg-white flex-1">
  <div className="container max-w-6xl mx-auto">
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Profile Info */}
      <div className="lg:w-1/3">
        <Card>
          <CardContent className="p-6 text-center">
            <Avatar className="w-24 h-24 mx-auto mb-4">
                    <AvatarImage src={profile.photoURL} alt={profile.displayName} />
                    <AvatarFallback className="text-2xl">
                      {profile.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h2 className="text-2xl font-bold mb-2">{profile.displayName}</h2>
                  
                  {profile.bio && (
                    <p className="text-gray-600 mb-4">{profile.bio}</p>
                  )}
                  
                  <div className="space-y-2 text-sm text-gray-500 mb-4">
                    {profile.location && (
                      <div className="flex items-center justify-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>
                        {t('profile.joined')} {profile.joinedAt?.toDate ? 
                          profile.joinedAt.toDate().getFullYear() : 
                          new Date().getFullYear()
                        }
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {/* Action Buttons */}
{isOwnProfile && (
  <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
    <DialogTrigger asChild>
      <Button variant="outline" className="w-full mb-4">
        <Edit className="h-4 w-4 mr-2" />
        {t('profile.editProfile')}
      </Button>
    </DialogTrigger>
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>{t('profile.editProfile')}</DialogTitle>
        <DialogDescription>
          {t('profile.editProfileDescription')}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div>
          <label className="text-sm font-medium">{t('profile.displayName')}</label>
          <Input
            value={editForm.displayName}
            onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
            placeholder={t('profile.displayNamePlaceholder')} 
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('profile.bio')}</label>
          <Textarea
            value={editForm.bio}
            onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
            placeholder={t('profile.tellAboutYourself')}
            rows={3} 
          />
        </div>
        <div>
          <label className="text-sm font-medium">{t('profile.locations')}</label>
          <Input
            value={editForm.location}
            onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
            placeholder={t('profile.yourLocation')} 
          />
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
                </CardContent>
              </Card>

              {/* Badges */}
              {profile.badges.length > 0 && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      {t('profile.achievements')} ({profile.badges.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {profile.badges.map(badgeId => {
                        const badge = getBadgeDetails(badgeId);
                        const IconComponent = badge.icon;
                        return (
                          <div key={badgeId} className="text-center group relative">
                            <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center mx-auto mb-2 transition-transform hover:scale-110`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-xs font-medium">{badge.name}</div>
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
                <TabsList className="grid w-full grid-cols-3 gap-1">
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
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">{t('profile.collectionOverview')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">
                              {profile.stats.totalPhotos}
                            </div>
                            <div className="text-gray-500">{t('profile.totalPhotos')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">
                              {profile.stats.locationsContributed}
                            </div>
                            <div className="text-gray-500">{t('profile.locations')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">
                              {profile.stats.totalLikes}
                            </div>
                            <div className="text-gray-500">{t('profile.totalLikes')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">
                              {profile.stats.totalViews}
                            </div>
                            <div className="text-gray-500">{t('profile.totalViews')}</div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Photo Grid with LazyImage */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userPhotos.map(photo => (
                          <Link 
                            key={photo.id} 
                            to={`/photo/${photo.id}`}
                            className="group block"
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                              <div className="aspect-[4/3] overflow-hidden bg-gray-100">
                                <LazyImage
                                  src={photo.imageUrl}
                                  alt={photo.description}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                />
                              </div>
                              
                              <CardContent className="p-4">
                                <h3 className="font-semibold text-lg mb-1 line-clamp-1">
                                  {photo.description}
                                </h3>
                                
                                <div className="flex items-center text-sm text-gray-500 mb-2">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  <span>{photo.year || t('profile.unknown')}</span>
                                </div>
                                
                                <div className="flex items-center text-sm text-gray-500 mb-3">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  <span className="line-clamp-1">{photo.location}</span>
                                </div>
                                
                                <div className="flex items-center justify-between text-sm text-gray-500">
                                  <div className="flex items-center gap-3">
                                    <span className="flex items-center gap-1">
                                      <Heart className="h-3 w-3" />
                                      {photo.likes || 0}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Eye className="h-3 w-3" />
                                      {photo.views || 0}
                                    </span>
                                  </div>
                                  <span className="truncate">{photo.author || photo.uploadedBy || t('profile.unknown')}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        ))}
                      </div>

                      {/* ✅ NEW - Load More Photos Button */}
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
  <h3 className="text-xl font-semibold text-gray-900 mb-2">
    {t('profile.noPhotosYet')}
  </h3>
  <p className="text-gray-600 mb-4">
    {isOwnProfile 
      ? t('profile.startSharing')
      : t('profile.userHasntShared')
    }
  </p>
  {isOwnProfile && (
    <p className="text-sm text-gray-500">
      ({t('profile.uploadFirstPhoto')}
    </p>
  )}
</div>
                  )}
                </TabsContent>

                <TabsContent value="stats" className="mt-6">
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
                          <span>{t('profile.totalPhotos')}</span>
                          <span className="font-bold text-blue-600">{profile.stats.totalPhotos}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.uniqueLocations')}</span>
                          <span className="font-bold text-green-600">{profile.stats.locationsContributed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.totalLikesReceived')}</span>
                          <span className="font-bold text-red-600">{profile.stats.totalLikes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.totalViews')}</span>
                          <span className="font-bold text-purple-600">{profile.stats.totalViews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.achievementsEarned')}</span>
                          <span className="font-bold text-yellow-600">{profile.badges.length}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          {t('profile.communityImpact')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>{t('profile.followers')}</span>
                          <span className="font-bold text-blue-600">{profile.stats.followers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.following')}</span>
                          <span className="font-bold text-blue-600">{profile.stats.following}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.avgLikesPerPhoto')}</span>
                          <span className="font-bold text-red-600">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalLikes / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.avgViewsPerPhoto')}</span>
                          <span className="font-bold text-purple-600">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalViews / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>{t('profile.memberSince')}</span>
                          <span className="font-bold text-gray-600">
                            {profile.joinedAt?.toDate ? 
                              profile.joinedAt.toDate().toLocaleDateString('hr-HR') :
                              new Date().toLocaleDateString('hr-HR')
                            }
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        {t('profile.activity')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userActivities.length > 0 ? (
                        <>
                          <div className="space-y-3">
                            {userActivities.map(activity => {
                              const activityInfo = getActivityDisplay(activity.type);
                              const IconComponent = activityInfo.icon;
                              const activityLink = getActivityLink(activity);
                              
                              return (
                                <Link
                                  key={activity.id}
                                  to={activityLink || '#'}
                                  className={`flex gap-3 p-4 border rounded-lg transition-colors ${
                                    activityLink 
                                      ? 'hover:bg-gray-50 hover:border-gray-300 cursor-pointer' 
                                      : 'cursor-default'
                                  }`}
                                  onClick={(e) => !activityLink && e.preventDefault()}
                                >
                                  <div className={`p-2 rounded-full bg-gray-100 ${activityInfo.color} flex-shrink-0 h-fit`}>
                                    <IconComponent className="h-4 w-4" />
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-1 sm:flex-wrap">
                                      <span className="font-medium text-gray-900">
                                        {profile.displayName}
                                      </span>
                                      <span className="text-gray-600 text-sm sm:text-base">
                                        {activityInfo.text}
                                      </span>
                                      
                                      {activity.metadata?.photoTitle && (
                                        <span className="font-medium text-blue-600 truncate">
                                          "{activity.metadata.photoTitle}"
                                        </span>
                                      )}
                                      {activity.metadata?.targetUserName && (
                                        <span className="font-medium text-blue-600">
                                          {activity.metadata.targetUserName}
                                        </span>
                                      )}
                                      {activity.metadata?.badgeName && (
                                        <span className="font-medium text-yellow-600 flex items-center gap-1">
                                          <Award className="h-3 w-3" />
                                          {activity.metadata.badgeName}
                                        </span>
                                      )}
                                    </div>
                                    
                                    {activity.metadata?.location && (
                                      <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                        <MapPin className="h-3 w-3 flex-shrink-0" />
                                        <span className="truncate">{activity.metadata.location}</span>
                                      </div>
                                    )}
                                    
                                    <div className="text-xs text-gray-400 mt-1">
                                      {formatActivityDate(activity.createdAt)}
                                    </div>
                                  </div>
                                  
                                  {activityLink && (
                                    <div className="flex items-center text-gray-400">
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
                        <div className="text-center py-12">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="h-8 w-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {t('profile.noRecentActivity')}
                          </h3>
                          {isOwnProfile && (
                            <p className="text-sm text-gray-500">
                              {t('profile.startUploading')}
                            </p>
                          )}
                        </div>
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