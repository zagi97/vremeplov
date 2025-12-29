import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface AddressState {
  addressSearch: string;
  selectedAddress: string;
  coordinates: Coordinates | null;
  needsManualPositioning: boolean;
  streetOnlyCoordinates: Coordinates | null;
  houseNumber: string;
  streetName: string;
  manualMarkerPosition: Coordinates | null;
}

export function useAddressState(t: (key: string) => string) {
  const [state, setState] = useState<AddressState>({
    addressSearch: '',
    selectedAddress: '',
    coordinates: null,
    needsManualPositioning: false,
    streetOnlyCoordinates: null,
    houseNumber: '',
    streetName: '',
    manualMarkerPosition: null,
  });

  const handleAddressSelect = useCallback((
    address: string,
    coords: Coordinates | null
  ) => {
    setState(prev => ({
      ...prev,
      selectedAddress: address,
      addressSearch: address,
      coordinates: coords,
    }));

    if (coords) {
      toast.success(t('upload.locationFound'));
    } else {
      toast.warning(t('upload.coordinatesNotFound'));
    }
  }, [t]);

  const handleManualPositioning = useCallback((
    streetCoords: Coordinates,
    streetName: string,
    houseNumber: string,
    fullAddress: string
  ) => {
    setState(prev => ({
      ...prev,
      streetOnlyCoordinates: streetCoords,
      streetName,
      houseNumber,
      selectedAddress: fullAddress,
      addressSearch: fullAddress,
      needsManualPositioning: true,
    }));
  }, []);

  const handleClearAddress = useCallback(() => {
    setState({
      addressSearch: '',
      selectedAddress: '',
      coordinates: null,
      needsManualPositioning: false,
      streetOnlyCoordinates: null,
      houseNumber: '',
      streetName: '',
      manualMarkerPosition: null,
    });
  }, []);

  const handleAddressSearchChange = useCallback((value: string) => {
    setState(prev => {
      // Clear selected address when user starts typing
      if (prev.selectedAddress && value !== prev.selectedAddress) {
        return {
          ...prev,
          addressSearch: value,
          selectedAddress: '',
          coordinates: null,
        };
      }
      return {
        ...prev,
        addressSearch: value,
      };
    });
  }, []);

  const confirmManualLocation = useCallback((coords: Coordinates) => {
    setState(prev => ({
      ...prev,
      coordinates: coords,
      selectedAddress: `${prev.streetName} ${prev.houseNumber}`,
      addressSearch: `${prev.streetName} ${prev.houseNumber}`,
      needsManualPositioning: false,
    }));
  }, []);

  const requestManualPositioning = useCallback(() => {
    setState(prev => ({
      ...prev,
      needsManualPositioning: true,
      coordinates: null,
    }));
  }, []);

  return {
    ...state,
    handleAddressSelect,
    handleManualPositioning,
    handleClearAddress,
    handleAddressSearchChange,
    confirmManualLocation,
    requestManualPositioning,
  };
}
