import { userService, LeaderboardUser, CommunityStats, MonthlyHighlights } from "../services/user";
// src/pages/CommunityLeaderboard.tsx
import { useState, useEffect, memo } from 'react';
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
import LazyImage from '../components/LazyImage';
import Footer from "@/components/Footer";
import PageHeader from "@/components/PageHeader";
import { getAvatarColor, getUserInitials } from "@/utils/avatarUtils";
import { cn } from "@/lib/utils";

// Time period for leaderboard
type TimePeriod = 'all-time' | 'this-year' | 'this-month';

// ✅ Helper funkcije za pluralizaciju
const getBadgeText = (count: number, t: any) => {
  if (count === 1) return t('community.badge');
  if (count >= 2 && count <= 4) return t('community.badgesPlural');
  return t('community.badgesMany');
};

const getPhotoText = (count: number, t: any) => {
  if (count === 1) return t('community.newPhoto');
  if (count >= 2 && count <= 4) return t('community.newPhotosPlural');
  return t('community.newPhotosMany');
};

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
    mostActiveLocation: { name: t('common.loading'), photoCount: 0 },
    photoOfTheMonth: { title: t('common.loading'), author: t('common.loading') },
    newMembers: { count: 0, percentageChange: 0 }
  });

  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('photos');
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('this-month');

  useEffect(() => {
    let isCancelled = false;
    
    const loadLeaderboard = async () => {
      try {
        if (!isCancelled) setLoading(true);

        // Load leaderboard data from Firebase
        const leaderboard = await userService.getLeaderboard(timePeriod, 10);
        
        // Load community stats for current time period
        const stats = await userService.getCommunityStats(timePeriod);
        
        // Load monthly highlights only for relevant periods
        let highlights = monthlyHighlights;
        if (timePeriod === 'this-month') {
          highlights = await userService.getMonthlyHighlights();
        } else if (timePeriod === 'this-year') {
          highlights = await userService.getYearlyHighlights();
        }
        
        // Update all state only if component is still mounted
        if (!isCancelled) {
          setLeaderboardData(leaderboard);
          setCommunityStats(stats);
          setMonthlyHighlights(highlights);
        }
        
      } catch (error) {
        if (!isCancelled) {
          console.error('Error loading leaderboard:', error);
          toast.error(t('community.loadFailed'));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadLeaderboard();
    
    return () => {
      isCancelled = true;
    };
  }, [timePeriod, t]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />;
      default:
        return <span className="text-base sm:text-lg font-bold text-gray-500">#{rank}</span>;
    }
  };

  // ✅ React.memo prevents re-rendering cards that haven't changed
  const LeaderboardCard = memo(({ user, category }: { user: LeaderboardUser; category: string }) => {
    const getDisplayValue = () => {
      switch (category) {
        case 'photos':
          return `${user.totalPhotos.toLocaleString()} ${t('profile.photos')}`;
        case 'likes':
          return `${user.totalLikes.toLocaleString()} ${t('community.likes')}`;
        case 'locations':
          return `${user.locationsCount.toLocaleString()} ${t('community.locations')}`;
        case 'recent':
          return `${t('community.joined')}: ${user.joinDate ? new Date(user.joinDate).toLocaleDateString('hr-HR') : 'N/A'}`;
        default:
          return `${user.totalPhotos.toLocaleString()} ${t('profile.photos')}`;
      }
    };

    return (
      <Card className={`mb-3 sm:mb-4 ${user.rank <= 3 ? 'border-2' : ''} ${user.rank === 1 ? 'border-yellow-400' : user.rank === 2 ? 'border-gray-400' : user.rank === 3 ? 'border-amber-400' : ''}`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              {/* Rank */}
              <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0">
                {getRankIcon(user.rank)}
              </div>

              {/* User Info */}
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback className={cn(getAvatarColor(user.uid), "text-white")}>
                    {getUserInitials(user.displayName, null)}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0 flex-1">
                  <Link 
                    to={`/user/${user.uid}`}
                    className="font-semibold text-sm sm:text-base text-gray-900 hover:text-blue-600 transition-colors block truncate"
                  >
                    {user.displayName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-500 truncate">
                      {getDisplayValue()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Badges and Stats */}
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
              {/* Recent Photo Preview */}
              {user.recentPhotoUrl && (
                <LazyImage
                  src={user.recentPhotoUrl} 
                  alt="Recent upload"
                  className="w-10 h-10 object-cover rounded hidden xs:block"
                  threshold={0.5}
                  rootMargin="50px"
                  placeholder={
                    <div className="w-10 h-10 bg-gray-200 animate-pulse rounded flex items-center justify-center">
                      <Camera className="h-4 w-4 text-gray-400" />
                    </div>
                  }
                />
              )}

              {/* Mini Stats */}
              <div className="hidden md:flex items-center gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500">
                <div className="flex items-center gap-1">
                  <Camera className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{user.totalPhotos}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Heart className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{user.totalLikes}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span>{user.locationsCount}</span>
                </div>
              </div>

              {/* Top Badge */}
              {user.badges.length > 0 && (
                <Badge variant="secondary" className="hidden lg:flex text-xs">
                  {user.badges.length} {getBadgeText(user.badges.length, t)}
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  });

  // ✅ LEADERBOARD SKELETON
  const LeaderboardSkeleton = () => (
    <Card className="mb-3 sm:mb-4">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 rounded-full animate-pulse" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ✅ SIDEBAR SKELETON - NOVO!
  const SidebarSkeleton = () => (
    <>
      {/* Community Stats Skeleton */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="h-5 w-32 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Highlights Skeleton */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <div className="h-5 w-48 bg-gray-200 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="pb-3 sm:pb-4 border-b border-gray-100 last:border-b-0">
              <div className="h-3 w-32 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Badge Showcase - ostaje statičan */}
      <Card>
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('community.achievementSystem')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs sm:text-sm text-gray-600 mb-3">
            {t('community.earnBadges')}
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Camera className="h-2 w-2 text-white" />
              </div>
              <span className="truncate">{t('community.photographer')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Medal className="h-2 w-2 text-white" />
              </div>
              <span className="truncate">{t('community.localHistorian')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                <MapPin className="h-2 w-2 text-white" />
              </div>
              <span className="truncate">{t('community.heritageExplorer')}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Heart className="h-2 w-2 text-white" />
              </div>
              <span className="truncate">{t('community.communityFavorite')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col">
      <PageHeader title="Vremeplov.hr"/>
      
      {/* Hero section */}
      <div className="bg-white border-b border-gray-200 py-8 pt-24">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Desktop layout */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                <Trophy className="h-6 w-6 md:h-7 md:w-7 text-blue-600" />
                {t("community.leaderboard")}
              </h1>
              <p className="text-gray-600 text-sm md:text-base">
                {t("community.celebratingContributors")}
              </p>
            </div>
            
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
                  disabled={loading}
                  className="text-xs sm:text-sm"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="md:hidden text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-blue-600" />
              {t("community.leaderboard")}
            </h1>
            <p className="text-gray-600 text-sm mb-4">
              {t("community.celebratingContributors")}
            </p>
            
            <div className="flex gap-2 justify-center">
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
                  disabled={loading}
                  className="text-xs flex-1 max-w-[120px]"
                >
                  {period.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard Content */}
      <section className="py-6 sm:py-8 px-4">
        <div className="container max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 max-w-2xl mx-auto mb-6 sm:mb-8 gap-1">
              <TabsTrigger value="photos" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('community.mostPhotos')}</span>
                <span className="sm:hidden truncate">{t('profile.photos')}</span>
              </TabsTrigger>
              <TabsTrigger value="likes" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('community.mostLiked')}</span>
                <span className="sm:hidden truncate">{t('community.likes')}</span>
              </TabsTrigger>
              <TabsTrigger value="locations" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('community.mostLocations')}</span>
                <span className="sm:hidden truncate">{t('community.places')}</span>
              </TabsTrigger>
              <TabsTrigger value="recent" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-4">
                <Star className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden sm:inline">{t('community.newMembers')}</span>
                <span className="sm:hidden truncate">{t('community.new')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
              {/* Main Leaderboard */}
              <div className="lg:col-span-2 order-1">
                <TabsContent value="photos">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.topContributorsByPhotos')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : leaderboardData.photos.length > 0 ? (
                        leaderboardData.photos.map(user => (
                          <LeaderboardCard key={user.uid} user={user} category="photos" />
                        ))
                      ) : (
                        <div className="text-center py-8 text-gray-500 text-sm">
                          {t('community.noDataForPeriod')}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="likes">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.mostAppreciatedContributors')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : (
                        leaderboardData.likes.map(user => (
                          <LeaderboardCard key={user.uid} user={user} category="likes" />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="locations">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.heritageExplorers')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : (
                        leaderboardData.locations.map(user => (
                          <LeaderboardCard key={user.uid} user={user} category="locations" />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recent">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.welcomeNewMembers')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : (
                        leaderboardData.recent.map(user => (
                          <LeaderboardCard key={user.uid} user={user} category="recent" />
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>

              {/* ✅ SIDEBAR - CONDITIONAL RENDERING */}
              <div className="space-y-4 sm:space-y-6 order-2 lg:order-2">
                {loading ? (
                  <SidebarSkeleton />
                ) : (
                  <>
                    {/* Community Stats */}
                    <Card>
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                          {t('community.communityStats')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">{t('community.totalMembers')}</span>
                          <span className="font-bold">{communityStats.totalMembers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">{t('community.photosShared')}</span>
                          <span className="font-bold">{communityStats.photosShared.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">{t('community.locationsDocumented')}</span>
                          <span className="font-bold">{communityStats.locationsDocumented.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600">{t('profile.totalLikes')}</span>
                          <span className="font-bold">{communityStats.totalLikes.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* This Month's Highlights */}
                    <Card>
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          {t('community.thisMonthsHighlights')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        <div className="pb-3 sm:pb-4 border-b border-gray-100">
                          <div className="text-xs sm:text-sm text-gray-600 mb-2">
                            {t('community.mostActiveLocation')}
                          </div>
                          <div className="font-medium text-base sm:text-lg">
                            {monthlyHighlights.mostActiveLocation.name}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            {monthlyHighlights.mostActiveLocation.photoCount} {getPhotoText(monthlyHighlights.mostActiveLocation.photoCount, t)}
                          </div>
                        </div>
                        
                        <div className="pb-3 sm:pb-4 border-b border-gray-100">
                          <div className="text-xs sm:text-sm text-gray-600 mb-2">
                            {t('community.photoOfTheMonth')}
                          </div>
                          <div className="font-medium text-base sm:text-lg">
                            {monthlyHighlights.photoOfTheMonth.title}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            {t('community.by')} {monthlyHighlights.photoOfTheMonth.author}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-xs sm:text-sm text-gray-600 mb-2">
                            {t('community.newMembers')}
                          </div>
                          <div className="font-medium text-base sm:text-lg">
                            {monthlyHighlights.newMembers.count} {t('community.joined')}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 mt-1">
                            {monthlyHighlights.newMembers.percentageChange > 0 ? '+' : ''}
                            {monthlyHighlights.newMembers.percentageChange}% {t('community.fromLastMonth')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Badge Showcase */}
                    <Card>
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                          {t('community.achievementSystem')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs sm:text-sm text-gray-600 mb-3">
                          {t('community.earnBadges')}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Camera className="h-2 w-2 text-white" />
                            </div>
                            <span className="truncate">{t('community.photographer')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Medal className="h-2 w-2 text-white" />
                            </div>
                            <span className="truncate">{t('community.localHistorian')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-2 w-2 text-white" />
                            </div>
                            <span className="truncate">{t('community.heritageExplorer')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Heart className="h-2 w-2 text-white" />
                            </div>
                            <span className="truncate">{t('community.communityFavorite')}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </div>
            </div>
          </Tabs>
        </div>
      </section>

      {/* Footer */}
      <Footer/>
    </div>
  );
};

export default CommunityLeaderboard;