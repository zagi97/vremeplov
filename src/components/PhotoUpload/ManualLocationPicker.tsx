/**
 * Manual Location Picker Component
 *
 * Displayed when address search finds a street but not the exact house number.
 * Allows user to manually select location on a map.
 */

import React from 'react';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { SimpleMiniMap } from '../SimpleMiniMap';
import { translateWithParams, TranslationFunction } from '@/contexts/LanguageContext';

interface ManualLocationPickerProps {
  streetOnlyCoordinates: { latitude: number; longitude: number };
  streetName: string;
  houseNumber: string;
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
  t: TranslationFunction;
}

export const ManualLocationPicker: React.FC<ManualLocationPickerProps> = ({
  streetOnlyCoordinates,
  streetName,
  houseNumber,
  onLocationSelect,
  t,
}) => {
  const handleLocationSelect = (coords: { latitude: number; longitude: number }) => {
    onLocationSelect(coords);
    toast.success(
      translateWithParams(t, 'upload.locationSet', {
        street: streetName,
        number: houseNumber,
      })
    );
  };

  return (
    <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-start gap-3 mb-3">
        <div className="p-1 bg-blue-600 text-white rounded">
          <MapPin className="h-4 w-4" />
        </div>
        <div className="flex-1">
          <h4 className="font-medium text-blue-800 mb-1">
            📍{' '}
            {translateWithParams(t, 'upload.streetFound', {
              street: streetName,
              number: houseNumber,
            })}
          </h4>
          <p className="text-sm text-blue-700">{t('upload.clickOnMap')}</p>
        </div>
      </div>

      <div className="rounded-lg overflow-hidden border border-blue-300">
        <SimpleMiniMap
          center={streetOnlyCoordinates}
          onLocationSelect={handleLocationSelect}
          t={t}
        />
      </div>

      <div className="mt-2 text-xs text-blue-600">💡 {t('upload.zoomTip')}</div>
    </div>
  );
};
