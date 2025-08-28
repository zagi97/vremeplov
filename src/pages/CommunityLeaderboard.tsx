import { userService, LeaderboardUser, CommunityStats, MonthlyHighlights } from "../services/userService";
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
  MapPin,
  Star,
  TrendingUp,
  Users
} from "lucide-react";
import { toast } from 'sonner';
import { useLanguage } from "../contexts/LanguageContext";
import LanguageSelector from "../components/LanguageSelector";

// Time period for leaderboard
type TimePeriod = 'all-time' | 'this-year' | 'this-month';

const CommunityLeaderboard = () => {
  const { t } = useLanguage();
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
const [communityStats, setCommunityStats] = useState<CommunityStats>({
    totalMembers: 0,
    photosShared: 0,
    locationsDocumented: 0,
    totalLikes: 0
  });
  const [monthlyHighlights, setMonthlyHighlights] = useState<MonthlyHighlights>({
    mostActiveLocation: { name: 'Loading...', photoCount: 0 },
    photoOfTheMonth: { title: 'Loading...', author: 'Loading...' },
    newMembers: { count: 0, percentageChange: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('all-time');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);

        // Load leaderboard data from Firebase
        const leaderboard = await userService.getLeaderboard(timePeriod, 10);
        setLeaderboardData(leaderboard);

         // Load community stats (only on initial load or all-time period)
        if (timePeriod === 'all-time') {
          const stats = await userService.getCommunityStats();
          setCommunityStats(stats);
          
          const highlights = await userService.getMonthlyHighlights();
          setMonthlyHighlights(highlights);
        }     
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
          return t('profile.photos');
        case 'likes':
          return t('community.likes');
        case 'locations':
          return t('community.locations');
        case 'recent':
          return t('community.joined');
        default:
          return t('profile.photos');
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
                  {user.badges.length} {t('community.badge')}{user.badges.length !== 1 ? 's' : ''}
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
          <p className="text-gray-600">{t('community.loadingLeaderboard')}</p>
        </div>
      </div>
    );
  };

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
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>
          </div>
          <div className="mt-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8" />
              {t('community.leaderboard')}
            </h2>
            <p className="text-gray-300">{t('community.celebratingContributors')}</p>
          </div>
        </div>
      </header>

      {/* Time Period Selector */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="container max-w-6xl mx-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-700">{t('community.timePeriod')}:</span>
              <div className="flex gap-2">
                {[
                  { value: 'all-time', label: t('community.allTime') },
                  { value: 'this-year', label: t('community.thisYear') },
                  { value: 'this-month', label: t('community.thisMonth') }
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
              {t('community.updatedDaily')}
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
                <span className="hidden sm:inline">{t('community.mostPhotos')}</span>
                <span className="sm:hidden">{t('profile.photos')}</span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex items-center gap-2">
                <Heart className="h-4 w-4" />
                <span className="hidden sm:inline">{t('community.mostLiked')}</span>
                <span className="sm:hidden">{t('community.likes')}</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span className="hidden sm:inline">{t('community.mostLocations')}</span>
                <span className="sm:hidden">{t('community.places')}</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                <span className="hidden sm:inline">{t('community.newMembers')}</span>
                <span className="sm:hidden">{t('community.new')}</span>
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
                        {t('community.topContributorsByPhotos')}
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
                        {t('community.mostAppreciatedContributors')}
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
                        {t('community.heritageExplorers')}
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
                        {t('community.welcomeNewMembers')}
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
                      {t('community.communityStats')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('community.totalMembers')}</span>
                      <span className="font-bold">{communityStats.totalMembers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('community.photosShared')}</span>
                      <span className="font-bold">{communityStats.photosShared.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('community.locationsDocumented')}</span>
                      <span className="font-bold">{communityStats.locationsDocumented.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('profile.totalLikes')}</span>
                      <span className="font-bold">{communityStats.totalLikes.toLocaleString()}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* This Month's Highlights */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {t('community.thisMonthsHighlights')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">{t('community.mostActiveLocation')}</div>
                      <div className="font-medium">{monthlyHighlights.mostActiveLocation.name}</div>
                      <div className="text-xs text-gray-500">{monthlyHighlights.mostActiveLocation.photoCount} {t('community.newPhotos')}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{t('community.photoOfTheMonth')}</div>
                      <div className="font-medium">{monthlyHighlights.photoOfTheMonth.title}</div>
                      <div className="text-xs text-gray-500">{t('community.by')} {monthlyHighlights.photoOfTheMonth.author}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">{t('community.newMembers')}</div>
                      <div className="font-medium">{monthlyHighlights.newMembers.count} {t('community.joined')}</div>
                      <div className="text-xs text-gray-500">
                        {monthlyHighlights.newMembers.percentageChange > 0 ? '+' : ''}
                        {monthlyHighlights.newMembers.percentageChange}% {t('community.fromLastMonth')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Badge Showcase */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      {t('community.achievementSystem')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600 mb-3">
                      {t('community.earnBadges')}
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                          <Camera className="h-2 w-2 text-white" />
                        </div>
                        <span>{t('community.photographer')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                          <Medal className="h-2 w-2 text-white" />
                        </div>
                        <span>{t('community.localHistorian')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <MapPin className="h-2 w-2 text-white" />
                        </div>
                        <span>{t('community.heritageExplorer')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                          <Heart className="h-2 w-2 text-white" />
                        </div>
                        <span>{t('community.communityFavorite')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </Tabs>
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

export default CommunityLeaderboard;