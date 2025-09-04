import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Calendar, User, Filter, ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import LazyImage from './LazyImage';
import { photoService, Photo } from '../services/firebaseService';
import { toast } from 'sonner';

import LanguageSelector from "../components/LanguageSelector";

// Add these imports at the top of MapView.tsx:
import { useLanguage, translateWithParams } from '../contexts/LanguageContext';



// Leaflet imports
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix za Leaflet ikone u React-u
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom ikona za fotografije
const photoIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// ✅ CUSTOM CLUSTER ICON
const createClusterIcon = (count: number): L.DivIcon => {
  let className = 'cluster-small';
  let size = 35;
  
  if (count < 10) {
    className = 'cluster-small';
    size = 35;
  } else if (count < 100) {
    className = 'cluster-medium'; 
    size = 40;
  } else {
    className = 'cluster-large';
    size = 45;
  }
  
  return new L.DivIcon({
    html: `<div class="cluster-inner"><span>${count}</span></div>`,
    className: `photo-cluster ${className}`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2]
  });
};

interface PhotoWithCoordinates extends Photo {
  latitude: number;
  longitude: number;
  address?: string;
}

interface ClusterGroup {
  center: [number, number];
  photos: PhotoWithCoordinates[];
  count: number;
}

const MapView: React.FC = () => {
  // Add this hook inside the component:
const { t } = useLanguage();
  const [photos, setPhotos] = useState<PhotoWithCoordinates[]>([]);
  const [filteredPhotos, setFilteredPhotos] = useState<PhotoWithCoordinates[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [searchLocation, setSearchLocation] = useState('');
  const [mapCenter, setMapCenter] = useState<[number, number]>([45.8150, 15.9819]);
  const [mapZoom, setMapZoom] = useState(8);
  const [currentZoom, setCurrentZoom] = useState(8);

  // ✅ COMPONENT TO TRACK ZOOM CHANGES
  const ZoomTracker = () => {
    useMapEvents({
      zoomend: (e) => {
        setCurrentZoom(e.target.getZoom());
      }
    });
    return null;
  };

  // ✅ IMPROVED CLUSTERING LOGIC
  const clusteredData = useMemo(() => {
    console.log('Calculating clusters for zoom level:', currentZoom);
    console.log('Filtered photos count:', filteredPhotos.length);
    
    if (filteredPhotos.length === 0) {
      return [];
    }
    
    if (currentZoom >= 19) {
      // Na vrlo visokom zoom-u, prikaži sve individual markere
      console.log('Very high zoom - showing all individual markers');
      return filteredPhotos.map(photo => ({
        type: 'individual' as const,
        photo,
        position: [photo.latitude, photo.longitude] as [number, number]
      }));
    }

    // Grupiranje fotografija po blizini
    const clusters: ClusterGroup[] = [];
    const processed = new Set<string>();
    
    // Dinamički radius ovisno o zoom levelu - manji radijusi
    let clusterRadius: number;
    if (currentZoom >= 15) {
      clusterRadius = 0.0001; // Vrlo mali radius na visokom zoom-u (~10m)
    } else if (currentZoom >= 13) {
      clusterRadius = 0.0005; // Mali radius (~50m)
    } else if (currentZoom >= 11) {
      clusterRadius = 0.002; // Srednji radius (~200m)
    } else {
      clusterRadius = 0.01; // Veliki radius na niskom zoom-u (~1km)
    }
    
    console.log('Using cluster radius:', clusterRadius);

    filteredPhotos.forEach((photo) => {
      if (processed.has(photo.id!)) return;

      const cluster: ClusterGroup = {
        center: [photo.latitude, photo.longitude],
        photos: [photo],
        count: 1
      };

      // Pronađi obližnje fotografije
      filteredPhotos.forEach((otherPhoto) => {
        if (processed.has(otherPhoto.id!) || photo.id === otherPhoto.id) return;

        const distance = Math.sqrt(
          Math.pow(photo.latitude - otherPhoto.latitude, 2) +
          Math.pow(photo.longitude - otherPhoto.longitude, 2)
        );

        console.log(`Distance between ${photo.description} and ${otherPhoto.description}:`, distance, 'threshold:', clusterRadius);

        if (distance < clusterRadius) {
          cluster.photos.push(otherPhoto);
          cluster.count++;
          processed.add(otherPhoto.id!);
          console.log(`Added ${otherPhoto.description} to cluster`);
        }
      });

      processed.add(photo.id!);
      clusters.push(cluster);
    });

    console.log('Created clusters:', clusters.map(c => ({ count: c.count, photos: c.photos.map(p => p.description) })));

    return clusters.map((cluster) => {
      if (cluster.count === 1) {
        return {
          type: 'individual' as const,
          photo: cluster.photos[0],
          position: cluster.center
        };
      } else {
        return {
          type: 'cluster' as const,
          cluster,
          position: cluster.center
        };
      }
    });
  }, [filteredPhotos, currentZoom]);

  // Load photos with coordinates from Firebase
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        setLoading(true);
        console.log('Loading photos with coordinates...');
        
        const allPhotos = await photoService.getAllPhotos();
        console.log(`Loaded ${allPhotos.length} total photos`);
        
        const photosWithCoords: PhotoWithCoordinates[] = allPhotos
          .filter(photo => photo.coordinates?.latitude && photo.coordinates?.longitude)
          .map(photo => ({
            ...photo,
            latitude: photo.coordinates!.latitude,
            longitude: photo.coordinates!.longitude,
            address: photo.coordinates?.address
          }));

        console.log(`Found ${photosWithCoords.length} photos with coordinates`);
        setPhotos(photosWithCoords);
        setFilteredPhotos(photosWithCoords);

        if (photosWithCoords.length > 0) {
          const firstPhoto = photosWithCoords[0];
          setMapCenter([firstPhoto.latitude, firstPhoto.longitude]);
          setMapZoom(10);
          setCurrentZoom(10);
        }

      } catch (error) {
        console.error('Error loading photos for map:', error);
        toast.error('Failed to load photos');
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
      const decade = parseInt(selectedDecade);
      filtered = filtered.filter(photo => {
        const photoYear = parseInt(photo.year);
        return photoYear >= decade && photoYear < decade + 10;
      });
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
<h2 className="text-3xl md:text-4xl font-bold mb-2"></h2>
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>

<p className="text-gray-600">{t('mapView.loadingMemoryMap')}</p>
        </div>
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8F9FA]">
        <header className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-6">
          <div className="container max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Link to="/">
                  <Button variant="ghost" className="text-white hover:bg-white/10 p-2">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
              </div>
              <LanguageSelector />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('mapView.memoryMap')}</h2>
            <p className="text-gray-300">{t('mapView.noPhotos')}</p>
          </div>
        </header>

        <div className="container max-w-6xl mx-auto px-4 py-12 text-center">
          <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />

<h3 className="text-2xl font-bold text-gray-800 mb-4">{t('mapView.noLocatedPhotos')}</h3>
<p className="text-gray-600 mb-6">{t('mapView.photosWillAppear')}</p>
          <Link to="/location/Čačinci">
<Button className="bg-blue-600 hover:bg-blue-700">
  {translateWithParams(t, 'mapView.addPhotosTo', { location: 'Čačinci' })}
</Button>
          </Link>
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
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" className="text-white hover:bg-white/10 p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold">Vremeplov.hr</h1>
            </div>
            <div className="flex items-center gap-4">
              <LanguageSelector />
            </div>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-2">{t('mapView.memoryMap')}</h2>
          <p className="text-gray-300">{t('mapView.exploreCroatian')}</p>
        </div>
      </header>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 py-4">
        <div className="container max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-gray-600" />
             <span className="font-medium">{t('mapView.filters')}</span>
            </div>
            
            <select
              value={selectedDecade}
              onChange={(e) => setSelectedDecade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">{t('mapView.allDecades')}</option>
              {getAvailableDecades().map(decade => (
                <option key={decade} value={decade.toString()}>
                  {decade}s ({decade}-{decade + 9})
                </option>
              ))}
            </select>

            <Input
              type="text"
              placeholder={t('mapView.searchByLocation')}
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="max-w-xs"
            />

         <div className="text-sm text-gray-600">
  {translateWithParams(t, 'mapView.showing', { filtered: filteredPhotos.length, total: photos.length })}
</div>
          </div>
        </div>
      </div>

      {/* ✅ CUSTOM CLUSTERING MAPA */}
      <div className="container max-w-6xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div style={{ height: '600px', width: '100%' }}>
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="rounded-xl"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* ✅ ZOOM TRACKER COMPONENT */}
              <ZoomTracker />
              
              {/* ✅ RENDER CLUSTERS AND INDIVIDUAL MARKERS */}
              {clusteredData.map((item, index) => {
                console.log('Rendering item:', item.type, item.type === 'cluster' ? `cluster with ${item.cluster.count} photos` : `individual photo: ${item.photo.description}`);
                
                if (item.type === 'individual') {
                  return (
                    <Marker
                      key={`individual-${item.photo.id}`}
                      position={item.position}
                      icon={photoIcon}
                    >
                      <Popup maxWidth={320} className="photo-popup">
                        <div className="p-3">
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
                              <span>{item.photo.year}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <User className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{item.photo.author}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                            <span>❤️ {item.photo.likes || 0}</span>
                            <span>👁️ {item.photo.views || 0}</span>
                          </div>
                          
                          <Link to={`/photo/${item.photo.id}`}>
                            <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
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
                                  <div className="text-gray-500">{photo.year}</div>
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

        {/* Photo Grid Preview */}
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">{t('mapView.photosOnMap')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPhotos.slice(0, 6).map((photo) => (
              <div key={photo.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-[4/3] overflow-hidden">
                  <LazyImage
                    src={photo.imageUrl}
                    alt={photo.description}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{photo.description}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 flex-shrink-0" />
                      <span className="truncate">{photo.location}</span>
                    </div>
                    {photo.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 flex-shrink-0 text-blue-500" />
                        <span className="truncate text-blue-600 text-xs">{photo.address}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        <span>{photo.year}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span className="truncate">{photo.author}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>❤️ {photo.likes || 0}</span>
                      <span>👁️ {photo.views || 0}</span>
                    </div>
                  </div>
                  <Link to={`/photo/${photo.id}`}>
                    <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700">
  {t('mapView.viewDetails')}
</Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">{photos.length}</div>
            <div className="text-gray-600">{t('mapView.locatedPhotos')}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {new Set(photos.map(p => p.location)).size}
            </div>
            <div className="text-gray-600">{t('mapView.cities')}</div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {photos.filter(p => p.address).length}
            </div>
            <div className="text-gray-600">{t('mapView.specificAddresses')}</div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {getAvailableDecades().length}
            </div>
            <div className="text-gray-600">{t('mapView.differentDecades')}</div>
          </div>
        </div>

        {/* Debug information */}
        <div className="mt-4 bg-gray-100 rounded-lg p-4 text-sm">
          <h4 className="font-bold mb-2">{t('mapView.debugInfo')}</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
             <span className="font-medium">{t('mapView.totalPhotos')}</span> {photos.length}
            </div>
            <div>
             <span className="font-medium">{t('mapView.filtered')}</span> {filteredPhotos.length}
            </div>
            <div>
              <span className="font-medium">{t('mapView.currentZoom')}</span> {currentZoom}
            </div>
            <div>
              <span className="font-medium">{t('mapView.clusters')}</span> {clusteredData.filter(item => item.type === 'cluster').length}
            </div>
          </div>
          <div className="mt-2">
           <span className="font-medium">{t('mapView.individualMarkers')}</span> {clusteredData.filter(item => item.type === 'individual').length}
          </div>
        </div>
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-800 mb-2">{t('mapView.howClusteringWorks')}</h3>
<div className="text-blue-700 text-sm space-y-2">
  <p>{t('mapView.clusteringDesc1')}</p>
  <p>{t('mapView.clusteringDesc2')}</p>
  <p>{t('mapView.clusteringDesc3')}</p>
  <p>{t('mapView.clusteringDesc4')}</p>
</div>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-10 px-4 bg-gradient-to-r from-gray-900 to-gray-800 text-gray-400 mt-12">
              <div className="container max-w-6xl mx-auto">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-6 md:mb-0">
                    <h2 className="text-2xl font-bold text-white">Vremeplov.hr</h2>
                    <p className="mt-2">{t('footer.tagline')}</p>
                  </div>
                  <div className="flex space-x-6">
                    {/* In your Location.tsx footer (around line 522-525) */}
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

export default MapView;