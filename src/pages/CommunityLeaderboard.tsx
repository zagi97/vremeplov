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
import EmptyState from "@/components/EmptyState";

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

  // Pagination state for each tab
  const [visibleCounts, setVisibleCounts] = useState({
    photos: 12,
    likes: 12,
    locations: 12,
    recent: 12
  });
  const USERS_PER_PAGE = 12;

  // Reset pagination when time period changes
  useEffect(() => {
    setVisibleCounts({
      photos: 12,
      likes: 12,
      locations: 12,
      recent: 12
    });
  }, [timePeriod]);

  useEffect(() => {
    let isCancelled = false;

    const loadLeaderboard = async () => {
      try {
        if (!isCancelled) setLoading(true);

        // Load leaderboard data from Firebase
        const leaderboard = await userService.getLeaderboard(timePeriod, 50); // Load more for pagination
        
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

  const loadMoreUsers = (tab: 'photos' | 'likes' | 'locations' | 'recent') => {
    setVisibleCounts(prev => ({
      ...prev,
      [tab]: prev[tab] + USERS_PER_PAGE
    }));
  };

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
      <Card className={`mb-3 sm:mb-4 dark:bg-gray-800 dark:border-gray-700 ${user.rank <= 3 ? 'border-2' : ''} ${user.rank === 1 ? 'border-yellow-400' : user.rank === 2 ? 'border-gray-400' : user.rank === 3 ? 'border-amber-400' : ''}`}>
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
                    className="font-semibold text-sm sm:text-base text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400 transition-colors block truncate"
                  >
                    {user.displayName}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">
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
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 animate-pulse rounded flex items-center justify-center">
                      <Camera className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    </div>
                  }
                />
              )}

              {/* Mini Stats */}
              <div className="hidden md:flex items-center gap-3 lg:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
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
    <Card className="mb-3 sm:mb-4 dark:bg-gray-800 dark:border-gray-700">
      <CardContent className="p-3 sm:p-4">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // ✅ SIDEBAR SKELETON - NOVO!
  const SidebarSkeleton = () => (
    <>
      {/* Community Stats Skeleton */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
              <div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Monthly Highlights Skeleton */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-6">
          <div className="h-5 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="h-3 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-2" />
              <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mb-1" />
              <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Badge Showcase - ostaje statičan */}
      <Card className="dark:bg-gray-800 dark:border-gray-700">
        <CardHeader className="pb-3 sm:pb-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg dark:text-white">
            <Award className="h-4 w-4 sm:h-5 sm:w-5" />
            {t('community.achievementSystem')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mb-3">
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
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <PageHeader title="Vremeplov.hr"/>

      {/* Hero section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-8 pt-24">
        <div className="container max-w-6xl mx-auto px-4">
          {/* Desktop layout */}
          <div className="hidden md:flex md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                <Trophy className="h-6 w-6 md:h-7 md:w-7 text-blue-600 dark:text-blue-400" />
                {t("community.leaderboard")}
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-sm md:text-base">
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 flex items-center justify-center gap-2">
              <Trophy className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              {t("community.leaderboard")}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
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
      <section className="py-6 sm:py-8 px-4 pb-20">
        <div className="container max-w-6xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 max-w-2xl mx-auto mb-10 sm:mb-12 gap-1 sm:gap-1 p-1 bg-transparent">
              <TabsTrigger
                value="photos"
                className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-2 bg-background hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
              >
                <Camera className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline">{t('community.mostPhotos')}</span>
                <span className="md:hidden truncate">{t('profile.photos')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-2 bg-background hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
              >
                <Heart className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline">{t('community.mostLiked')}</span>
                <span className="md:hidden truncate">{t('community.likes')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="locations"
                className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-2 bg-background hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
              >
                <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline">{t('community.mostLocations')}</span>
                <span className="md:hidden truncate">{t('community.places')}</span>
              </TabsTrigger>
              <TabsTrigger
                value="recent"
                className="flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3 md:px-4 py-2.5 sm:py-2 bg-background hover:bg-accent data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:font-semibold data-[state=active]:shadow-md transition-all"
              >
                <Star className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                <span className="hidden md:inline">{t('community.newMembers')}</span>
                <span className="md:hidden truncate">{t('community.new')}</span>
              </TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
              {/* Main Leaderboard */}
              <div className="lg:col-span-2 order-1">
                <TabsContent value="photos">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                        <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.topContributorsByPhotos')}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : leaderboardData.photos.length > 0 ? (
                        <>
                          {leaderboardData.photos.slice(0, visibleCounts.photos).map(user => (
                            <LeaderboardCard key={user.uid} user={user} category="photos" />
                          ))}
                          {leaderboardData.photos.length > visibleCounts.photos && (
                            <div className="mt-4 text-center">
                              <Button
                                variant="outline"
                                onClick={() => loadMoreUsers('photos')}
                                className="w-full sm:w-auto"
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {t('community.loadMore')}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <EmptyState
                          icon={Camera}
                          title={t('community.emptyPhotos')}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="likes">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                        <Heart className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.mostAppreciatedContributors')}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : leaderboardData.likes.length > 0 ? (
                        <>
                          {leaderboardData.likes.slice(0, visibleCounts.likes).map(user => (
                            <LeaderboardCard key={user.uid} user={user} category="likes" />
                          ))}
                          {leaderboardData.likes.length > visibleCounts.likes && (
                            <div className="mt-4 text-center">
                              <Button
                                variant="outline"
                                onClick={() => loadMoreUsers('likes')}
                                className="w-full sm:w-auto"
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {t('community.loadMore')}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <EmptyState
                          icon={Heart}
                          title={t('community.emptyActivity')}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="locations">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                        <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.heritageExplorers')}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : leaderboardData.locations.length > 0 ? (
                        <>
                          {leaderboardData.locations.slice(0, visibleCounts.locations).map(user => (
                            <LeaderboardCard key={user.uid} user={user} category="locations" />
                          ))}
                          {leaderboardData.locations.length > visibleCounts.locations && (
                            <div className="mt-4 text-center">
                              <Button
                                variant="outline"
                                onClick={() => loadMoreUsers('locations')}
                                className="w-full sm:w-auto"
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {t('community.loadMore')}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <EmptyState
                          icon={MapPin}
                          title={t('community.emptyLocations')}
                        />
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="recent">
                  <Card>
                    <CardHeader className="pb-3 sm:pb-6">
                      <h2 className="flex items-center gap-2 text-base sm:text-lg font-semibold leading-none tracking-tight">
                        <Star className="h-4 w-4 sm:h-5 sm:w-5" />
                        {t('community.welcomeNewMembers')}
                      </h2>
                    </CardHeader>
                    <CardContent>
                      {loading ? (
                        <>
                          {[...Array(5)].map((_, i) => (
                            <LeaderboardSkeleton key={i} />
                          ))}
                        </>
                      ) : leaderboardData.recent.length > 0 ? (
                        <>
                          {leaderboardData.recent.slice(0, visibleCounts.recent).map(user => (
                            <LeaderboardCard key={user.uid} user={user} category="recent" />
                          ))}
                          {leaderboardData.recent.length > visibleCounts.recent && (
                            <div className="mt-4 text-center">
                              <Button
                                variant="outline"
                                onClick={() => loadMoreUsers('recent')}
                                className="w-full sm:w-auto"
                              >
                                <TrendingUp className="h-4 w-4 mr-2" />
                                {t('community.loadMore')}
                              </Button>
                            </div>
                          )}
                        </>
                      ) : (
                        <EmptyState
                          icon={Users}
                          title={t('community.emptyMembers')}
                        />
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
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-100">
                          <Users className="h-4 w-4 sm:h-5 sm:w-5" />
                          {t('community.communityStats')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3 sm:space-y-4">
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600 dark:text-gray-400">{t('community.totalMembers')}</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{communityStats.totalMembers.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600 dark:text-gray-400">{t('community.photosShared')}</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{communityStats.photosShared.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600 dark:text-gray-400">{t('community.locationsDocumented')}</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{communityStats.locationsDocumented.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm sm:text-base">
                          <span className="text-gray-600 dark:text-gray-400">{t('profile.totalLikes')}</span>
                          <span className="font-bold text-gray-900 dark:text-gray-100">{communityStats.totalLikes.toLocaleString()}</span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Highlights */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-100">
                          <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5" />
                          {timePeriod === 'all-time' && t('community.allTimeHighlights')}
                          {timePeriod === 'this-year' && t('community.thisYearsHighlights')}
                          {timePeriod === 'this-month' && t('community.thisMonthsHighlights')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4 sm:space-y-6">
                        <div className="pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t('community.mostActiveLocation')}
                          </div>
                          {monthlyHighlights.mostActiveLocation.photoCount > 0 ? (
                            <Link
                              to={`/location/${encodeURIComponent(monthlyHighlights.mostActiveLocation.name)}`}
                              className="font-medium text-base sm:text-lg text-blue-600 dark:text-blue-400 truncate block hover:text-blue-700 dark:hover:text-blue-500 transition-colors underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-700 dark:hover:decoration-blue-500"
                            >
                              {monthlyHighlights.mostActiveLocation.name}
                            </Link>
                          ) : (
                            <div className="font-medium text-base sm:text-lg text-red-500 dark:text-red-400 truncate">
                              {monthlyHighlights.mostActiveLocation.name}
                            </div>
                          )}
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {monthlyHighlights.mostActiveLocation.photoCount} {getPhotoText(monthlyHighlights.mostActiveLocation.photoCount, t)}
                          </div>
                        </div>

                        <div className="pb-3 sm:pb-4 border-b border-gray-100 dark:border-gray-700">
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t('community.photoOfTheMonth')}
                          </div>
                          {monthlyHighlights.photoOfTheMonth.id ? (
                            <Link
                              to={`/photo/${monthlyHighlights.photoOfTheMonth.id}`}
                              className="font-medium text-base sm:text-lg text-blue-600 dark:text-blue-400 line-clamp-2 block hover:text-blue-700 dark:hover:text-blue-500 transition-colors underline decoration-blue-600/30 dark:decoration-blue-400/30 hover:decoration-blue-700 dark:hover:decoration-blue-500"
                            >
                              {monthlyHighlights.photoOfTheMonth.title}
                            </Link>
                          ) : (
                            <div className="font-medium text-base sm:text-lg text-gray-900 dark:text-gray-100 line-clamp-2">
                              {monthlyHighlights.photoOfTheMonth.title}
                            </div>
                          )}
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">
                            {t('community.by')} {monthlyHighlights.photoOfTheMonth.author}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2">
                            {t('community.newMembers')}
                          </div>
                          <div className="font-medium text-base sm:text-lg text-gray-900 dark:text-gray-100">
                            {monthlyHighlights.newMembers.count} {t('community.joined')}
                          </div>
                          <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {monthlyHighlights.newMembers.percentageChange > 0 ? '+' : ''}
                            {monthlyHighlights.newMembers.percentageChange}% {t('community.fromLastMonth')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Badge Showcase */}
                    <Card className="dark:bg-gray-800 dark:border-gray-700">
                      <CardHeader className="pb-3 sm:pb-6">
                        <CardTitle className="flex items-center gap-2 text-base sm:text-lg text-gray-900 dark:text-gray-100">
                          <Award className="h-4 w-4 sm:h-5 sm:w-5" />
                          {t('community.achievementSystem')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-3">
                          {t('community.earnBadges')}
                        </div>
                        <div className="space-y-2 text-xs">
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Camera className="h-2 w-2 text-white" />
                            </div>
                            <span className="hidden sm:inline truncate">{t('community.photographer')}</span>
                            <span className="sm:hidden truncate">{t('community.photographerShort')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Medal className="h-2 w-2 text-white" />
                            </div>
                            <span className="hidden sm:inline truncate">{t('community.localHistorian')}</span>
                            <span className="sm:hidden truncate">{t('community.localHistorianShort')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <MapPin className="h-2 w-2 text-white" />
                            </div>
                            <span className="hidden sm:inline truncate">{t('community.heritageExplorer')}</span>
                            <span className="sm:hidden truncate">{t('community.heritageExplorerShort')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                              <Heart className="h-2 w-2 text-white" />
                            </div>
                            <span className="hidden sm:inline truncate">{t('community.communityFavorite')}</span>
                            <span className="sm:hidden truncate">{t('community.communityFavoriteShort')}</span>
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