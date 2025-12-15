// src/pages/Location.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Plus, LogIn, Search, Filter, X, MapPin, Tag, Calendar, Camera } from "lucide-react";
import PhotoUpload from "../components/PhotoUpload";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import LazyImage from "../components/LazyImage";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

import { municipalityData } from '../../data/municipalities';
import Footer from '@/components/Footer';
import PageHeader from '@/components/PageHeader';
import { parseLocationFromUrl, normalizeCountyName } from '@/utils/locationUtils';
import LoadingScreen from '@/components/LoadingScreen';
import { YEAR_RANGES, getPhotoTypeOptions, getSortOptions, YearRange } from '@/constants/filters';
import { usePhotoFilters, DEFAULT_FILTERS } from '@/hooks/usePhotoFilters';
import { PhotoFilterState } from '@/utils/photoFilters';
import EmptyState from '@/components/EmptyState';

const translateCityType = (type: string, t: any) => {
  switch (type.toLowerCase()) {
    case 'grad':
      return t('cityType.city');
    case 'općina':
      return t('cityType.municipality');
    default:
      return type;
  }
};

// Interface definicije - now using PhotoFilterState from utils

const Location = () => {
  const { t } = useLanguage();
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const { user, signInWithGoogle } = useAuth();

  // Parsiraj URL parametar
  const locationData = parseLocationFromUrl(decodedLocationName, municipalityData);
  const actualCityName = locationData.cityName;
  
  // Validacija
  const allLocations: string[] = municipalityData.records.map(record => record[3] as string);
  const isValidLocation = allLocations.includes(actualCityName);

  // Konstante - koristi centralizirane definicije iz filters.ts
  const PHOTO_TYPES = getPhotoTypeOptions(t);
  const SORT_OPTIONS = getSortOptions(t);

  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PHOTOS_PER_PAGE = 12;

  // Use photo filters hook
  const {
    filters,
    filteredPhotos,
    setFilters,
    updateFilter,
    clearFilters,
    hasFilters,
    filteredCount,
    totalCount
  } = usePhotoFilters(allPhotos);

  // ✅ DODAJ OVO - Upload Limit State
  const [uploadLimitInfo, setUploadLimitInfo] = useState<{
    canUpload: boolean;
    uploadsToday: number;
    remainingToday: number;
    userTier: string;
    dailyLimit: number;
    nextTierInfo?: string;
  } | null>(null);

  const [showClickTooltip, setShowClickTooltip] = useState(false);


  // ✅ Close click tooltip when clicking outside
useEffect(() => {
  const handleClickOutside = () => {
    if (showClickTooltip) {
      setShowClickTooltip(false);
    }
  };
  
  if (showClickTooltip) {
    document.addEventListener('click', handleClickOutside);
  }
  
  return () => {
    document.removeEventListener('click', handleClickOutside);
  };
}, [showClickTooltip]);

  // ✅ DODAJ OVO - Check limit when user logs in
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

  // Redirect ako lokacija nije validna
  if (!isValidLocation) {
    return <Navigate to="/not-found" replace />;
  }

  // Handler funkcije
  const handleSignInToAddMemory = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(t('comments.signInError'));
      
    }
  };

  const handleUploadSuccess = async () => {
  setShowAddForm(false);
  // Removed toast - PhotoUpload already shows success message

  try {
    const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
    setAllPhotos(locationPhotos);
    
    // ✅ REFRESH upload limit info
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

  // useEffect hooks
  useEffect(() => {
    const loadPhotos = async () => {
      if (!actualCityName) return;

      try {
        setLoading(true);
        console.log('🔵 Loading photos for location:', actualCityName);
        const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
        console.log('✅ Loaded photos:', {
          location: actualCityName,
          count: locationPhotos.length,
          photos: locationPhotos.map(p => ({
            id: p.id,
            description: p.description,
            year: p.year,
            isApproved: p.isApproved,
            location: p.location
          }))
        });
        setAllPhotos(locationPhotos);
      } catch (error) {
        console.error('❌ Error loading photos:', error);
        // ✅ FIX: Don't show error toast for empty location
        // Empty state is OK, only show error for real failures
        // toast.error(t('errors.photoLoadFailed'));
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

  // hasFilters is now hasFilters from usePhotoFilters hook

if (loading) {
  return <LoadingScreen message={t('location.loadingPhotos')} />;
}

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-gray-900">
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

              {/* Info o županiji i tipu */}
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

              {/* Ako nije specific */}
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

              {/* Broj fotografija */}
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

            {/* Right side: buttons */}
<div className="flex-shrink-0 w-full sm:w-auto">
  {user ? (
    <div className="w-full sm:w-auto">
      {/* ✅ TIER INFO BADGE - Desktop Only */}
      {uploadLimitInfo && (
        <div className="hidden sm:block mb-2 text-xs text-right">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            uploadLimitInfo.canUpload 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {uploadLimitInfo.canUpload ? '✓' : '✕'} {uploadLimitInfo.remainingToday}/{uploadLimitInfo.dailyLimit} {t('upload.remaining')}
          </span>
        </div>
      )}
      
      {/* ✅ BUTTON with Tooltip */}
      <div className="relative group">
        <Button
          onClick={() => {
            if (uploadLimitInfo?.canUpload) {
              setShowAddForm(true);
            } else {
              // ✅ Na tablet - toggle tooltip on click
              setShowClickTooltip(!showClickTooltip);
            }
          }}
          disabled={uploadLimitInfo ? !uploadLimitInfo.canUpload : false}
          className={`w-full sm:w-auto flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2 ${
            uploadLimitInfo?.canUpload 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          <span className="truncate">{t("location.addMemory")}</span>
        </Button>
        
        {/* ✅ DESKTOP HOVER TOOLTIP - Only on large screens with mouse */}
        {uploadLimitInfo && !uploadLimitInfo.canUpload && (
          <div className="hidden lg:block absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none w-48 z-30">
            <div className="text-center">
              <div className="font-semibold mb-1">
                {t('upload.limitReached')}
              </div>
              <div className="text-gray-300 leading-tight">
                Učitano: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </div>
              {uploadLimitInfo.userTier === 'NEW_USER' && (
                <div className="text-blue-300 mt-2 text-[9px] leading-tight">
                  💡 Verificiraj se za više
                </div>
              )}
            </div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        )}
        
        {/* ✅ TABLET CLICK TOOLTIP - Shows BELOW button (640-1024px only) */}
        {uploadLimitInfo && !uploadLimitInfo.canUpload && showClickTooltip && (
          <div className="hidden sm:block lg:hidden absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg w-64 z-30 shadow-xl">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowClickTooltip(false);
              }}
              className="absolute top-1 right-1 text-gray-400 hover:text-white text-lg leading-none"
            >
              ✕
            </button>
            <div className="text-center pt-3">
              <div className="font-semibold mb-1 text-sm">
                {t('upload.limitReached')}
              </div>
              <div className="text-gray-300 text-xs leading-tight">
                Učitano danas: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </div>
              {uploadLimitInfo.userTier === 'NEW_USER' && (
                <div className="text-blue-300 mt-2 text-xs leading-tight">
                  💡 Verificiraj se za više uploadova
                </div>
              )}
            </div>
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-[-1px]">
              <div className="border-4 border-transparent border-b-gray-900"></div>
            </div>
          </div>
        )}
      </div>

      {/* ✅ MOBILE PERSISTENT CARD - Shows below button on mobile (<640px) */}
      {uploadLimitInfo && !uploadLimitInfo.canUpload && (
        <div className="sm:hidden mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-red-800">
                {t('upload.limitReached')}
              </h3>
              <p className="mt-1 text-xs text-red-700">
                {t('upload.uploadedToday')}: {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
              </p>
              {uploadLimitInfo.nextTierInfo && (
                <p className="mt-2 text-xs text-blue-700 flex items-start gap-1">
                  <span className="flex-shrink-0">💡</span>
                  <span>{uploadLimitInfo.nextTierInfo}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  ) : (
    <Button
      onClick={handleSignInToAddMemory}
      className="w-full sm:w-auto bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
    >
      <LogIn className="h-4 w-4 flex-shrink-0" />
      <span className="truncate">{t("location.signInToAdd")}</span>
    </Button>
  )}
</div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
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

      {/* Results Summary */}
      {hasFilters && (
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

      {/* Feed Section */}
      <section className="py-12 px-4 flex-1 bg-[#F8F9FA]">
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
                {displayedPhotos.map((photo) => (
<Link 
  key={photo.id} 
  to={`/photo/${photo.id}`}
  className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
>
<LazyImage
  src={photo.imageUrl}
  alt={`${photo.location}, ${photo.year}`}
  className="transition-transform duration-500 group-hover:scale-110"
  aspectRatio="4/3"
  responsiveImages={photo.responsiveImages} // ✅ ADD THIS!
/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80"></div>
                    <div className="absolute bottom-0 left-0 p-4 w-full">
                      <h3 className="text-white text-lg font-semibold">{photo.description}</h3>
                      <div className="flex items-center mt-2 text-gray-200 text-sm">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span className="mr-3">{photo.location}</span>
                        <Calendar className="h-4 w-4 mr-1" />
                        <span>{photo.year}</span>
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

     {/* Footer */}
      <Footer/>
    </div>
  );
};

export default Location;