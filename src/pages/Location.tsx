// In your Location.tsx, add this import at the top:
import LazyImage from "../components/LazyImage";
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

import municipalityData from '../../data/municipalities.json';

// DODAJ NA VRHU Location.tsx:
import LanguageSelector from "../components/LanguageSelector";
import { useLanguage } from "../contexts/LanguageContext";

// Filter interfaces
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

const allLocations: string[] = municipalityData.records.map(record => record[3] as string);

const Location = () => {
  // ✅ PREMJESTI useLanguage HOOK UNUTAR KOMPONENTE
  const { t } = useLanguage();
  const { locationName } = useParams<{ locationName: string }>();
  const decodedLocationName = locationName ? decodeURIComponent(locationName) : '';
  const { user, signInWithGoogle } = useAuth();

  // ✅ PREVEDENE KONSTANTE - sada koriste t() funkciju
  const YEAR_RANGES: YearRange[] = [
    { start: 1900, end: 1920, label: "1900-1920" },
    { start: 1920, end: 1940, label: "1920-1940" },
    { start: 1940, end: 1960, label: "1940-1960" },
    { start: 1960, end: 1980, label: "1960-1980" },
    { start: 1980, end: 2000, label: "1980-2000" },
    { start: 2000, end: 2025, label: "2000-2025" }
  ];

  // ✅ PREVEDENI PHOTO TYPES
  const PHOTO_TYPES = [
    { value: "all", label: t('photoType.allTypes') },
    { value: "street", label: t('photoType.street') },
    { value: "building", label: t('photoType.building') },
    { value: "people", label: t('photoType.people') },
    { value: "event", label: t('photoType.event') },
    { value: "nature", label: t('photoType.nature') }
  ];

  // ✅ PREVEDENE SORT OPTIONS
  const SORT_OPTIONS = [
    { value: "newest", label: t('sort.newest'), icon: Clock },
    { value: "oldest", label: t('sort.oldest'), icon: Calendar },
    { value: "popular", label: t('sort.popular'), icon: TrendingUp },
    { value: "year_desc", label: t('sort.yearNewest'), icon: Calendar },
    { value: "year_asc", label: t('sort.yearOldest'), icon: Calendar }
  ];

  // Validacija
    const isValidLocation = allLocations.includes(decodedLocationName);

  // Validate if the location is in our allowed list
  //const isValidLocation = VALID_LOCATIONS.includes(decodedLocationName);
  //const isAllowedLocation = decodedLocationName === "Čačinci";

  const [showAddForm, setShowAddForm] = useState(false);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]); // Store all photos
  const [filteredPhotos, setFilteredPhotos] = useState<Photo[]>([]); // Store filtered photos
  const [displayedPhotos, setDisplayedPhotos] = useState<Photo[]>([]); // Store paginated photos
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const PHOTOS_PER_PAGE = 12;

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    searchText: '',
    yearRange: null,
    photoType: 'all',
    sortBy: 'newest'
  });

  // Redirect to 404 if location is not valid or not allowed
/*   if (!isValidLocation || !isAllowedLocation) {
    return <Navigate to="/not-found" replace />;
  } */

    // Sada provjera treba biti samo:
    if (!isValidLocation) {
        return <Navigate to="/not-found" replace />;
    }

  // Handle sign in to add memory
  const handleSignInToAddMemory = async () => {
    try {
      await signInWithGoogle();
      toast.success(t('auth.signInSuccess'));
    } catch (error) {
      toast.error('Failed to sign in. Please try again.');
    }
  };

  // Load all photos for this location
  useEffect(() => {
    const loadPhotos = async () => {
      if (!decodedLocationName) return;
      
      try {
        setLoading(true);
        const locationPhotos = await photoService.getPhotosByLocation(decodedLocationName);
        setAllPhotos(locationPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
        toast.error('Failed to load photos');
      } finally {
        setLoading(false);
      }
    };

    loadPhotos();
  }, [decodedLocationName]);

  // Apply filters whenever filters or allPhotos change
  useEffect(() => {
    let filtered = [...allPhotos];

    // Apply search text filter
    if (filters.searchText.trim()) {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(photo => 
        photo.description.toLowerCase().includes(searchLower) ||
        photo.detailedDescription?.toLowerCase().includes(searchLower) ||
        photo.author.toLowerCase().includes(searchLower)
      );
    }

    // Apply year range filter
    if (filters.yearRange) {
      filtered = filtered.filter(photo => {
        const photoYear = parseInt(photo.year);
        return photoYear >= filters.yearRange!.start && photoYear <= filters.yearRange!.end;
      });
    }

// Apply photo type filter - ažuriraj ovo u Location.tsx
if (filters.photoType !== 'all') {
  filtered = filtered.filter(photo => 
    photo.photoType === filters.photoType || // Dodaj ovo - direktna provjera
    photo.description.toLowerCase().includes(filters.photoType)
  );
}

    // Apply sorting
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
    
    // Reset displayed photos with first page
    const firstPage = filtered.slice(0, PHOTOS_PER_PAGE);
    setDisplayedPhotos(firstPage);
    setHasMore(filtered.length > PHOTOS_PER_PAGE);
  }, [filters, allPhotos]);

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

  const handleUploadSuccess = async () => {
    setShowAddForm(false);
    toast.success('Photo uploaded successfully! It will appear after admin review.');
    
    // Refresh the photos list
    try {
      const locationPhotos = await photoService.getPhotosByLocation(decodedLocationName);
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
      {/* 🆕 DODAJ LANGUAGE SELECTOR OVDJE */}
      <div className="flex items-center gap-4">
        <LanguageSelector />
      </div>
    </div>
    <div className="mt-6 flex justify-between items-end">
      <div>
        <h2 className="text-3xl md:text-4xl font-bold mb-2">{decodedLocationName}</h2>
        <p className="text-gray-300">
          {t('location.exploreHistory')} {decodedLocationName} {t('location.throughPhotos')}
          {filteredPhotos.length !== allPhotos.length && (
            <span className="ml-2 text-blue-300">
              ({filteredPhotos.length} {t('common.of')} {allPhotos.length} {t('location.photos')})
            </span>
          )}
        </p>
      </div>
      
      {/* Conditional Add Memory Button */}
      {user ? (
        <Button 
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          {t('location.addMemory')}
        </Button>
      ) : (
        <Button 
          onClick={handleSignInToAddMemory}
          className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-gray-900 transition-colors flex items-center gap-2"
        >
          <LogIn className="h-4 w-4" />
          {t('location.signInToAdd')}
        </Button>
      )}
    </div>
  </div>
</header>

      {/* Search and Filter Section */}
      <section className="py-6 px-4 bg-white border-b">
        <div className="container max-w-6xl mx-auto">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Bar */}
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

            {/* Filter Toggle */}
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 ${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}
            >
              <Filter className="h-4 w-4" />
              {t('location.filters')} {hasActiveFilters && '●'}
            </Button>

            {/* Clear Filters */}
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

          {/* Advanced Filters */}
{showFilters && (
  <Card className="mt-4">
    <CardContent className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Year Range Filter */}
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

        {/* Photo Type Filter */}
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

        {/* Sort By */}
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
    {t('upload.addPhotoTo')} {decodedLocationName}
  </DialogTitle>
</DialogHeader>
          <PhotoUpload 
            locationName={decodedLocationName}
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
        {/* ✅ Updated PhotoGrid with Lazy Loading */}
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

export default Location;