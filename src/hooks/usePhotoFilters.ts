/**
 * Hook for photo filtering and sorting
 * Manages filter state and applies filters to photo collections
 */

import { useState, useEffect, useMemo } from 'react';
import { Photo } from '@/services/firebaseService';
import {
  PhotoFilterState,
  DEFAULT_FILTERS,
  filterAndSortPhotos,
  hasActiveFilters as checkHasActiveFilters,
  clearAllFilters
} from '@/utils/photoFilters';

/**
 * Hook return type
 */
export interface UsePhotoFiltersReturn {
  /** Current filter state */
  filters: PhotoFilterState;
  /** Filtered and sorted photos */
  filteredPhotos: Photo[];
  /** Update filter state */
  setFilters: React.Dispatch<React.SetStateAction<PhotoFilterState>>;
  /** Update a single filter field */
  updateFilter: <K extends keyof PhotoFilterState>(key: K, value: PhotoFilterState[K]) => void;
  /** Clear all filters */
  clearFilters: () => void;
  /** Check if any filters are active */
  hasActiveFilters: boolean;
  /** Count of filtered photos */
  filteredCount: number;
  /** Count of total photos */
  totalCount: number;
}

/**
 * Hook for managing photo filters and sorting
 * @param photos - Array of photos to filter
 * @param initialFilters - Initial filter state (optional)
 * @returns Filter state and filtered photos
 */
export const usePhotoFilters = (
  photos: Photo[],
  initialFilters: PhotoFilterState = DEFAULT_FILTERS
): UsePhotoFiltersReturn => {
  const [filters, setFilters] = useState<PhotoFilterState>(initialFilters);

  // Apply filters and sorting
  const filteredPhotos = useMemo(() => {
    return filterAndSortPhotos(photos, filters);
  }, [photos, filters]);

  // Check if filters are active
  const hasActiveFilters = useMemo(() => {
    return checkHasActiveFilters(filters);
  }, [filters]);

  // Update a single filter field
  const updateFilter = <K extends keyof PhotoFilterState>(
    key: K,
    value: PhotoFilterState[K]
  ) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  // Clear all filters
  const handleClearFilters = () => {
    setFilters(clearAllFilters());
  };

  return {
    filters,
    filteredPhotos,
    setFilters,
    updateFilter,
    clearFilters: handleClearFilters,
    hasActiveFilters,
    filteredCount: filteredPhotos.length,
    totalCount: photos.length
  };
};
