// src/pages/Location.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { Search, Filter, X, MapPin, Calendar, Camera, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import PhotoUpload from "../components/PhotoUpload";
import StoryForm from "../components/StoryForm";
import { photoService, Photo, storyService, Story } from "../services/firebaseService";
import { useAuth } from "../contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import LazyImage from "../components/LazyImage";
import { useLanguage, translateWithParams } from "../contexts/LanguageContext";

import { municipalityData } from '../../data/municipalities';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import SEO from '@/components/SEO';
import { parseLocationFromUrl, normalizeCountyName } from '@/utils/locationUtils';
import { formatYear } from '@/utils/dateUtils';
import LoadingScreen from '@/components/LoadingScreen';
import { YEAR_RANGES, getPhotoTypeOptions, getSortOptions } from '@/constants/filters';
import { usePhotoFilters } from '@/hooks/usePhotoFilters';
import EmptyState from '@/components/EmptyState';
import LocationUploadButton from '@/components/location/LocationUploadButton';
import LocationStories from '@/components/location/LocationStories';

const translateCityType = (type: string, t: (key: string) => string) => {
  switch (type.toLowerCase()) {
    case 'grad':
      return t('cityType.city');
    case 'općina':
      return t('cityType.municipality');
    default:
      return type;
  }
};

const PHOTOS_PER_PAGE = 12;

const Location = () => {
  const { t } = useLanguage();

  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const { user, signInWithGoogle } = useAuth();

  // Parse URL parameter
  const locationData = parseLocationFromUrl(decodedLocationName, municipalityData);
  const actualCityName = locationData.cityName;

  // Validate location
  const allLocations: string[] = municipalityData.records.map(record => record[3] as string);
  const isValidLocation = allLocations.some(
    loc => loc.toLowerCase() === actualCityName.toLowerCase()
  );

  // Constants
  const PHOTO_TYPES = getPhotoTypeOptions(t);
  const SORT_OPTIONS = getSortOptions(t);

  // State
  const [activeTab, setActiveTab] = useState('photos');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStoryForm, setShowStoryForm] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Photo filters hook
  const {
    filters,
    filteredPhotos,
    setFilters,
    clearFilters,
    hasFilters,
    totalCount
  } = usePhotoFilters(allPhotos);

  // Upload limit state
  const [uploadLimitInfo, setUploadLimitInfo] = useState<{
    canUpload: boolean;
    uploadsToday: number;
    remainingToday: number;
    userTier: string;
    dailyLimit: number;
    nextTierInfo?: string;
  } | null>(null);

  // Check upload limit when user logs in
  useEffect(() => {
    const checkUploadLimit = async () => {
      if (!user) {
        setUploadLimitInfo(null);
        return;
      }

      try {
        const limitCheck = await photoService.canUserUploadToday(user.uid);
        setUploadLimitInfo({
          canUpload: limitCheck.allowed,
          uploadsToday: limitCheck.uploadsToday,
          remainingToday: limitCheck.remainingToday,
          userTier: limitCheck.userTier,
          dailyLimit: limitCheck.dailyLimit,
          nextTierInfo: limitCheck.nextTierInfo
        });
      } catch (error) {
        console.error('Error checking upload limit:', error);
      }
    };

    checkUploadLimit();
  }, [user]);

  // Redirect if location is not valid
  if (!isValidLocation) {
    return <Navigate to="/not-found" replace />;
  }

  // Handler functions
  const handleSignInToAddMemory = async () => {
    await signInWithGoogle();
  };

  const handleUploadSuccess = async () => {
    setShowAddForm(false);

    try {
      const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
      setAllPhotos(locationPhotos);

      if (user) {
        const updatedLimitCheck = await photoService.canUserUploadToday(user.uid);
        setUploadLimitInfo({
          canUpload: updatedLimitCheck.allowed,
          uploadsToday: updatedLimitCheck.uploadsToday,
          remainingToday: updatedLimitCheck.remainingToday,
          userTier: updatedLimitCheck.userTier,
          dailyLimit: updatedLimitCheck.dailyLimit,
          nextTierInfo: updatedLimitCheck.nextTierInfo
        });
      }
    } catch (error) {
      console.error('Error refreshing photos:', error);
    }
  };

  const loadMorePhotos = () => {
    if (loadingMore || !hasMore) return;

    setLoadingMore(true);
    const nextPage = currentPage + 1;
    const startIndex = (nextPage - 1) * PHOTOS_PER_PAGE;
    const endIndex = nextPage * PHOTOS_PER_PAGE;
    const newPhotos = filteredPhotos.slice(startIndex, endIndex);

    if (newPhotos.length > 0) {
      setDisplayedPhotos(prev => [...prev, ...newPhotos]);
      setCurrentPage(nextPage);
      setHasMore(endIndex < filteredPhotos.length);
    } else {
      setHasMore(false);
    }

    setLoadingMore(false);
  };

  // Load stories
  const loadStories = async () => {
    if (!actualCityName) return;
    try {
      setStoriesLoading(true);
      const locationStories = await storyService.getStoriesByLocation(actualCityName);
      setStories(locationStories);
    } catch (error) {
      console.error('Error loading stories:', error);
    } finally {
      setStoriesLoading(false);
    }
  };

  useEffect(() => {
    if (actualCityName && stories.length === 0 && !storiesLoading) {
      loadStories();
    }
  }, [actualCityName]);

  const handleStorySuccess = () => {
    setShowStoryForm(false);
    loadStories();
  };

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      if (!actualCityName) return;

      try {
        setLoading(true);
        const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
        setAllPhotos(locationPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [actualCityName]);

  // Update displayed photos when filtered photos change
  useEffect(() => {
    setCurrentPage(1);
    const firstPage = filteredPhotos.slice(0, PHOTOS_PER_PAGE);
    setDisplayedPhotos(firstPage);
    setHasMore(filteredPhotos.length > PHOTOS_PER_PAGE);
  }, [filteredPhotos]);

  if (loading) {
    return <LoadingScreen message={t('location.loadingPhotos')} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
      {/* Dynamic SEO meta tags */}
      <SEO
        title={translateWithParams(t, 'seo.locationTitle', { location: locationData.displayName })}
        description={translateWithParams(t, 'seo.locationDescription', {
          count: totalCount,
          location: locationData.cityName
        })}
        url={`/location/${encodeURIComponent(decodedLocationName)}`}
      />
      {/* Global header */}
      <PageHeader title="Vremeplov.hr" />

      {/* Page intro section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-10 mt-16 shadow-sm">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
            {/* Left side: location info */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 break-words mb-4">
                {locationData.displayName}
              </h2>

              {/* County and type info */}
              {locationData.isSpecific && locationData.county && locationData.type && (
                <div className="mb-3">
                  <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 flex-wrap">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm sm:text-base">
                      {normalizeCountyName(locationData.county)}
                    </span>
                    <span className="text-gray-400 dark:text-gray-600">•</span>
                    <span className="text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                      {translateCityType(locationData.type, t)}
                    </span>
                  </div>
                </div>
              )}

              {/* Non-specific location info */}
              {!locationData.isSpecific && (
                <div className="mb-3">
                  {(() => {
                    const basicInfo = municipalityData.records.find(
                      (record) => record[3] === actualCityName
                    );
                    if (basicInfo) {
                      return (
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 flex-wrap">
                          <MapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="text-sm sm:text-base">
                            {normalizeCountyName(basicInfo[1] as string)}
                          </span>
                          <span className="text-gray-400 dark:text-gray-600">•</span>
                          <span className="text-xs sm:text-sm font-medium bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-700 dark:text-gray-300">
                            {translateCityType(basicInfo[2] as string, t)}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              )}

              {/* Photo count */}
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 break-words">
                {t("location.exploreHistory")}
                {filteredPhotos.length !== allPhotos.length && (
                  <span className="ml-2 text-blue-600 font-medium">
                    ({filteredPhotos.length} {t("common.of")} {allPhotos.length}{" "}
                    {t("location.photos")})
                  </span>
                )}
              </p>
            </div>

            {/* Right side: upload button */}
            <div className="flex-shrink-0 w-full sm:w-auto">
              <LocationUploadButton
                user={user}
                activeTab={activeTab}
                uploadLimitInfo={uploadLimitInfo}
                onAddPhoto={() => setShowAddForm(true)}
                onAddStory={() => setShowStoryForm(true)}
                onSignIn={handleSignInToAddMemory}
                t={t}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Upload Form Modal */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('upload.addPhotoTo')} {locationData.displayName}
            </DialogTitle>
          </DialogHeader>
          <PhotoUpload
            locationName={actualCityName}
            onSuccess={handleUploadSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Story Form Modal */}
      <Dialog open={showStoryForm} onOpenChange={setShowStoryForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>
              {t('stories.shareStory')} - {locationData.displayName}
            </DialogTitle>
          </DialogHeader>
          <StoryForm
            locationName={actualCityName}
            onSuccess={handleStorySuccess}
            onCancel={() => setShowStoryForm(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <section className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container max-w-6xl mx-auto px-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-transparent border-b-0 h-auto p-0 gap-0">
              <TabsTrigger
                value="photos"
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                {t('stories.tabPhotos')} ({allPhotos.length})
              </TabsTrigger>
              <TabsTrigger
                value="stories"
                className="relative rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent data-[state=active]:text-blue-600 data-[state=active]:shadow-none px-4 py-3 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 dark:data-[state=active]:text-blue-400 dark:data-[state=active]:border-blue-400 flex items-center gap-2"
              >
                <BookOpen className="h-4 w-4" />
                {t('stories.tabStories')} ({stories.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </section>

      {/* Search and Filter Section (photos only) */}
      {activeTab === 'photos' && (
        <section className="py-6 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
                  <Input
                    placeholder={t('location.searchPlaceholder')}
                    value={filters.searchText}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                    className="pl-10 placeholder:text-xs sm:placeholder:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                  />
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 ${hasFilters ? 'border-blue-500 text-blue-600' : ''}`}
              >
                <Filter className="h-4 w-4" />
                {t('location.filters')} {hasFilters && '●'}
              </Button>

              {hasFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                  <X className="h-4 w-4" />
                  {t('location.clear')}
                </Button>
              )}
            </div>

            {showFilters && (
              <Card className="mt-4 dark:bg-gray-800 dark:border-gray-700">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">{t('location.timePeriod')}</label>
                      <Select
                        value={filters.yearRange?.label || 'all'}
                        onValueChange={(value) => {
                          if (value === 'all') {
                            setFilters(prev => ({ ...prev, yearRange: null }));
                          } else {
                            const range = YEAR_RANGES.find(r => r.label === value);
                            setFilters(prev => ({ ...prev, yearRange: range || null }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('location.allYears')} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">{t('location.allYears')}</SelectItem>
                          {YEAR_RANGES.map(range => (
                            <SelectItem key={range.label} value={range.label}>
                              {range.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">{t('location.photoType')}</label>
                      <Select
                        value={filters.photoType}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, photoType: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={t('location.allTypes')} />
                        </SelectTrigger>
                        <SelectContent>
                          {PHOTO_TYPES.map(type => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-gray-100">{t('location.sortBy')}</label>
                      <Select
                        value={filters.sortBy}
                        onValueChange={(value) => setFilters(prev => ({ ...prev, sortBy: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SORT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </section>
      )}

      {/* Results Summary */}
      {activeTab === 'photos' && hasFilters && (
        <section className="py-4 px-4 bg-blue-50 dark:bg-blue-900/20">
          <div className="container max-w-6xl mx-auto">
            <p className="text-blue-700 dark:text-blue-300">
              {t('location.showing')} {filteredPhotos.length} {t('common.of')} {allPhotos.length} {t('location.photos')}
              {filters.searchText && ` ${t('location.matching')} "${filters.searchText}"`}
              {filters.yearRange && ` ${t('location.from')} ${filters.yearRange.label}`}
              {filters.photoType !== 'all' && ` ${t('location.in')} ${PHOTO_TYPES.find(t => t.value === filters.photoType)?.label}`}
            </p>
          </div>
        </section>
      )}

      {/* Photos Feed Section */}
      {activeTab === 'photos' && (
        <section className="py-12 px-4 flex-1 bg-[#F8F9FA] dark:bg-gray-900">
          <div className="container max-w-6xl mx-auto">
            {filteredPhotos.length === 0 ? (
              <EmptyState
                icon={Camera}
                title={t('location.noPhotos')}
                description={hasFilters ? t('location.tryAdjusting') : undefined}
                action={hasFilters ? {
                  label: t('location.clearAllFilters'),
                  onClick: clearFilters
                } : undefined}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayedPhotos.map((photo, index) => (
                    <Link
                      key={photo.id}
                      to={`/photo/${photo.id}`}
                      className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
                    >
                      <LazyImage
                        src={photo.imageUrl}
                        alt={`${photo.location}, ${formatYear(photo.year, t)}`}
                        className="transition-transform duration-500 group-hover:scale-110"
                        aspectRatio="4/3"
                        responsiveImages={photo.responsiveImages}
                        priority={index === 0}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80"></div>
                      <div className="absolute bottom-0 left-0 p-4 w-full">
                        <h3 className="text-white text-lg font-semibold line-clamp-1">{photo.description}</h3>
                        <div className="flex items-center mt-2 text-gray-200 text-sm">
                          <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span className="mr-3 truncate">{photo.location}</span>
                          <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                          <span>{formatYear(photo.year, t)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>

                {hasMore && (
                  <div className="mt-12 text-center">
                    <Button
                      onClick={loadMorePhotos}
                      disabled={loadingMore}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {loadingMore ? t('common.loading') : t('location.loadMoreMemories')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      )}

      {/* Stories Section */}
      {activeTab === 'stories' && (
        <section className="py-8 px-4 flex-1 bg-[#F8F9FA] dark:bg-gray-900">
          <div className="container max-w-4xl mx-auto">
            <LocationStories
              stories={stories}
              storiesLoading={storiesLoading}
              t={t}
            />
          </div>
        </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Location;
