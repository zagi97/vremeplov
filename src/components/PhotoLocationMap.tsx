import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from "../contexts/LanguageContext";

// Leaflet imports za mini mapu
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Custom ikone za mini mapu
const currentPhotoIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [20, 32],
  iconAnchor: [10, 32],
  popupAnchor: [0, -32],
  shadowSize: [32, 32],
  className: 'current-photo-marker'
});

const nearbyPhotoIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [15, 24],
  iconAnchor: [7, 24],
  popupAnchor: [0, -24],
  shadowSize: [24, 24],
  className: 'nearby-photo-marker'
});

interface PhotoLocationMapProps {
  photo: {
    id: string;
    description: string;
    location: string;
    coordinates?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  };
  nearbyPhotos?: Array<{
    id: string;
    description: string;
    imageUrl: string;
    year: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  }>;
}

const PhotoLocationMap: React.FC<PhotoLocationMapProps> = ({ photo, nearbyPhotos = [] }) => {
  const { t } = useLanguage();

  // DODAJ DETALJNI DEBUG
  console.log('=== PhotoLocationMap DEBUG ===');
  console.log('Received photo:', photo);
  console.log('Received nearbyPhotos:', nearbyPhotos);

   nearbyPhotos.forEach((nearby, index) => {
    console.log(`Nearby photo ${index}:`, {
      id: nearby.id,
      description: nearby.description,
      year: nearby.year,
      coordinates: nearby.coordinates,
      coordinatesType: typeof nearby.coordinates,
      hasLatitude: nearby.coordinates?.latitude,
      hasLongitude: nearby.coordinates?.longitude
    });
  });
  
  console.log('=== END PhotoLocationMap DEBUG ===');
  
  // Ako nema koordinat, koristi default Čačinci koordinate
  const coords = photo.coordinates || { latitude: 45.6236, longitude: 17.8403 };
  
  // ✅ ISPRAVLJENO: Prikaži SAMO fotografije koje stvarno imaju koordinate
  const nearbyPhotosWithCoords = nearbyPhotos.filter(p => p.coordinates);
  
  console.log('PhotoLocationMap Debug:');
  console.log('Current photo coords:', coords);
  console.log('Nearby photos:', nearbyPhotos.length);
  console.log('Nearby photos with coords:', nearbyPhotosWithCoords.length);
  console.log('Nearby photos with coords data:', nearbyPhotosWithCoords);
  
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium text-lg flex items-center gap-2">
          <MapPin className="h-5 w-5 text-blue-600" />
          {t('locationMap.photoLocation')}
        </h3>
        <Link to="/map">
          <Button variant="outline" size="sm" className="text-xs">
            <ExternalLink className="h-3 w-3 mr-1" />
            {t('locationMap.viewOnMap')}
          </Button>
        </Link>
      </div>

      {/* ✅ PRAVA LEAFLET MINI MAPA */}
      <div className="relative rounded-lg overflow-hidden h-48 mb-4">
        <MapContainer
          center={[coords.latitude, coords.longitude]}
          zoom={15} // Veći zoom za mini mapu
          style={{ height: '100%', width: '100%' }}
          zoomControl={false} // Ukloni zoom kontrole za mini mapu
          dragging={true}
          scrollWheelZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Current photo marker - crveni i veći */}
          <Marker
            position={[coords.latitude, coords.longitude]}
            icon={currentPhotoIcon}
          >
            <Popup>
              <div className="text-center">
                <strong>{photo.description}</strong>
                {photo.coordinates?.address && (
                  <div className="text-sm text-gray-600 mt-1">
                    {photo.coordinates.address}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>

          {/* ✅ ISPRAVLJENO: Prikaži SAMO nearby photos koje stvarno imaju koordinate */}
          {nearbyPhotosWithCoords.slice(0, 3).map((nearbyPhoto, index) => {
            console.log(`Rendering nearby photo ${index}:`, nearbyPhoto.description, nearbyPhoto.coordinates);
            return (
              <Marker
                key={nearbyPhoto.id}
                position={[
                  nearbyPhoto.coordinates!.latitude,
                  nearbyPhoto.coordinates!.longitude
                ]}
                icon={nearbyPhotoIcon}
              >
                <Popup>
                  <div className="text-center">
                    <div className="font-medium">{nearbyPhoto.description}</div>
                    <div className="text-sm text-gray-600">{nearbyPhoto.year}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      📍 {nearbyPhoto.coordinates!.latitude.toFixed(4)}, {nearbyPhoto.coordinates!.longitude.toFixed(4)}
                    </div>
                    <Link 
                      to={`/photo/${nearbyPhoto.id}`}
                      className="text-blue-600 hover:underline text-xs block mt-1"
                    >
                      {t('locationMap.viewPhoto')}
                    </Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Coordinates display overlay */}
        <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-xs text-gray-600 shadow">
          📍 {coords.latitude.toFixed(4)}, {coords.longitude.toFixed(4)}
        </div>
      </div>

      {/* Location details */}
      <div className="space-y-2">
        <div className="text-sm">
          <span className="font-medium text-gray-700">{t('locationMap.location')}:</span>
          <span className="ml-2 text-gray-600">{photo.location}</span>
        </div>
        
        {photo.coordinates?.address && (
          <div className="text-sm">
            <span className="font-medium text-gray-700">{t('locationMap.address')}:</span>
            <span className="ml-2 text-gray-600">{photo.coordinates.address}</span>
          </div>
        )}

        {/* ✅ ISPRAVLJENO: Prikaži samo fotografije s koordinatama */}
        {nearbyPhotosWithCoords.length > 0 && (
          <div className="mt-3">
            <span className="font-medium text-gray-700 text-sm">
              {t('locationMap.nearbyPhotos')} ({nearbyPhotosWithCoords.length}):
            </span>
            <div className="mt-2 space-y-1">
              {nearbyPhotosWithCoords.slice(0, 3).map((nearbyPhoto, index) => (
                <Link 
                  key={nearbyPhoto.id}
                  to={`/photo/${nearbyPhoto.id}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <span className="w-4 h-4 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px]">
                    {index + 1}
                  </span>
                  <span className="truncate">{nearbyPhoto.description}</span>
                  <span className="text-gray-400">({nearbyPhoto.year})</span>
                  <span className="text-gray-400 text-[10px]">
                    📍 {nearbyPhoto.coordinates!.latitude.toFixed(3)}, {nearbyPhoto.coordinates!.longitude.toFixed(3)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ✅ NOVO: Debug informacije */}
        {nearbyPhotosWithCoords.length === 0 && nearbyPhotos.length > 0 && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <span className="font-medium text-yellow-800">ℹ️ Debug:</span>
            <span className="text-yellow-700 ml-1">
              {nearbyPhotos.length} nearby photos found, but {nearbyPhotosWithCoords.length} have coordinates
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoLocationMap;