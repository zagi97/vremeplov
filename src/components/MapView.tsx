import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, Filter, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import LazyImage from './LazyImage';
import { photoService, Photo } from '../services/firebaseService';
import { toast } from 'sonner';

import LanguageSelector from "../components/LanguageSelector";
import { useLanguage, translateWithParams } from '../contexts/LanguageContext';

// 🆕 Import TypeScript podataka o općinama
import { municipalityData } from '../../data/municipalities';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import Footer from './Footer';
import PageHeader from './PageHeader';
import { fixLeafletIcons, photoIcon, createClusterIcon, getRandomLocationCoordinates } from '@/utils/mapUtils';
import {
    clusterPhotos,
    filterPhotosWithCoordinates,
    PhotoWithCoordinates,
    ClusterGroup,
    ClusteredMarker
} from '@/utils/mapClustering';
import { MapFilters } from './map/MapFilters';

// Fix Leaflet icons on component mount
fixLeafletIcons();

// Dodaj novu komponentu koja će pratiti resize
const MapController = () => {
    const map = useMap();
    
    useEffect(() => {
        const handleResize = () => {
            const newMinZoom = window.innerWidth < 768 ? 6 : 7;
            const newZoom = window.innerWidth < 768 ? 6 : 7;
            
            map.setMinZoom(newMinZoom);
            
            // Ako je trenutni zoom manji od novog minZoom-a, postavi novi zoom
            if (map.getZoom() < newMinZoom) {
                map.setZoom(newZoom);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [map]);

    return null;
};


// Dodaj ovu komponentu prije MapView komponente

const MapViewSkeleton = () => {
  const { t } = useLanguage();
  
  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
      <PageHeader title="Vremeplov.hr" fixed={false} />

      {/* Hero section skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
        <div className="container max-w-5xl mx-auto px-4 text-center">
          <div className="h-9 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-3" />
          <div className="h-6 w-96 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-4">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
            <div className="h-5 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-10 flex-1 md:flex-initial md:max-w-xs bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse md:ml-auto" />
          </div>
        </div>
      </div>

      {/* Map skeleton */}
      <div className="container max-w-6xl mx-auto px-4 py-6 flex-1">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
          <div className="h-[50vh] md:h-[60vh] lg:h-[600px] bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">{t('mapView.loadingMemoryMap')}</p>
            </div>
          </div>
        </div>

        {/* Photo grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
              <div className="h-64 bg-gray-200 dark:bg-gray-700 animate-pulse" />
              <div className="p-5 space-y-3">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-3/4" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-2/3" />
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/2" />
                </div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-1/3" />
                <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded animate-pulse w-full" />
              </div>
            </div>
          ))}
        </div>

        {/* Statistics skeleton */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
              <div className="h-9 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto mb-2" />
              <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>

        {/* Info box skeleton */}
        <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="h-5 w-48 bg-blue-200 dark:bg-blue-800 rounded animate-pulse mb-2" />
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-4 bg-blue-200 dark:bg-blue-800 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};



const MapView: React.FC = () => {
    const { t } = useLanguage();

    // Helper to display year with translation for unknown
    const formatYear = (year: string) => {
      return year === 'unknown' ? t('upload.unknownYear') : year;
    };

    const [photos, setPhotos] = useState<PhotoWithCoordinates[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithCoordinates[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDecade, setSelectedDecade] = useState<string>('all');
    const [searchLocation, setSearchLocation] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([45.8150, 15.9819]); // 🆕 Default Zagreb
    const [displayedPhotosCount, setDisplayedPhotosCount] = useState(6);
const [loadingMore, setLoadingMore] = useState(false);


// 🆕 Dinamički zoom ovisno o širini ekrana
const getInitialZoom = () => {
  if (typeof window !== 'undefined') {
    return window.innerWidth < 768 ? 6 : 7; // 6 za mobitel, 7 za desktop
  }
  return 7; // Fallback
};

    const [mapZoom, setMapZoom] = useState(getInitialZoom());
    const [currentZoom, setCurrentZoom] = useState(getInitialZoom());

    const getMinZoom = () => {
  return typeof window !== 'undefined' && window.innerWidth < 768 ? 6 : 7;
};

const handleLoadMore = () => {
  setLoadingMore(true);
  
  // Simulate loading delay
  setTimeout(() => {
    setDisplayedPhotosCount(prev => prev + 6);
    setLoadingMore(false);
  }, 300);
};

useEffect(() => {
  setDisplayedPhotosCount(6);
}, [filteredPhotos.length]);

    // COMPONENT TO TRACK ZOOM CHANGES
    const ZoomTracker = () => {
        useMapEvents({
            zoomend: (e) => {
                setCurrentZoom(e.target.getZoom());
            }
        });
        return null;
    };

    // IMPROVED CLUSTERING LOGIC using extracted utility
    const clusteredData = useMemo(() => {
        return clusterPhotos(filteredPhotos, currentZoom);
    }, [filteredPhotos, currentZoom]);

    // Load photos with coordinates from Firebase
useEffect(() => {
    const loadPhotos = async () => {
        try {
            setLoading(true);
            const allPhotos = await photoService.getAllPhotos();
            const photosWithCoords = filterPhotosWithCoordinates(allPhotos);

            setPhotos(photosWithCoords);
            setFilteredPhotos(photosWithCoords);

            // ✅ Centar Hrvatske
            setMapCenter([44.5319, 16.7789]);
            
            // ✅ Dinamički zoom ovisno o screen size-u
            const zoom = window.innerWidth < 768 ? 6 : 7;
            setMapZoom(zoom);
            setCurrentZoom(zoom);

        } catch (error) {
            console.error('Error loading photos for map:', error);
            // ✅ FIX: Don't show error toast for empty database
            // Only show if it's a real error (not just empty state)
            // toast.error(t('errors.photoLoadFailed'));
        } finally {
            setLoading(false);
        }
    };

    loadPhotos();
}, []);

    // Filter photos by decade and location
    useEffect(() => {
        let filtered = photos;

        if (selectedDecade !== 'all') {
            const decade = parseInt(selectedDecade, 10);
            if (!isNaN(decade)) {
                filtered = filtered.filter(photo => {
                    const photoYear = parseInt(photo.year, 10);
                    if (isNaN(photoYear)) return false;
                    return photoYear >= decade && photoYear < decade + 10;
                });
            }
        }

        if (searchLocation.trim()) {
            filtered = filtered.filter(photo =>
                photo.location.toLowerCase().includes(searchLocation.toLowerCase()) ||
                (photo.address && photo.address.toLowerCase().includes(searchLocation.toLowerCase()))
            );
        }

        setFilteredPhotos(filtered);
    }, [photos, selectedDecade, searchLocation]);

    // Get unique decades for filter
    const getAvailableDecades = () => {
        const decades = new Set<number>();
        photos.forEach(photo => {
            const year = parseInt(photo.year);
            const decade = Math.floor(year / 10) * 10;
            decades.add(decade);
        });
        return Array.from(decades).sort();
    };

// NOVO - dodaj ovo:
if (loading) {
  return <MapViewSkeleton />;
}

    if (photos.length === 0) {
        return (
            <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
    {/* Header NIJE fixed */}
    <PageHeader title="Vremeplov.hr" fixed={false} />

    {/* Hero section - BEZ pt-28 jer header nije fixed */}
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
      <div className="container max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('mapView.memoryMap')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
          {t('mapView.exploreCroatian')}
        </p>
      </div>
    </div>

                <div className="container max-w-6xl mx-auto px-4 py-12 text-center flex-1">
                    <MapPin className="h-16 w-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">{t('mapView.noLocatedPhotos')}</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-6">{t('mapView.photosWillAppear')}</p>
                </div>
                <Footer />
            </div>
        );
    }

    return (
       <div className="min-h-screen bg-[#F8F9FA] dark:bg-gray-900 flex flex-col">
    {/* Header NIJE fixed */}
    <PageHeader title="Vremeplov.hr" fixed={false} />

    {/* Hero section - BEZ pt-28 jer header nije fixed */}
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 py-12">
      <div className="container max-w-5xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-3">
          {t('mapView.memoryMap')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-2xl mx-auto">
          {t('mapView.exploreCroatian')}
        </p>
      </div>
    </div>

          {/* Filters */}
          <MapFilters
            selectedDecade={selectedDecade}
            onDecadeChange={setSelectedDecade}
            searchLocation={searchLocation}
            onSearchChange={setSearchLocation}
            availableDecades={getAvailableDecades()}
            filteredCount={filteredPhotos.length}
            totalCount={photos.length}
          />

            {/* CUSTOM CLUSTERING MAPA */}
            <div className="container max-w-6xl mx-auto px-4 py-6 flex-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden mb-8">
                    <div className="h-[50vh] md:h-[60vh] lg:h-[600px] w-full">
                        <MapContainer
                            center={mapCenter}
                            zoom={mapZoom}
                            minZoom={getMinZoom()}         // ⬅️ Minimalni zoom (fiksno)
                            maxZoom={19}        // ⬅️ Maksimalni zoom
                            style={{ height: '100%', width: '100%' }}
                            className="rounded-xl"
                        >
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />

                            <ZoomTracker />
                            <MapController />

                            {clusteredData.map((item, index) => {
                                if (item.type === 'individual') {
                                    return (
                                        <Marker
                                            key={`individual-${item.photo.id}`}
                                            position={item.position}
                                            icon={photoIcon}
                                        >
                                            <Popup maxWidth={320} className="photo-popup">
                                                <div className="p-2">
                                                    <div className="aspect-[4/3] overflow-hidden rounded-md mb-3">
                                                        <LazyImage
                                                            src={item.photo.imageUrl}
                                                            alt={item.photo.description}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{item.photo.description}</h3>
                                                    <div className="space-y-1 text-sm text-gray-600 mb-3">
                                                        <div className="flex items-center gap-1">
                                                            <MapPin className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{item.photo.location}</span>
                                                        </div>
                                                        {item.photo.address && (
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3 flex-shrink-0 text-blue-500" />
                                                                <span className="truncate text-blue-600">{item.photo.address}</span>
                                                            </div>
                                                        )}
                                                        <div className="flex items-center gap-1">
                                                            <Calendar className="h-3 w-3 flex-shrink-0" />
                                                            <span>{formatYear(item.photo.year)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1">
                                                            <User className="h-3 w-3 flex-shrink-0" />
                                                            <span className="truncate">{item.photo.author}</span>
                                                        </div>
                                                    </div>
                                                    <Link to={`/photo/${item.photo.id}`}>
                                                        <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                                                            <ExternalLink className="h-3 w-3 mr-1" />
                                                            {t('mapView.viewDetails')}
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                } else {
                                    // Cluster marker
                                    return (
                                        <Marker
                                            key={`cluster-${index}`}
                                            position={item.position}
                                            icon={createClusterIcon(item.cluster.count)}
                                        >
                                            <Popup maxWidth={400} className="cluster-popup">
                                                <div className="p-3">
                                                    <h3 className="font-bold text-lg mb-3">
                                                        {translateWithParams(t, 'mapView.photosInArea', { count: item.cluster.count })}
                                                    </h3>
                                                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                                                        {item.cluster.photos.slice(0, 8).map((photo) => (
                                                            <Link
                                                                key={photo.id}
                                                                to={`/photo/${photo.id}`}
                                                                className="block hover:opacity-80 transition-opacity"
                                                            >
                                                                <div className="aspect-square overflow-hidden rounded mb-1">
                                                                    <LazyImage
                                                                        src={photo.imageUrl}
                                                                        alt={photo.description}
                                                                        className="w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                                <div className="text-xs">
                                                                    <div className="font-medium truncate">{photo.description}</div>
                                                                    <div className="text-gray-500">{formatYear(photo.year)}</div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {item.cluster.count > 8 && (
                                                        <div className="text-center mt-2 text-sm text-gray-500">
                                                            +{item.cluster.count - 8} more photos
                                                        </div>
                                                    )}
                                                </div>
                                            </Popup>
                                        </Marker>
                                    );
                                }
                            })}
                        </MapContainer>
                    </div>
                </div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {filteredPhotos.slice(0, displayedPhotosCount).map((photo) => (
    <div key={photo.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      {/* Fiksna visina slike */}
      <div className="h-64 overflow-hidden bg-gray-100 dark:bg-gray-700">
        <LazyImage
          src={photo.imageUrl}
          alt={photo.description}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      </div>

      {/* Content - više prostora */}
      <div className="p-5 space-y-3">
        <h3 className="font-bold text-lg line-clamp-2 min-h-[3.5rem] text-gray-900 dark:text-gray-100">
          {photo.description}
        </h3>

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{photo.location}</span>
          </div>

          {photo.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0 text-blue-500 dark:text-blue-400" />
              <span className="truncate text-blue-600 dark:text-blue-400 text-xs">{photo.address}</span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 flex-shrink-0" />
            <span>{formatYear(photo.year)}</span>
          </div>

          <div className="flex items-center gap-2">
            <User className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{photo.author}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-gray-700">
          <span>❤️ {photo.likes || 0}</span>
          <span>👁️ {photo.views || 0}</span>
        </div>

        <Link to={`/photo/${photo.id}`} className="block mt-3">
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            {t('mapView.viewDetails')}
          </Button>
        </Link>
      </div>
    </div>
  ))}
</div>

{/* ✅ LOAD MORE BUTTON */}
{displayedPhotosCount < filteredPhotos.length && (
  <div className="text-center mt-8">
    <Button
      onClick={handleLoadMore}
      disabled={loadingMore}
      className="bg-blue-600 hover:bg-blue-700 text-white px-8"
    >
      {loadingMore ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {t('common.loading')}
        </>
      ) : (
        <>
          📸 {t('mapView.loadMorePhotos')} ({filteredPhotos.length - displayedPhotosCount} {t('mapView.remaining')})
        </>
      )}
    </Button>
  </div>
)}

                {/* Statistics */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{photos.length}</div>
                        <div className="text-gray-600 dark:text-gray-300">{t('mapView.locatedPhotos')}</div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                        <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                            {new Set(photos.map(p => p.location)).size}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">{t('mapView.cities')}</div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                        <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                            {photos.filter(p => p.address).length}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">{t('mapView.specificAddresses')}</div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm text-center">
                        <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                            {getAvailableDecades().length}
                        </div>
                        <div className="text-gray-600 dark:text-gray-300">{t('mapView.differentDecades')}</div>
                    </div>
                </div>

                <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-2">{t('mapView.howClusteringWorks')}</h3>
                    <div className="text-blue-700 dark:text-blue-300 text-sm space-y-2">
                        <p>{t('mapView.clusteringDesc1')}</p>
                        <p>{t('mapView.clusteringDesc2')}</p>
                        <p>{t('mapView.clusteringDesc3')}</p>
                        <p>{t('mapView.clusteringDesc4')}</p>
                    </div>
                </div>
            </div>

            {/* Footer */}
      <Footer/>
        </div>
    );
};

export default MapView;