/**
 * Location Confirmation Component
 *
 * Displays confirmed location with a preview map and option to change.
 */

import React from 'react';
import { MapPin } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { toast } from 'sonner';
import { Button } from '../ui/button';
import { translateWithParams, TranslationFunction } from '@/contexts/LanguageContext';

interface LocationConfirmationProps {
  coordinates: { latitude: number; longitude: number };
  selectedAddress: string;
  streetName?: string;
  houseNumber?: string;
  onChangeLocation: () => void;
  onReset: () => void;
  t: TranslationFunction;
}

export const LocationConfirmation: React.FC<LocationConfirmationProps> = ({
  coordinates,
  selectedAddress,
  streetName,
  houseNumber,
  onChangeLocation,
  onReset,
  t,
}) => {
  const handleChangeClick = () => {
    // Check if we have data for manual positioning
    if (streetName && houseNumber) {
      // Return to manual positioning mode
      onChangeLocation();
      toast.info(
        translateWithParams(t, 'upload.selectNewLocation', {
          street: streetName,
          number: houseNumber,
        })
      );
    } else {
      // No data, completely reset
      onReset();
      toast.info(t('upload.canSearchAgain'));
    }
  };

  return (
    <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-1 bg-green-600 text-white rounded">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-green-800 mb-1">
            ✅{' '}
            {translateWithParams(t, 'upload.locationSetTitle', { address: selectedAddress })}
          </h4>
          <p className="text-sm text-green-700">
            {t('upload.coordinates')}: {coordinates.latitude.toFixed(4)},{' '}
            {coordinates.longitude.toFixed(4)}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleChangeClick}
          className="text-blue-600 hover:text-blue-800 font-semibold underline hover:no-underline transition-all"
        >
          {t('upload.changeLocation')}
        </Button>
      </div>

      {/* MINI MAP DISPLAY WITH SELECTED LOCATION */}
      <div className="rounded-lg overflow-hidden border border-green-300 h-48">
        <MapContainer
          center={[coordinates.latitude, coordinates.longitude]}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
          zoomControl={false}
          dragging={false}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap"
          />
          <Marker position={[coordinates.latitude, coordinates.longitude]} />
        </MapContainer>
      </div>

      <div className="mt-2 text-xs text-green-600">
        📍 {t('upload.selectedPhotoLocation')}
      </div>
    </div>
  );
};
