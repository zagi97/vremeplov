// src/pages/UserProfile.tsx - KOMPLETNA verzija
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
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
  Crown,
  Shield,
  Award,
  Edit,
  Users
} from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import { photoService, Photo } from "../services/firebaseService";
import { userService, UserProfile, UserActivity } from "../services/userService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";

// Activity type display mapping
const ACTIVITY_DISPLAY: { [key: string]: { text: string; icon: any; color: string } } = {
  photo_upload: { text: 'uploaded a photo', icon: Camera, color: 'text-blue-600' },
  photo_like: { text: 'liked a photo', icon: Heart, color: 'text-red-600' },
  user_follow: { text: 'started following', icon: UserPlus, color: 'text-green-600' },
  badge_earned: { text: 'earned a badge', icon: Award, color: 'text-yellow-600' },
  comment_added: { text: 'added a comment', icon: Star, color: 'text-purple-600' }
};

const UserProfilePage = () => {
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

  // Badge definitions with proper icons
  const getBadgeDetails = (badgeId: string) => {
    const badges: { [key: string]: any } = {
      photographer: { name: 'Photographer', icon: Camera, color: 'bg-blue-500' },
      historian: { name: 'Local Historian', icon: Medal, color: 'bg-purple-500' },
      explorer: { name: 'Heritage Explorer', icon: MapPin, color: 'bg-green-500' },
      popular: { name: 'Community Favorite', icon: Heart, color: 'bg-red-500' },
      social: { name: 'Social Butterfly', icon: Users, color: 'bg-pink-500' },
      veteran: { name: 'Heritage Veteran', icon: Crown, color: 'bg-yellow-500' },
      legend: { name: 'Heritage Legend', icon: Trophy, color: 'bg-orange-500' }
    };
    return badges[badgeId] || { name: badgeId, icon: Award, color: 'bg-gray-500' };
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
            bio: 'Passionate about preserving Croatian heritage through historical photography.'
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
        
        // Update user stats based on photos
        const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
        const totalViews = photos.reduce((sum, photo) => sum + (photo.views || 0), 0);
        const uniqueLocations = new Set(photos.map(photo => photo.location)).size;
        
        await userService.updateUserStats(userId, {
          totalPhotos: photos.length - userProfile.stats.totalPhotos,
          totalLikes: totalLikes - userProfile.stats.totalLikes,
          totalViews: totalViews - userProfile.stats.totalViews,
          locationsContributed: uniqueLocations - userProfile.stats.locationsContributed
        });
        
        // Check for new badges
        await userService.checkAndAwardBadges(userId);
        
        // Get updated profile
        const updatedProfile = await userService.getUserProfile(userId);
        setProfile(updatedProfile);
        
        // Check if current user is following this user
        if (currentUser && !ownProfile) {
          const followStatus = await userService.checkIfFollowing(currentUser.uid, userId);
          setIsFollowing(followStatus);
        }
        
        // Load user activities
        const activities = await userService.getUserActivities(userId, 10);
        setUserActivities(activities);
        
        // Set edit form values
        if (updatedProfile) {
          setEditForm({
            displayName: updatedProfile.displayName,
            bio: updatedProfile.bio || '',
            location: updatedProfile.location || ''
          });
        }
        
      } catch (error) {
        console.error('Error loading user profile:', error);
        toast.error('Failed to load user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId, currentUser]);

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
        toast.success('Unfollowed user');
      } else {
        await userService.followUser(currentUser.uid, userId!);
        setIsFollowing(true);
        // Update local profile follower count
        setProfile(prev => prev ? {
          ...prev,
          stats: { ...prev.stats, followers: prev.stats.followers + 1 }
        } : null);
        toast.success('Now following user!');
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error('Failed to update follow status');
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
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
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
          <p className="text-gray-600">Loading profile...</p>
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
          <div className="flex items-center">
            <Link to="/">
              <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
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
                        Joined {profile.joinedAt?.toDate ? 
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
                          Following
                        </>
                      ) : (
                        <>
                          <UserPlus className="h-4 w-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                  ) : isOwnProfile ? (
                    <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full mb-4">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div>
                            <label className="text-sm font-medium">Display Name</label>
                            <Input
                              value={editForm.displayName}
                              onChange={(e) => setEditForm(prev => ({ ...prev, displayName: e.target.value }))}
                              placeholder="Your display name"
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Bio</label>
                            <Textarea
                              value={editForm.bio}
                              onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                              placeholder="Tell us about yourself..."
                              rows={3}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium">Location</label>
                            <Input
                              value={editForm.location}
                              onChange={(e) => setEditForm(prev => ({ ...prev, location: e.target.value }))}
                              placeholder="e.g. Zagreb, Croatia"
                            />
                          </div>
                          <div className="flex gap-2 pt-4">
                            <Button onClick={handleEditProfile} className="flex-1">
                              Save Changes
                            </Button>
                            <Button 
                              variant="outline" 
                              onClick={() => setEditProfileOpen(false)}
                              className="flex-1"
                            >
                              Cancel
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
                      <div className="text-xs text-gray-500">Followers</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{profile.stats.following}</div>
                      <div className="text-xs text-gray-500">Following</div>
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
                      Achievements ({profile.badges.length})
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
                    Photos ({profile.stats.totalPhotos})
                  </TabsTrigger>
                  <TabsTrigger value="stats" className="flex items-center gap-2">
                    <Trophy className="h-4 w-4" />
                    Statistics
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    Activity
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos" className="mt-6">
                  {userPhotos.length > 0 ? (
                    <>
                      <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="font-semibold mb-2">Collection Overview</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div className="text-center">
                            <div className="text-lg font-bold text-blue-600">{profile.stats.totalPhotos}</div>
                            <div className="text-gray-500">Total Photos</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-green-600">{profile.stats.locationsContributed}</div>
                            <div className="text-gray-500">Locations</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-red-600">{profile.stats.totalLikes}</div>
                            <div className="text-gray-500">Total Likes</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-bold text-purple-600">{profile.stats.totalViews}</div>
                            <div className="text-gray-500">Total Views</div>
                          </div>
                        </div>
                      </div>
                      <PhotoGrid photos={userPhotos} />
                    </>
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos yet</h3>
                      <p className="text-gray-600 mb-4">
                        {isOwnProfile 
                          ? "Start sharing your historical photos to build your collection!" 
                          : "This user hasn't shared any photos yet."
                        }
                      </p>
                      {isOwnProfile && (
                        <Link to="/upload">
                          <Button>
                            <Camera className="h-4 w-4 mr-2" />
                            Upload Your First Photo
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
                          Contribution Stats
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Total Photos</span>
                          <span className="font-bold text-blue-600">{profile.stats.totalPhotos}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Unique Locations</span>
                          <span className="font-bold text-green-600">{profile.stats.locationsContributed}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Likes Received</span>
                          <span className="font-bold text-red-600">{profile.stats.totalLikes}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Total Views</span>
                          <span className="font-bold text-purple-600">{profile.stats.totalViews}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Achievements Earned</span>
                          <span className="font-bold text-yellow-600">{profile.badges.length}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Community Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span>Followers</span>
                          <span className="font-bold text-blue-600">{profile.stats.followers}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Following</span>
                          <span className="font-bold text-blue-600">{profile.stats.following}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Avg. Likes per Photo</span>
                          <span className="font-bold text-red-600">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalLikes / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Avg. Views per Photo</span>
                          <span className="font-bold text-purple-600">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalViews / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span>Member Since</span>
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
                        Recent Activity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {userActivities.length > 0 ? (
                        <div className="space-y-4">
                          {userActivities.map(activity => {
                            const activityInfo = ACTIVITY_DISPLAY[activity.type] || 
                              { text: activity.type, icon: Star, color: 'text-gray-600' };
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
                          <p className="text-gray-500 mb-4">No recent activity</p>
                          {isOwnProfile && (
                            <p className="text-sm text-gray-400">
                              Start uploading photos and interacting with the community to see your activity here!
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
    </div>
  );
};

export default UserProfilePage;