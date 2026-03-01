import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import LazyImage from './LazyImage';
import { photoService } from '../services/firebaseService';

import { useLanguage, translateWithParams } from '../contexts/LanguageContext';
import { formatYear } from '@/utils/dateUtils';
import SEO from './SEO';

// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Footer from './Footer';
import PageHeader from './PageHeader';
import { fixLeafletIcons, photoIcon, createClusterIcon } from '@/utils/mapUtils';
import {
    clusterPhotos,
    filterPhotosWithCoordinates,
    PhotoWithCoordinates,
} from '@/utils/mapClustering';
import { MapFilters } from './map/MapFilters';
import MapViewSkeleton from './map/MapViewSkeleton';
import MapPhotoGrid from './map/MapPhotoGrid';
import MapStatistics from './map/MapStatistics';

// Fix Leaflet icons on component mount
fixLeafletIcons();

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



const MapView: React.FC = () => {
    const { t } = useLanguage();

    const [photos, setPhotos] = useState<PhotoWithCoordinates[]>([]);
    const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithCoordinates[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDecade, setSelectedDecade] = useState<string>('all');
    const [searchLocation, setSearchLocation] = useState('');
    const [mapCenter, setMapCenter] = useState<[number, number]>([45.8150, 15.9819]);


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

    // Get unique decades for filter - memoized to avoid recalculation on every render
    const availableDecades = useMemo(() => {
        const decades = new Set<number>();
        photos.forEach(photo => {
            const year = parseInt(photo.year);
            if (!isNaN(year)) {
                const decade = Math.floor(year / 10) * 10;
                decades.add(decade);
            }
        });
        return Array.from(decades).sort();
    }, [photos]);

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
    {/* SEO meta tags */}
    <SEO
      title={t('mapView.memoryMap')}
      description={t('mapView.exploreCroatian')}
      url="/map"
    />
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
            availableDecades={availableDecades}
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
                                                            <span>{formatYear(item.photo.year, t)}</span>
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
                                                                    <div className="text-gray-500">{formatYear(photo.year, t)}</div>
                                                                </div>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    {item.cluster.count > 8 && item.cluster.photos[0]?.location && (
                                                        <Link
                                                            to={`/location/${encodeURIComponent(item.cluster.photos[0].location)}`}
                                                            className="block text-center mt-2 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                                                        >
                                                            {translateWithParams(t, 'mapView.viewAllPhotos', { count: item.cluster.count })}
                                                        </Link>
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

<MapPhotoGrid photos={filteredPhotos} t={t} />

                <MapStatistics photos={photos} availableDecades={availableDecades} t={t} />
            </div>

            {/* Footer */}
      <Footer/>
        </div>
    );
};

export default MapView;