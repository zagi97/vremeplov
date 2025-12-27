// src/components/SimpleMiniMap.tsx
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L from 'leaflet';
import { toast } from 'sonner';

// Fix Leaflet default marker icon issue with bundlers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// ✅ GEO-FENCING HELPER
const isWithinBounds = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number = 5
): boolean => {
  const R = 6371;
  const dLat = (lat - centerLat) * Math.PI / 180;
  const dLng = (lng - centerLng) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(centerLat * Math.PI / 180) *
      Math.cos(lat * Math.PI / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};

export const SimpleMiniMap: React.FC<{
  center: { latitude: number; longitude: number };
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
  t: (key: string) => string;
}> = ({ center, onLocationSelect, t}) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;

        // ✅ GEO-FENCING CHECK
        if (!isWithinBounds(lat, lng, center.latitude, center.longitude, 15)) {
          toast.error(
            `❌ ${t('upload.markerOutsideBounds')}`,
            { duration: 4000 }
          );
          return;
        }

        setSelectedPosition([lat, lng]);
        onLocationSelect({ latitude: lat, longitude: lng });
        toast.success(`✅ ${t('upload.locationSelected')}`);
      },
    });
    return null;
  };

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={15}
      style={{ height: '250px', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />

      {/* ✅ PRIKAZ DOZVOLJENOG PODRUČJA (crveni krug) */}
      <Circle
        center={[center.latitude, center.longitude]}
        radius={15000} // 5km radius
        pathOptions={{
          color: 'red',
          fillColor: 'red',
          fillOpacity: 0.1,
          weight: 2,
          dashArray: '10, 10',
        }}
      />

      <MapClickHandler />

      {selectedPosition && <Marker position={selectedPosition} />}
    </MapContainer>
  );
};