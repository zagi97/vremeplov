/**
 * Map clustering utilities
 * Algorithms for clustering photos on a map based on zoom level and proximity
 */

import { Photo } from '@/services/firebaseService';

/**
 * Photo with coordinates interface
 */
export interface PhotoWithCoordinates extends Photo {
  latitude: number;
  longitude: number;
  address?: string;
}

/**
 * Cluster group interface
 */
export interface ClusterGroup {
  center: [number, number];
  photos: PhotoWithCoordinates[];
  count: number;
}

/**
 * Clustered marker types
 */
export type ClusteredMarker =
  | { type: 'individual'; photo: PhotoWithCoordinates; position: [number, number] }
  | { type: 'cluster'; cluster: ClusterGroup; position: [number, number] };

/**
 * Get cluster radius based on zoom level
 * Higher zoom = smaller radius (more granular clustering)
 */
export const getClusterRadiusByZoom = (zoom: number): number => {
  if (zoom >= 15) return 0.0001;
  if (zoom >= 13) return 0.0005;
  if (zoom >= 11) return 0.002;
  return 0.01;
};

/**
 * Calculate Euclidean distance between two coordinates
 */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  return Math.sqrt(
    Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2)
  );
};

/**
 * Cluster photos based on proximity and zoom level
 * Uses a greedy algorithm with distance-based clustering
 *
 * @param photos - Photos with coordinates
 * @param zoom - Current map zoom level
 * @returns Array of clustered markers
 */
export const clusterPhotos = (
  photos: PhotoWithCoordinates[],
  zoom: number
): ClusteredMarker[] => {
  if (photos.length === 0) {
    return [];
  }

  // At very high zoom levels, show all individual markers
  if (zoom >= 19) {
    return photos.map(photo => ({
      type: 'individual' as const,
      photo,
      position: [photo.latitude, photo.longitude] as [number, number]
    }));
  }

  const clusters: ClusterGroup[] = [];
  const processed = new Set<string>();
  const clusterRadius = getClusterRadiusByZoom(zoom);

  // Greedy clustering algorithm
  photos.forEach((photo) => {
    if (processed.has(photo.id!)) return;

    // Create new cluster centered at this photo
    const cluster: ClusterGroup = {
      center: [photo.latitude, photo.longitude],
      photos: [photo],
      count: 1
    };

    // Find all nearby photos within cluster radius
    photos.forEach((otherPhoto) => {
      if (processed.has(otherPhoto.id!) || photo.id === otherPhoto.id) return;

      const distance = calculateDistance(
        photo.latitude,
        photo.longitude,
        otherPhoto.latitude,
        otherPhoto.longitude
      );

      if (distance < clusterRadius) {
        cluster.photos.push(otherPhoto);
        cluster.count++;
        processed.add(otherPhoto.id!);
      }
    });

    processed.add(photo.id!);
    clusters.push(cluster);
  });

  // Transform clusters into markers
  return clusters.map((cluster) => {
    if (cluster.count === 1) {
      // Single photo - show as individual marker
      return {
        type: 'individual' as const,
        photo: cluster.photos[0],
        position: cluster.center
      };
    } else {
      // Multiple photos - show as cluster marker
      return {
        type: 'cluster' as const,
        cluster,
        position: cluster.center
      };
    }
  });
};

/**
 * Filter photos that have valid coordinates
 */
export const filterPhotosWithCoordinates = (photos: Photo[]): PhotoWithCoordinates[] => {
  return photos
    .filter(photo => photo.coordinates?.latitude && photo.coordinates?.longitude)
    .map(photo => ({
      ...photo,
      latitude: photo.coordinates!.latitude,
      longitude: photo.coordinates!.longitude,
      address: photo.coordinates?.address
    }));
};
