// JEDNOSTAVAN MINI MAP COMPONENT koristeći tvoje postojeće Leaflet komponente
import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';

export const SimpleMiniMap: React.FC<{
  center: {latitude: number, longitude: number};
  onLocationSelect: (coords: {latitude: number, longitude: number}) => void;
}> = ({ center, onLocationSelect }) => {
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);

  const MapClickHandler = () => {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng;
        setSelectedPosition([lat, lng]);
        onLocationSelect({ latitude: lat, longitude: lng });
        console.log('User clicked on map:', lat, lng);
      }
    });
    return null;
  };

  return (
    <MapContainer
      center={[center.latitude, center.longitude]}
      zoom={16}
      style={{ height: '200px', width: '100%' }}
      className="rounded-lg"
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      <MapClickHandler />
      {selectedPosition && (
        <Marker position={selectedPosition} />
      )}
    </MapContainer>
  );
};