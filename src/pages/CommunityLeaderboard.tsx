// src/pages/CommunityLeaderboard.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { 
  ArrowLeft, 
  Trophy, 
  Crown, 
  Medal, 
  Award,
  Camera,
  Heart,
  Eye,
  MapPin,
  Star,
  TrendingUp,
  Calendar,
  Users
} from "lucide-react";
import { photoService } from "../services/firebaseService";
import { toast } from 'sonner';

// Leaderboard entry interface
interface LeaderboardUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  rank: number;
  totalPhotos: number;
  totalLikes: number;
  totalViews: number;
  locationsCount: number;
  joinDate: string;
  badges: string[];
  recentPhotoUrl?: string;
}

// Time period for leaderboard
type TimePeriod = 'all-time' | 'this-year' | 'this-month';

const CommunityLeaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState<{
    photos: LeaderboardUser[];
    likes: LeaderboardUser[];
    locations: LeaderboardUser[];
    recent: LeaderboardUser[];
  }>({
    photos: [],
    likes: [],
    locations: [],
    recent: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time');

  // Mock leaderboard data (in real app, this would come from your API)
  const generateMockLeaderboard = (): typeof leaderboardData => {
    const mockUsers: LeaderboardUser[] = [
      {
        uid: '1',
        displayName: 'Ana Marić',
        photoURL: 'https://images.unsplash.com/photo-1494790108755-2616b612b100?w=150',
        rank: 1,
        totalPhotos: 127,
        totalLikes: 2456,
        totalViews: 15420,
        locationsCount: 23,
        joinDate: '2023-03-15',
        badges: ['photographer', 'historian', 'explorer', 'popular'],
        recentPhotoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'
      },
      {
        uid: '2',
        displayName: 'Marko Kovač',
        photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        rank: 2,
        totalPhotos: 89,
        totalLikes: 1823,
        totalViews: 12100,
        locationsCount: 18,
        joinDate: '2023-05-22',
        badges: ['photographer', 'historian', 'explorer'],
        recentPhotoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'
      },
      {
        uid: '3',
        displayName: 'Petra Novak',
        photoURL: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        rank: 3,
        totalPhotos: 76,
        totalLikes: 1654,
        totalViews: 9870,
        locationsCount: 15,
        joinDate: '2023-07-08',
        badges: ['photographer', 'historian'],
        recentPhotoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'
      },
      {
        uid: '4',
        displayName: 'Josip Babić',
        photoURL: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
        rank: 4,
        totalPhotos: 64,
        totalLikes: 1432,
        totalViews: 8960,
        locationsCount: 12,
        joinDate: '2023-09-12',
        badges: ['photographer', 'explorer'],
        recentPhotoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'
      },
      {
        uid: '5',
        displayName: 'Miljenko Jurić',
        photoURL: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        rank: 5,
        totalPhotos: 52,
        totalLikes: 1205,
        totalViews: 7840,
        locationsCount: 9,
        joinDate: '2023-11-03',
        badges: ['photographer'],
        recentPhotoUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100'
      }
    ];

    return {
      photos: [...mockUsers].sort((a, b) => b.totalPhotos - a.totalPhotos),
      likes: [...mockUsers].sort((a, b) => b.totalLikes - a.totalLikes),
      locations: [...mockUsers].sort((a, b) => b.locationsCount - a.locationsCount),
      recent: [...mockUsers].sort((a, b) => new Date(b.joinDate).getTime() - new Date(a.joinDate).getTime())
    };
  };

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        
        // In a real app, you'd fetch this from your API based on timePeriod
        // const data = await photoService.getLeaderboard(timePeriod);
        
        // For now, using mock data
        const data = generateMockLeaderboard();
        setLeaderboardData(data);
        
      } catch (error) {
        console.error('Error loading leaderboard:', error);
        toast.error('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [timePeriod]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gradient-to-r from-blue-500 to-blue-600';
    }
  };

  const LeaderboardCard = ({ user, category }: { user: LeaderboardUser; category: string }) => {
    const getMetricValue = () => {
      switch (category) {
        case 'photos':
          return user.totalPhotos;
        case 'likes':
          return user.totalLikes;
        case 'locations':
          return user.locationsCount;
        case 'recent':
          return new Date(user.joinDate).toLocaleDateString('hr-HR');
        default:
          return user.totalPhotos;
      }
    };

    const getMetricLabel = () => {
      switch (category) {
        case 'photos':
          return 'photos';
        case 'likes':
          return 'likes';
        case 'locations':
          return 'locations';
        case 'recent':
          return 'joined';
        default:
          return 'photos';
      }
    };

    return (
      <Card className={`mb-4 ${user.rank <= 3 ? 'border-2' : ''} ${user.rank === 1 ? 'border-yellow-400' : user.rank === 2 ? 'border-gray-400' : user.rank === 3 ? 'border-amber-400' : ''}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-10 h-10">
                {getRankIcon(user.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>
                    {user.displayName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div>
                  <Link 
                    to={`/user/${user.uid}`}
                    className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {user.displayName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">
                      {typeof getMetricValue() === 'number' 
                        ? `${getMetricValue().toLocaleString()} ${getMetricLabel()}`
                        : `${getMetricLabel()}: ${getMetricValue()}`
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges and Stats */}
            <div className="flex items-center gap-4">
              {/* Recent Photo Preview */}
              {user.recentPhotoUrl && (
                <img 
                  src={user.recentPhotoUrl} 
                  alt="Recent upload"
                  className="w-10 h-10 object-cover rounded"
                />
              )}

              {/* Mini Stats */}
              <div className="hidden md:flex items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Camera className="h-4 w-4" />
                  <span>{user.totalPhotos}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-4 w-4" />
                  <span>{user.totalLikes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user.locationsCount}</span>
                </div>
              </div>

              {/* Top Badge */}
              {user.badges.length > 0 && (
                <Badge variant="secondary" className="hidden lg:flex">
                  {user.badges.length} badge{user.badges.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Header */}
      <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2 mr-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              Community Leaderboard
            </h2>
            <p className="text-gray-300">Celebrating our top heritage contributors</p>
          </div>
        </div>
      </header>

      {/* Time Period Selector */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">Time Period:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all-time', label: 'All Time' },
                  { value: 'this-year', label: 'This Year' },
                  { value: 'this-month', label: 'This Month' }
                ].map(period => (
                  <Button
                    key={period.value}
                    variant={timePeriod === period.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTimePeriod(period.value as TimePeriod)}
                  >
                    {period.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="text-sm text-gray-500">
              Updated daily at midnight
            </div>
          </div>
        </div>
      </section>

      {/* Leaderboard Content */}
      <section className="py-8 px-4">
        <div className="container max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-8">
              <TabsTrigger value="photos" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                <span className="hidden sm:inline">Most Photos</span>
                <span className="sm:hidden">Photos</span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">Most Liked</span>
                <span className="sm:hidden">Likes</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">Most Locations</span>
                <span className="sm:hidden">Places</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">New Members</span>
                <span className="sm:hidden">New</span>
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Leaderboard */}
              <div className="lg:col-span-2">
                <TabsContent value="photos">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Camera className="h-5 w-5" />
                        Top Contributors by Photos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leaderboardData.photos.map(user => (
                        <LeaderboardCard key={user.uid} user={user} category="photos" />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="likes">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Heart className="h-5 w-5" />
                        Most Appreciated Contributors
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leaderboardData.likes.map(user => (
                        <LeaderboardCard key={user.uid} user={user} category="likes" />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="locations">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        Heritage Explorers
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leaderboardData.locations.map(user => (
                        <LeaderboardCard key={user.uid} user={user} category="locations" />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recent">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5" />
                        Welcome New Members
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {leaderboardData.recent.map(user => (
                        <LeaderboardCard key={user.uid} user={user} category="recent" />
                      ))}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>

              {/* Sidebar Stats */}
              <div className="space-y-6">
                {/* Community Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Community Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Members</span>
                      <span className="font-bold">2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Photos Shared</span>
                      <span className="font-bold">15,423</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Locations Documented</span>
                      <span className="font-bold">342</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Likes</span>
                      <span className="font-bold">89,156</span>
                    </div>
                  </CardContent>
                </Card>

                {/* This Month's Highlights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      This Month's Highlights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">Most Active Location</div>
                      <div className="font-medium">Čačinci</div>
                      <div className="text-xs text-gray-500">47 new photos</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Photo of the Month</div>
                      <div className="font-medium">Old Town Square 1952</div>
                      <div className="text-xs text-gray-500">by Ana Marić</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">New Members</div>
                      <div className="font-medium">156 joined</div>
                      <div className="text-xs text-gray-500">+23% from last month</div>
                    </div>
                  </CardContent>
                </Card>

                {/* Badge Showcase */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Achievement System
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-3">
                      Earn badges by contributing to our heritage collection:
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Camera className="h-2 w-2 text-white" />
                        </div>
                        <span>Photographer: Upload your first photo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Medal className="h-2 w-2 text-white" />
                        </div>
                        <span>Local Historian: Share 10+ photos</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <MapPin className="h-2 w-2 text-white" />
                        </div>
                        <span>Heritage Explorer: 5+ locations</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <Heart className="h-2 w-2 text-white" />
                        </div>
                        <span>Community Favorite: 100+ likes</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default CommunityLeaderboard;