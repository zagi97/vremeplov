// src/pages/UserProfile.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  ArrowLeft, 
  User, 
  MapPin, 
  Calendar, 
  Camera, 
  Heart, 
  Eye, 
  Trophy,
  Star,
  UserPlus,
  UserCheck,
  Medal,
  Crown,
  Shield,
  Award
} from "lucide-react";
import PhotoGrid from "../components/PhotoGrid";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";

// User badge types
interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  requirement: string;
}

// User stats interface
interface UserStats {
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  locationsContributed: number;
  joinedDate: string;
  followers: number;
  following: number;
}

// User profile interface
interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  website?: string;
  stats: UserStats;
  badges: UserBadge[];
  isFollowing?: boolean;
}

// Available badges
const AVAILABLE_BADGES: UserBadge[] = [
  {
    id: 'photographer',
    name: 'Photographer',
    description: 'Uploaded first photo',
    icon: Camera,
    color: 'bg-blue-500',
    requirement: '1+ photos'
  },
  {
    id: 'historian',
    name: 'Local Historian',
    description: 'Uploaded 10+ historical photos',
    icon: Medal,
    color: 'bg-purple-500',
    requirement: '10+ photos'
  },
  {
    id: 'explorer',
    name: 'Heritage Explorer',
    description: 'Contributed to 5+ locations',
    icon: MapPin,
    color: 'bg-green-500',
    requirement: '5+ locations'
  },
  {
    id: 'popular',
    name: 'Community Favorite',
    description: 'Received 100+ total likes',
    icon: Heart,
    color: 'bg-red-500',
    requirement: '100+ likes'
  },
  {
    id: 'detective',
    name: 'Photo Detective',
    description: 'Tagged 20+ people in photos',
    icon: Shield,
    color: 'bg-indigo-500',
    requirement: '20+ tags'
  },
  {
    id: 'veteran',
    name: 'Heritage Veteran',
    description: 'Member for 1+ year',
    icon: Crown,
    color: 'bg-yellow-500',
    requirement: '1+ year'
  },
  {
    id: 'legend',
    name: 'Heritage Legend',
    description: 'Uploaded 50+ photos',
    icon: Trophy,
    color: 'bg-orange-500',
    requirement: '50+ photos'
  }
];

const UserProfilePage = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userPhotos, setUserPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('photos');

  // Calculate badges based on user stats
  const calculateUserBadges = (stats: UserStats, photos: Photo[]): UserBadge[] => {
    const earnedBadges: UserBadge[] = [];
    
    // Get unique locations
    const uniqueLocations = new Set(photos.map(photo => photo.location)).size;
    
    // Calculate member duration
    const joinDate = new Date(stats.joinedDate);
    const yearsSinceMember = (Date.now() - joinDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
    
    AVAILABLE_BADGES.forEach(badge => {
      let earned = false;
      
      switch (badge.id) {
        case 'photographer':
          earned = stats.totalPhotos >= 1;
          break;
        case 'historian':
          earned = stats.totalPhotos >= 10;
          break;
        case 'explorer':
          earned = uniqueLocations >= 5;
          break;
        case 'popular':
          earned = stats.totalLikes >= 100;
          break;
        case 'detective':
          // This would need tagged people count from your database
          earned = false; // Placeholder
          break;
        case 'veteran':
          earned = yearsSinceMember >= 1;
          break;
        case 'legend':
          earned = stats.totalPhotos >= 50;
          break;
      }
      
      if (earned) {
        earnedBadges.push(badge);
      }
    });
    
    return earnedBadges;
  };

useEffect(() => {
  const loadUserProfile = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      
      // Check if viewing own profile
      const ownProfile = currentUser?.uid === userId;
      setIsOwnProfile(ownProfile);
      
      // Load user's photos to calculate stats
      const photos = await photoService.getPhotosByUploader(userId);
      setUserPhotos(photos);
      
      // Calculate stats
      const totalLikes = photos.reduce((sum, photo) => sum + (photo.likes || 0), 0);
      const totalViews = photos.reduce((sum, photo) => sum + (photo.views || 0), 0);
      const uniqueLocations = new Set(photos.map(photo => photo.location)).size;
      
      const stats: UserStats = {
        totalPhotos: photos.length,
        totalLikes,
        totalViews,
        locationsContributed: uniqueLocations,
        joinedDate: photos[0]?.uploadedAt || new Date().toISOString(),
        followers: 0, // Would come from your user database
        following: 0  // Would come from your user database
      };
      
      // Calculate badges
      const badges = calculateUserBadges(stats, photos);
      
      // Get user info - different logic for own profile vs others
      let userDisplayName = 'Unknown User';
      let userEmail = '';
      let userPhotoURL = '';
      let userBio = '';
      
      if (ownProfile && currentUser) {
        // If it's the current user's own profile, use their auth data
        userDisplayName = currentUser.displayName || currentUser.email || 'Unknown User';
        userEmail = currentUser.email || '';
        userPhotoURL = currentUser.photoURL || '';
        userBio = 'Passionate about preserving Croatian heritage through historical photography.';
      } else {
        // For other users, try to get info from their photos or database
        if (photos.length > 0) {
          // Use the uploadedBy field from their photos
          userDisplayName = photos[0].uploadedBy || 'Unknown User';
          userBio = `Contributor to Vremeplov.hr with ${photos.length} historical photo${photos.length !== 1 ? 's' : ''}.`;
        }
        // In a real app, you'd query a users collection: 
        // const userDoc = await getUserById(userId);
        // userDisplayName = userDoc.displayName;
        // userEmail = userDoc.email;
        // userPhotoURL = userDoc.photoURL;
      }
      
      const userProfile: UserProfile = {
        uid: userId,
        displayName: userDisplayName,
        email: userEmail,
        photoURL: userPhotoURL || undefined,
        bio: userBio,
        location: 'Croatia',
        stats,
        badges,
        isFollowing: false // Would check follow relationship in real app
      };
      
      setProfile(userProfile);
      
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
    if (!profile || !currentUser || isOwnProfile) return;
    
    try {
      // In a real app, you'd call your follow/unfollow API here
      const newFollowState = !profile.isFollowing;
      
      setProfile(prev => prev ? {
        ...prev,
        isFollowing: newFollowState,
        stats: {
          ...prev.stats,
          followers: prev.stats.followers + (newFollowState ? 1 : -1)
        }
      } : null);
      
      toast.success(newFollowState ? 'Now following user!' : 'Unfollowed user');
    } catch (error) {
      toast.error('Failed to update follow status');
    }
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
                      <span>Joined {new Date(profile.stats.joinedDate).getFullYear()}</span>
                    </div>
                  </div>

                  {/* Follow/Edit Button */}
                  {!isOwnProfile && currentUser ? (
                    <Button
                      onClick={handleFollowToggle}
                      variant={profile.isFollowing ? "outline" : "default"}
                      className="w-full mb-4"
                    >
                      {profile.isFollowing ? (
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
                    <Button variant="outline" className="w-full mb-4">
                      Edit Profile
                    </Button>
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
                      Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3">
                      {profile.badges.map(badge => {
                        const IconComponent = badge.icon;
                        return (
                          <div key={badge.id} className="text-center">
                            <div className={`w-12 h-12 rounded-full ${badge.color} flex items-center justify-center mx-auto mb-2`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-xs font-medium">{badge.name}</div>
                            <div className="text-xs text-gray-500">{badge.requirement}</div>
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
                    <PhotoGrid photos={userPhotos} />
                  ) : (
                    <div className="text-center py-12">
                      <Camera className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">No photos yet</h3>
                      <p className="text-gray-600">
                        {isOwnProfile 
                          ? "Start sharing your historical photos to build your collection!" 
                          : "This user hasn't shared any photos yet."
                        }
                      </p>
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
                        <div className="flex justify-between">
                          <span>Total Photos</span>
                          <span className="font-bold">{profile.stats.totalPhotos}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Locations</span>
                          <span className="font-bold">{profile.stats.locationsContributed}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Likes</span>
                          <span className="font-bold text-red-600">{profile.stats.totalLikes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Views</span>
                          <span className="font-bold text-blue-600">{profile.stats.totalViews}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Trophy className="h-5 w-5" />
                          Community Impact
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between">
                          <span>Avg. Likes per Photo</span>
                          <span className="font-bold">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalLikes / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Avg. Views per Photo</span>
                          <span className="font-bold">
                            {profile.stats.totalPhotos > 0 
                              ? Math.round(profile.stats.totalViews / profile.stats.totalPhotos) 
                              : 0
                            }
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Badges Earned</span>
                          <span className="font-bold text-yellow-600">{profile.badges.length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Member Since</span>
                          <span className="font-bold">
                            {new Date(profile.stats.joinedDate).toLocaleDateString('hr-HR')}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="activity" className="mt-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {userPhotos.slice(0, 5).map(photo => (
                          <div key={photo.id} className="flex items-center gap-4 p-3 border rounded-lg">
                            <img 
                              src={photo.imageUrl} 
                              alt={photo.description}
                              className="w-12 h-12 object-cover rounded"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{photo.description}</p>
                              <p className="text-sm text-gray-500">
                                {photo.location} • {photo.year}
                              </p>
                            </div>
                            <div className="text-sm text-gray-400">
                              {new Date(photo.uploadedAt || '').toLocaleDateString('hr-HR')}
                            </div>
                          </div>
                        ))}
                        
                        {userPhotos.length === 0 && (
                          <div className="text-center py-8">
                            <Star className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">No recent activity</p>
                          </div>
                        )}
                      </div>
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