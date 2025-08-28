// In your UserProfile.tsx, add this import at the top:
import LazyImage from "../components/LazyImage";
// src/pages/UserProfile.tsx - KOMPLETNA verzija
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
  Users
} from "lucide-react";
import { photoService, Photo } from "../services/firebaseService";
import { userService, UserProfile, UserActivity } from "../services/userService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

// Activity type display mapping
const ACTIVITY_DISPLAY: { [key: string]: { text: string; icon: any; color: string } } = {
  photo_upload: { text: 'uploaded a photo', icon: Camera, color: 'text-blue-600' },
  photo_like: { text: 'liked a photo', icon: Heart, color: 'text-red-600' },
  user_follow: { text: 'started following', icon: UserPlus, color: 'text-green-600' },
  badge_earned: { text: 'earned a badge', icon: Award, color: 'text-yellow-600' },
  comment_added: { text: 'added a comment', icon: Star, color: 'text-purple-600' }
};

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
      comment_added: t('profile.activityComment')
    };
    
    return {
      ...ACTIVITY_DISPLAY[activityType],
      text: activityTranslations[activityType] || activityType
    };
  };

 useEffect(() => {
  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Check if viewing own profile
      const ownProfile = currentUser?.uid === userId;
      setIsOwnProfile(ownProfile);
      
      // Load user profile from Firebase
      let userProfile = await userService.getUserProfile(userId);
      
      // If profile doesn't exist and it's current user, create it
      if (!userProfile && ownProfile && currentUser) {
        await userService.createUserProfile(currentUser.uid, {
          displayName: currentUser.displayName || currentUser.email || 'Unknown User',
          email: currentUser.email || '',
          photoURL: currentUser.photoURL || undefined,
          bio: t('profile.defaultBio')
        });
        userProfile = await userService.getUserProfile(userId);
      }
      
      if (!userProfile) {
        setProfile(null);
        return;
      }

      // Load user's photos
      const photos = await photoService.getPhotosByUploader(userId);
      setUserPhotos(photos);

      // Calculate current stats from photos
      const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalViews = photos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(photos.map(photo => photo.location)).size;

      // ✅ BETTER FIX: Only update if stats have changed
      const needsUpdate = 
        userProfile.stats.totalPhotos !== photos.length ||
        userProfile.stats.totalLikes !== totalLikes ||
        userProfile.stats.totalViews !== totalViews ||
        userProfile.stats.locationsContributed !== uniqueLocations;

      let finalProfile = userProfile;

      if (needsUpdate) {
        const updatedStats = {
          totalPhotos: photos.length,
          totalLikes: totalLikes, 
          totalViews: totalViews,
          locationsContributed: uniqueLocations
        };
        
        await userService.updateUserStats(userId, updatedStats);
        
        // Get updated profile after stats update
        const updatedProfile = await userService.getUserProfile(userId);
        finalProfile = updatedProfile || userProfile;
      }
      
      // Check for new badges (only if we have photos or it's the user's first visit)
      if (photos.length > 0 || needsUpdate) {
        await userService.checkAndAwardBadges(userId);
        
        // Get final updated profile after potential badge awards
        const profileWithBadges = await userService.getUserProfile(userId);
        finalProfile = profileWithBadges || finalProfile;
      }
      
      // Set the final profile
      setProfile(finalProfile);
      
      // Check if current user is following this user
      if (currentUser && !ownProfile) {
        const followStatus = await userService.checkIfFollowing(currentUser.uid, userId);
        setIsFollowing(followStatus);
      }
      
      // Load user activities
      const activities = await userService.getUserActivities(userId, 10);
      setUserActivities(activities);
      
      // Set edit form values
      if (finalProfile) {
        setEditForm({
          displayName: finalProfile.displayName,
          bio: finalProfile.bio || '',
          location: finalProfile.location || ''
        });
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error(t('profile.loadError'));
    } finally {
      setLoading(false);
    }
  };

  loadUserProfile();
}, [userId, currentUser, t]);

  const handleFollowToggle = async () => {
    if (!profile || !currentUser || isOwnProfile || followLoading) return;
    
    try {
      setFollowLoading(true);
      
      if (isFollowing) {
        await userService.unfollowUser(currentUser.uid, userId!);
        setIsFollowing(false);
        // Update local profile follower count
        setProfile(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers - 1 }
        } : null);
        toast.success(t('profile.unfollowed'));
      } else {
        await userService.followUser(currentUser.uid, userId!);
        setIsFollowing(true);
        // Update local profile follower count
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
      
      // Update local state
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

    // Add this function inside your UserProfilePage component:
const fixUserStats = async () => {
  if (!currentUser) return;
  
  try {
    setLoading(true);
    
    // Force recalculate user stats
    await userService.forceRecalculateUserStats(currentUser.uid);
    
    // Reload the profile to see updated stats
    const updatedProfile = await userService.getUserProfile(currentUser.uid);
    setProfile(updatedProfile);
    
    toast.success(t('profile.statsFixed'));
  } catch (error) {
    console.error('Error fixing user stats:', error);
    toast.error(t('profile.statsError'));
  } finally {
    setLoading(false);
  }
};

  const formatActivityDate = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('hr-HR', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('profile.loadingProfile')}</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <Navigate to="/not-found" replace />;
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>
          </div>
        </div>
      </header>

      {/* Profile Section */}
      <section className="py-8 px-4 bg-white">
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
                  {!isOwnProfile && currentUser ? (
                    <Button
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                      variant={isFollowing ? "outline" : "default"}
                      className="w-full mb-4"
                    >
                      {followLoading ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : isFollowing ? (
                        <>
                          <UserCheck className="h-4 w-4 mr-2" />
                          {t('profile.following')}
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          {t('profile.follow')}
                        </>
                      )}
                    </Button>
                  ) : isOwnProfile ? (
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
                  ) : null}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-center border-t pt-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{profile.stats.followers}</div>
                      <div className="text-xs text-gray-500">{t('profile.followers')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{profile.stats.following}</div>
                      <div className="text-xs text-gray-500">{t('profile.following')}</div>
                    </div>
                  </div>
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
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="photos" className="flex items-center gap-2">
                    <Camera className="h-4 w-4" />
                    {t('profile.photos')} ({profile.stats.totalPhotos})
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    {t('profile.statistics')}
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    {t('profile.activity')}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="mt-6">
                  {userPhotos.length > 0 ? (
                    <>
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">{t('profile.collectionOverview')}</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600" data-test="total-photos">
                              {profile.stats.totalPhotos}
                            </div>
                            <div className="text-gray-500">{t('profile.totalPhotos')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600" data-test="total-locations">
                              {profile.stats.locationsContributed}
                            </div>
                            <div className="text-gray-500">{t('profile.locations')}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600" data-test="total-likes">
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
                      
                      {/* ✅ Updated photo grid with lazy loading */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userPhotos.map(photo => (
                          <Link 
                            key={photo.id} 
                            to={`/photo/${photo.id}`}
                            className="group block"
                          >
                            <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-200 h-full">
                              {/* Fixed aspect ratio container */}
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
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('profile.noPhotosYet')}</h3>
                      <p className="text-gray-600 mb-4">
                        {isOwnProfile 
                          ? t('profile.startSharing')
                          : t('profile.userHasntShared')
                        }
                      </p>
                      {isOwnProfile && (
                        <Link to="/upload">
                          <Button>
                            <Camera className="h-4 w-4 mr-2" />
                            {t('profile.uploadFirstPhoto')}
                          </Button>
                        </Link>
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
                        <div className="space-y-4">
                          {userActivities.map(activity => {
                            const activityInfo = getActivityDisplay(activity.type);
                            const IconComponent = activityInfo.icon;
                            
                            return (
                              <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`p-2 rounded-full bg-gray-100 ${activityInfo.color}`}>
                                  <IconComponent className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{profile.displayName}</span>
                                    <span className="text-gray-600">{activityInfo.text}</span>
                                    {activity.metadata?.photoTitle && (
                                      <span className="font-medium text-blue-600">"{activity.metadata.photoTitle}"</span>
                                    )}
                                    {activity.metadata?.targetUserName && (
                                      <span className="font-medium text-blue-600">{activity.metadata.targetUserName}</span>
                                    )}
                                    {activity.metadata?.badgeName && (
                                      <span className="font-medium text-yellow-600">{activity.metadata.badgeName}</span>
                                    )}
                                  </div>
                                  {activity.metadata?.location && (
                                    <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                      <MapPin className="h-3 w-3" />
                                      {activity.metadata.location}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-400 mt-1">
                                    {formatActivityDate(activity.createdAt)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-gray-500 mb-4">{t('profile.noRecentActivity')}</p>
                          {isOwnProfile && (
                            <p className="text-sm text-gray-400">
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
      <footer className="py-10 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
              <p className="mt-2">{t('footer.tagline')}</p>
            </div>
            <div className="flex space-x-6">
              <Link to="/about" className="hover:text-white transition-colors">{t('footer.about')}</Link>
              <Link to="/privacy" className="hover:text-white transition-colors">{t('footer.privacy')}</Link>
              <Link to="/terms" className="hover:text-white transition-colors">{t('footer.terms')}</Link>
              <Link to="/contact" className="hover:text-white transition-colors">{t('footer.contact')}</Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-gray-800 text-center">
            <p>© {new Date().getFullYear()} Vremeplov.hr. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UserProfilePage;