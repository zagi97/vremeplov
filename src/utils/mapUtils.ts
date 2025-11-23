// src/utils/mapUtils.ts
import L from 'leaflet';

/**
 * Custom cluster icon creation
 */
export const createClusterIcon = (count: number): L.DivIcon => {
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

/**
 * Custom photo marker icon
 */
export const photoIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

/**
 * Get random location coordinates from municipality data
 */
export const getRandomLocationCoordinates = (municipalityRecords: any[]) => {
  if (municipalityRecords.length > 0) {
    const randomIndex = Math.floor(Math.random() * municipalityRecords.length);
    const record = municipalityRecords[randomIndex];
    // Check if coordinates are numbers
    if (typeof record[4] === 'number' && typeof record[5] === 'number') {
      return { latitude: record[4], longitude: record[5] };
    }
  }
  return { latitude: 45.8150, longitude: 15.9819 }; // Default Zagreb coordinates
};

/**
 * Fix for Leaflet icons in React
 */
export const fixLeafletIcons = () => {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
};
