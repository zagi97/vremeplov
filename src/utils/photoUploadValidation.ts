/**
 * Validation utilities for PhotoUpload form
 */

/**
 * Check if coordinates are within a specified radius of a center point
 *
 * @param lat - Latitude to check
 * @param lng - Longitude to check
 * @param centerLat - Center latitude
 * @param centerLng - Center longitude
 * @param radiusKm - Radius in kilometers (default: 10km)
 * @returns boolean - true if within bounds
 */
export const isWithinBounds = (
  lat: number,
  lng: number,
  centerLat: number,
  centerLng: number,
  radiusKm: number = 10
): boolean => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat - centerLat) * Math.PI) / 180;
  const dLng = ((lng - centerLng) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((centerLat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance <= radiusKm;
};

/**
 * Validate if address selection is complete
 *
 * @param addressSearch - Current search input value
 * @param selectedAddress - Selected address from dropdown
 * @param coordinates - Coordinates for the selected address
 * @returns boolean - true if address is valid or empty
 */
export const isAddressValid = (
  addressSearch: string,
  selectedAddress: string,
  coordinates: { latitude: number; longitude: number } | null
): boolean => {
  // If user hasn't entered anything → OK (optional field)
  // If user HAS entered something, must be selected from dropdown with coordinates
  return (
    addressSearch.trim() === '' ||
    (addressSearch.trim() !== '' && selectedAddress !== '' && coordinates !== null)
  );
};

/**
 * Validate if all required form fields are filled
 *
 * @param formData - Form data object
 * @param selectedFile - Selected file
 * @param addressSearch - Address search value
 * @param selectedAddress - Selected address
 * @param coordinates - Coordinates
 * @returns boolean - true if form is valid
 */
export const isPhotoUploadFormValid = (
  formData: {
    year: string;
    description: string;
    author: string;
    photoType: string;
  },
  selectedFile: File | null,
  addressSearch: string,
  selectedAddress: string,
  coordinates: { latitude: number; longitude: number } | null
): boolean => {
  // Basic required fields
  const hasBasicFields = !!(
    selectedFile &&
    formData.year &&
    formData.description &&
    formData.author &&
    formData.photoType !== ''
  );

  // Address validation
  const addressValid = isAddressValid(addressSearch, selectedAddress, coordinates);

  return hasBasicFields && addressValid;
};

/**
 * Validate if coordinates are within city bounds
 *
 * @param coordinates - Coordinates to validate
 * @param cityCenter - City center coordinates (optional, fallback to Čačinci)
 * @param locationName - Name of the location
 * @param radiusKm - Radius in kilometers (default: 15km)
 * @returns { valid: boolean, errorMessage?: string }
 */
export const validateCityBounds = (
  coordinates: { latitude: number; longitude: number } | null,
  cityCenter: { latitude: number; longitude: number } | null,
  locationName: string,
  radiusKm: number = 15
): { valid: boolean; errorMessage?: string } => {
  if (!coordinates) {
    return { valid: true };
  }

  const center = cityCenter || {
    latitude: 45.6236,
    longitude: 17.8403, // Fallback to Čačinci
  };

  const withinBounds = isWithinBounds(
    coordinates.latitude,
    coordinates.longitude,
    center.latitude,
    center.longitude,
    radiusKm
  );

  if (!withinBounds) {
    return {
      valid: false,
      errorMessage: `❌ Odabrana lokacija nije unutar ${locationName}! Molimo odaberite lokaciju bliže centru grada.`,
    };
  }

  return { valid: true };
};
