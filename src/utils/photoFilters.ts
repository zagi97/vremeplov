/**
 * Photo filtering and sorting utilities
 * Shared logic for filtering and sorting photo collections
 */

import { Photo } from '@/services/firebaseService';
import { YearRange } from '@/constants/filters';

/**
 * Filter state interface
 */
export interface PhotoFilterState {
  searchText: string;
  yearRange: YearRange | null;
  photoType: string;
  sortBy: string;
}

/**
 * Default filter state
 */
export const DEFAULT_FILTERS: PhotoFilterState = {
  searchText: '',
  yearRange: null,
  photoType: 'all',
  sortBy: 'newest'
};

/**
 * Filter photos by search text
 * Searches in: description, detailedDescription, author, and year
 */
export const filterBySearch = (photos: Photo[], searchText: string): Photo[] => {
  if (!searchText.trim()) return photos;

  const searchLower = searchText.toLowerCase().trim();
  return photos.filter(photo =>
    photo.description.toLowerCase().includes(searchLower) ||
    photo.detailedDescription?.toLowerCase().includes(searchLower) ||
    photo.author.toLowerCase().includes(searchLower) ||
    photo.year.toString().includes(searchLower)
  );
};

/**
 * Filter photos by year range
 */
export const filterByYearRange = (photos: Photo[], yearRange: YearRange | null): Photo[] => {
  if (!yearRange) return photos;

  return photos.filter(photo => {
    const photoYear = parseInt(photo.year);
    return photoYear >= yearRange.start && photoYear <= yearRange.end;
  });
};

/**
 * Filter photos by photo type
 */
export const filterByPhotoType = (photos: Photo[], photoType: string): Photo[] => {
  if (photoType === 'all') return photos;

  return photos.filter(photo =>
    photo.photoType === photoType ||
    photo.description.toLowerCase().includes(photoType)
  );
};

/**
 * Apply all filters to photos
 */
export const filterPhotos = (photos: Photo[], filters: PhotoFilterState): Photo[] => {
  let filtered = [...photos];

  filtered = filterBySearch(filtered, filters.searchText);
  filtered = filterByYearRange(filtered, filters.yearRange);
  filtered = filterByPhotoType(filtered, filters.photoType);

  return filtered;
};

/**
 * Sort photos by selected criteria
 */
export const sortPhotos = (photos: Photo[], sortBy: string): Photo[] => {
  const sorted = [...photos];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) =>
        new Date(b.uploadedAt || '').getTime() - new Date(a.uploadedAt || '').getTime()
      );

    case 'oldest':
      return sorted.sort((a, b) =>
        new Date(a.uploadedAt || '').getTime() - new Date(b.uploadedAt || '').getTime()
      );

    case 'popular':
      return sorted.sort((a, b) => (b.likes || 0) - (a.likes || 0));

    case 'year_desc':
      return sorted.sort((a, b) => parseInt(b.year) - parseInt(a.year));

    case 'year_asc':
      return sorted.sort((a, b) => parseInt(a.year) - parseInt(b.year));

    default:
      return sorted;
  }
};

/**
 * Check if any filters are active (non-default)
 */
export const hasActiveFilters = (filters: PhotoFilterState): boolean => {
  return !!(
    filters.searchText ||
    filters.yearRange ||
    filters.photoType !== 'all' ||
    filters.sortBy !== 'newest'
  );
};

/**
 * Clear all filters to default state
 */
export const clearAllFilters = (): PhotoFilterState => {
  return { ...DEFAULT_FILTERS };
};

/**
 * Filter and sort photos in one operation
 */
export const filterAndSortPhotos = (photos: Photo[], filters: PhotoFilterState): Photo[] => {
  const filtered = filterPhotos(photos, filters);
  return sortPhotos(filtered, filters.sortBy);
};
