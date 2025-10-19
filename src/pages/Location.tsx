// src/pages/Location.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Card, CardContent } from "../components/ui/card";
import { ArrowLeft, Plus, LogIn, Search, Filter, X, Calendar, Tag, TrendingUp, Clock, MapPin } from "lucide-react";
import PhotoUpload from "../components/PhotoUpload";
import { photoService, Photo } from "../services/firebaseService";
import { toast } from 'sonner';
import { useAuth } from "../contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import LazyImage from "../components/LazyImage";
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

import municipalityData from '../../data/municipalities.json';
import Footer from '@/components/Footer';

// Helper funkcije
const parseLocationFromUrl = (urlParam: string) => {
  if (urlParam.includes('-')) {
    const parts = urlParam.split('-');
    const cityName = parts[0];
    const countyFromUrl = parts.slice(1).join('-');
    
    const record = municipalityData.records.find(record => {
      const recordName = record[3] as string;
      const recordCounty = (record[1] as string)
        .replace(/^[IVX]+\s/, '')
        .replace('DUBROVAČKO-NERETVANSKA', 'Dubrovačko-neretvanska')
        .replace('SPLITSKO-DALMATINSKA', 'Splitsko-dalmatinska')
        .replace('OSJEČKO-BARANJSKA', 'Osječko-baranjska')
        .replace('VUKOVARSKO-SRIJEMSKA', 'Vukovarsko-srijemska')
        .replace('POŽEŠKO-SLAVONSKA', 'Požeško-slavonska')
        .replace('BRODSKO-POSAVSKA', 'Brodsko-posavska')
        .replace('VIROVITIČKO-PODRAVSKA', 'Virovitičko-podravska')
        .replace('KOPRIVNIČKO-KRIŽEVAČKA', 'Koprivničko-križevačka')
        .replace('BJELOVARSKO-BILOGORSKA', 'Bjelovarsko-bilogorska')
        .replace('PRIMORSKO-GORANSKA', 'Primorsko-goranska')
        .replace('SISAČKO-MOSLAVAČKA', 'Sisačko-moslavačka')
        .replace('KRAPINSKO-ZAGORSKA', 'Krapinsko-zagorska')
        .replace('ŠIBENSKO-KNINSKA', 'Šibensko-kninska')
        .replace('LIČKO-SENJSKA', 'Ličko-senjska')
        .replace('KARLOVAČKA', 'Karlovačka')
        .replace('VARAŽDINSKA', 'Varaždinska')
        .replace('ZAGREBAČKA', 'Zagrebačka')
        .replace('MEĐIMURSKA', 'Međimurska')
        .replace('ISTARSKA', 'Istarska')
        .replace('ZADARSKA', 'Zadarska')
        .replace('GRAD ZAGREB', 'Zagreb')
        .replace(/\s+/g, '');
      
      return recordName === cityName && recordCounty === countyFromUrl;
    });
    
    if (record) {
      const formattedCounty = (record[1] as string)
        .replace(/^[IVX]+\s/, '')
        .replace('DUBROVAČKO-NERETVANSKA', 'Dubrovačko-neretvanska')
        .replace('SPLITSKO-DALMATINSKA', 'Splitsko-dalmatinska')
        .replace('OSJEČKO-BARANJSKA', 'Osječko-baranjska')
        .replace('VUKOVARSKO-SRIJEMSKA', 'Vukovarsko-srijemska')
        .replace('POŽEŠKO-SLAVONSKA', 'Požeško-slavonska')
        .replace('BRODSKO-POSAVSKA', 'Brodsko-posavska')
        .replace('VIROVITIČKO-PODRAVSKA', 'Virovitičko-podravska')
        .replace('KOPRIVNIČKO-KRIŽEVAČKA', 'Koprivničko-križevačka')
        .replace('BJELOVARSKO-BILOGORSKA', 'Bjelovarsko-bilogorska')
        .replace('PRIMORSKO-GORANSKA', 'Primorsko-goranska')
        .replace('SISAČKO-MOSLAVAČKA', 'Sisačko-moslavačka')
        .replace('KRAPINSKO-ZAGORSKA', 'Krapinsko-zagorska')
        .replace('ŠIBENSKO-KNINSKA', 'Šibensko-kninska')
        .replace('LIČKO-SENJSKA', 'Ličko-senjska')
        .replace('KARLOVAČKA', 'Karlovačka')
        .replace('VARAŽDINSKA', 'Varaždinska')
        .replace('ZAGREBAČKA', 'Zagrebačka')
        .replace('MEĐIMURSKA', 'Međimurska')
        .replace('ISTARSKA', 'Istarska')
        .replace('ZADARSKA', 'Zadarska')
        .replace('GRAD ZAGREB', 'Zagreb');

      return {
        cityName,
        county: record[1] as string,
        type: record[2] as string,
        displayName: `${cityName} (${formattedCounty})`,
        isSpecific: true
      };
    } else {
      const fallbackRecord = municipalityData.records.find(record => record[3] === cityName);
      if (fallbackRecord) {
        return {
          cityName,
          county: fallbackRecord[1] as string,
          type: fallbackRecord[2] as string,
          displayName: cityName,
          isSpecific: false
        };
      }
    }
  }
  
  return {
    cityName: urlParam,
    county: null,
    type: null,
    displayName: urlParam,
    isSpecific: false
  };
};

const formatCountyName = (county: string) => {
  return county
    .replace(/^[IVX]+\s/, '')
    .replace('DUBROVAČKO-NERETVANSKA', 'Dubrovačko-neretvanska')
    .replace('SPLITSKO-DALMATINSKA', 'Splitsko-dalmatinska')
    .replace('OSJEČKO-BARANJSKA', 'Osječko-baranjska')
    .replace('VUKOVARSKO-SRIJEMSKA', 'Vukovarsko-srijemska')
    .replace('POŽEŠKO-SLAVONSKA', 'Požeško-slavonska')
    .replace('BRODSKO-POSAVSKA', 'Brodsko-posavska')
    .replace('VIROVITIČKO-PODRAVSKA', 'Virovitičko-podravska')
    .replace('KOPRIVNIČKO-KRIŽEVAČKA', 'Koprivničko-križevačka')
    .replace('BJELOVARSKO-BILOGORSKA', 'Bjelovarsko-bilogorska')
    .replace('PRIMORSKO-GORANSKA', 'Primorsko-goranska')
    .replace('SISAČKO-MOSLAVAČKA', 'Sisačko-moslavačka')
    .replace('KRAPINSKO-ZAGORSKA', 'Krapinsko-zagorska')
    .replace('ŠIBENSKO-KNINSKA', 'Šibensko-kninska')
    .replace('LIČKO-SENJSKA', 'Ličko-senjska')
    .replace('KARLOVAČKA', 'Karlovačka')
    .replace('VARAŽDINSKA', 'Varaždinska')
    .replace('ZAGREBAČKA', 'Zagrebačka')
    .replace('MEĐIMURSKA', 'Međimurska')
    .replace('ISTARSKA', 'Istarska')
    .replace('ZADARSKA', 'Zadarska')
    .replace('GRAD ZAGREB', 'Zagreb');
};

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

// Interface definicije
interface YearRange {
  start: number;
  end: number;
  label: string;
}

interface FilterState {
  searchText: string;
  yearRange: YearRange | null;
  photoType: string;
  sortBy: string;
}

const Location = () => {
  const { t } = useLanguage();
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const { user, signInWithGoogle } = useAuth();

  // Parsiraj URL parametar
  const locationData = parseLocationFromUrl(decodedLocationName);
  const actualCityName = locationData.cityName;
  
  // Validacija
  const allLocations: string[] = municipalityData.records.map(record => record[3] as string);
  const isValidLocation = allLocations.includes(actualCityName);

  // Konstante
  const YEAR_RANGES: YearRange[] = [
    { start: 1900, end: 1920, label: "1900-1920" },
    { start: 1920, end: 1940, label: "1920-1940" },
    { start: 1940, end: 1960, label: "1940-1960" },
    { start: 1960, end: 1980, label: "1960-1980" },
    { start: 1980, end: 2000, label: "1980-2000" },
    { start: 2000, end: 2025, label: "2000-2025" }
  ];

  const PHOTO_TYPES = [
    { value: "all", label: t('photoType.allTypes') },
    { value: "street", label: t('photoType.street') },
    { value: "building", label: t('photoType.building') },
    { value: "people", label: t('photoType.people') },
    { value: "event", label: t('photoType.event') },
    { value: "nature", label: t('photoType.nature') }
  ];

  const SORT_OPTIONS = [
    { value: "newest", label: t('sort.newest'), icon: Clock },
    { value: "oldest", label: t('sort.oldest'), icon: Calendar },
    { value: "popular", label: t('sort.popular'), icon: TrendingUp },
    { value: "year_desc", label: t('sort.yearNewest'), icon: Calendar },
    { value: "year_asc", label: t('sort.yearOldest'), icon: Calendar }
  ];

  // State
  const [showAddForm, setShowAddForm] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]);
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PHOTOS_PER_PAGE = 12;

  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    yearRange: null,
    photoType: 'all',
    sortBy: 'newest'
  });

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
  toast.success(t('location.uploadSuccess'));
  
  try {
    const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
    setAllPhotos(locationPhotos);
  } catch (error) {
    console.error('Error refreshing photos:', error);
  }
};

  const clearFilters = () => {
    setFilters({
      searchText: '',
      yearRange: null,
      photoType: 'all',
      sortBy: 'newest'
    });
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
        const locationPhotos = await photoService.getPhotosByLocation(actualCityName);
        setAllPhotos(locationPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
        toast.error(t('errors.photoLoadFailed'));
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [actualCityName]);

  useEffect(() => {
    let filtered = [...allPhotos];

    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(photo => 
        photo.description.toLowerCase().includes(searchLower) ||
        photo.detailedDescription?.toLowerCase().includes(searchLower) ||
        photo.author.toLowerCase().includes(searchLower)
      );
    }

    if (filters.yearRange) {
      filtered = filtered.filter(photo => {
        const photoYear = parseInt(photo.year);
        return photoYear >= filters.yearRange!.start && photoYear <= filters.yearRange!.end;
      });
    }

    if (filters.photoType !== 'all') {
      filtered = filtered.filter(photo => 
        photo.photoType === filters.photoType || 
        photo.description.toLowerCase().includes(filters.photoType)
      );
    }

    switch (filters.sortBy) {
      case 'newest':
        filtered.sort((a, b) => new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime());
        break;
      case 'oldest':
        filtered.sort((a, b) => new Date(a.uploadedAt || '').getTime() - new Date(b.uploadedAt || '').getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'year_desc':
        filtered.sort((a, b) => parseInt(b.year) - parseInt(a.year));
        break;
      case 'year_asc':
        filtered.sort((a, b) => parseInt(a.year) - parseInt(b.year));
        break;
    }

    setFilteredPhotos(filtered);
    setCurrentPage(1);
    
    const firstPage = filtered.slice(0, PHOTOS_PER_PAGE);
    setDisplayedPhotos(firstPage);
    setHasMore(filtered.length > PHOTOS_PER_PAGE);
  }, [filters, allPhotos]);

  const hasActiveFilters = filters.searchText || filters.yearRange || filters.photoType !== 'all' || filters.sortBy !== 'newest';

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('location.loadingMemories')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
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
         <div className="mt-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
  <div className="flex-1 min-w-0">
    <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 break-words">
      {locationData.displayName}
    </h2>
    
    {/* Informacije o županiji i tipu */}
    {locationData.isSpecific && locationData.county && locationData.type && (
      <div className="mb-3">
        <div className="flex items-center gap-2 text-gray-300 flex-wrap">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="text-sm sm:text-base">{formatCountyName(locationData.county)}</span>
          <span className="text-gray-400">•</span>
          <span className="text-xs sm:text-sm font-medium bg-gray-700/50 px-2 py-1 rounded text-gray-200">
            {translateCityType(locationData.type, t)}
          </span>
        </div>
      </div>
    )}

    {!locationData.isSpecific && (
      <div className="mb-3">
        {(() => {
          const basicInfo = municipalityData.records.find(record => record[3] === actualCityName);
          if (basicInfo) {
            return (
              <div className="flex items-center gap-2 text-gray-300 flex-wrap">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm sm:text-base">{formatCountyName(basicInfo[1] as string)}</span>
                <span className="text-gray-400">•</span>
                <span className="text-xs sm:text-sm font-medium bg-gray-700/50 px-2 py-1 rounded text-gray-200">
                  {translateCityType(basicInfo[2] as string, t)}
                </span>
              </div>
            );
          }
          return null;
        })()}
      </div>
    )}

    <p className="text-sm sm:text-base text-gray-300 break-words">
  {t('location.exploreHistory')}
  {filteredPhotos.length !== allPhotos.length && (
    <span className="ml-2 text-blue-300">
      ({filteredPhotos.length} {t('common.of')} {allPhotos.length} {t('location.photos')})
    </span>
  )}
</p>
  </div>
  
  {/* NOVI KOD - Responsive buttons */}
  <div className="flex-shrink-0 w-full sm:w-auto">
    {user ? (
      <Button 
        onClick={() => setShowAddForm(true)}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
      >
        <Plus className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{t('location.addMemory')}</span>
      </Button>
    ) : (
      <Button 
        onClick={handleSignInToAddMemory}
        className="w-full sm:w-auto bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base px-3 sm:px-4 py-2"
      >
        <LogIn className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">{t('location.signInToAdd')}</span>
      </Button>
    )}
  </div>
</div>
        </div>
      </header>

      {/* Search and Filter Section */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder={t('location.searchPlaceholder')}
                  value={filters.searchText}
                  onChange={(e) => setFilters(prev => ({ ...prev, searchText: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {t('location.filters')} {hasActiveFilters && '●'}
            </Button>

            {hasActiveFilters && (
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
            <Card className="mt-4">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">{t('location.timePeriod')}</label>
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
                    <label className="block text-sm font-medium mb-2">{t('location.photoType')}</label>
                    <Select
                      value={filters.photoType}
                      onValueChange={(value) => setFilters(prev => ({ ...prev, photoType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
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
                    <label className="block text-sm font-medium mb-2">{t('location.sortBy')}</label>
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
      {hasActiveFilters && (
        <section className="py-4 px-4 bg-blue-50">
          <div className="container max-w-6xl mx-auto">
            <p className="text-blue-700">
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
            <div className="text-center py-12">
              <Tag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('location.noPhotosFound')}</h3>
              <p className="text-gray-600 mb-4">
                {hasActiveFilters 
                  ? t('location.tryAdjusting')
                  : t('location.beFirst')
                }
              </p>
              {hasActiveFilters && (
                <Button onClick={clearFilters} variant="outline">
                  {t('location.clearAllFilters')}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedPhotos.map((photo) => (
                  <Link 
                    key={photo.id} 
                    to={`/photo/${photo.id}`}
                    className="group relative overflow-hidden rounded-lg transition-all duration-300 hover:shadow-xl hover:-translate-y-1 block"
                  >
                    <div className="aspect-[4/3] overflow-hidden relative">
                      <LazyImage
                        src={photo.imageUrl}
                        alt={`${photo.location}, ${photo.year}`}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    </div>
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
                    className="bg-blue-600 hover:bg-blue-700"
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