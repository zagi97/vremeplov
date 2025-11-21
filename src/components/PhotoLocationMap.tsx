import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { useLanguage } from "../contexts/LanguageContext";

// Leaflet imports za mini mapu
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Import JSON podataka o općinama
import municipalityData from '../../data/municipalities.json';

// --- Funkcija za dohvat koordinata ---
const findCoordinatesByLocation = (locationName: string) => {
    // Pronađi SVE zapise s tim nazivom (jer mogu biti duplikati)
    const records = municipalityData.records.filter(record => record[3] === locationName);
    
    if (records.length === 0) {
        return null; // Nema grada s tim nazivom
    }
    
    // Ako ima više zapisa (duplikati), uzmi prvi koji ima koordinate
    for (const record of records) {
        if (typeof record[4] === 'number' && typeof record[5] === 'number') {
            return {
                latitude: record[4],
                longitude: record[5]
            };
        }
    }
    
    return null; // Nijedan zapis nema koordinate
};

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

    // 🆕 IZMJENJENA LOGIKA ZA KOORDINATE:
    // 1. Provjeri ima li fotka koordinate
    // 2. Ako ne, pronađi koordinate općine/grada
    // 3. Ako ni to ne uspije, vrati se na default Čačinci koordinate
    const defaultLocationCoords = findCoordinatesByLocation(photo.location);
    const coords = photo.coordinates || defaultLocationCoords || { latitude: 45.6236, longitude: 17.8403 };

    const nearbyPhotosWithCoords = nearbyPhotos.filter(p => p.coordinates);

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

            {/* PRAVA LEAFLET MINI MAPA */}
            <div className="relative rounded-lg overflow-hidden h-48 mb-4">
                <MapContainer
                    center={[coords.latitude, coords.longitude]}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                    zoomControl={false}
                    dragging={true}
                    scrollWheelZoom={false}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Current photo marker */}
                    <Marker
                        position={[coords.latitude, coords.longitude]}
                        icon={currentPhotoIcon}
                    >
                    </Marker>

                    {/* Nearby photos markers */}
                    {nearbyPhotosWithCoords.slice(0, 3).map((nearbyPhoto) => (
                        <Marker
                            key={nearbyPhoto.id}
                            position={[
                                nearbyPhoto.coordinates!.latitude,
                                nearbyPhoto.coordinates!.longitude
                            ]}
                            icon={nearbyPhotoIcon}
                        >
                            
                        </Marker>
                    ))}
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
            </div>
        </div>
    );
};

export default PhotoLocationMap;