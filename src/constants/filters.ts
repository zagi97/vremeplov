/**
 * Filter-related constants
 * Centralized location for filtering, sorting, and categorization options
 */

import { Calendar, Clock, TrendingUp } from 'lucide-react';

// ============================================================================
// YEAR RANGES
// ============================================================================

/**
 * Year range interface for filtering
 */
export interface YearRange {
  start: number;
  end: number;
  label: string;
}

/**
 * Predefined year ranges for historical photo filtering
 */
export const YEAR_RANGES: YearRange[] = [
  { start: 1900, end: 1920, label: "1900-1920" },
  { start: 1920, end: 1940, label: "1920-1940" },
  { start: 1940, end: 1960, label: "1940-1960" },
  { start: 1960, end: 1980, label: "1960-1980" },
  { start: 1980, end: 2000, label: "1980-2000" },
  { start: 2000, end: 2025, label: "2000-2025" }
] as const;

// ============================================================================
// PHOTO TYPE FILTERS
// ============================================================================

/**
 * Photo type filter option interface
 */
export interface PhotoTypeOption {
  value: string;
  label: string;
}

/**
 * Get photo type filter options with translations
 * @param t - Translation function from language context
 * @returns Array of photo type options
 */
export const getPhotoTypeOptions = (t: any): PhotoTypeOption[] => [
  { value: "all", label: t('photoType.allTypes') },
  { value: "Street", label: t('photoType.street') },
  { value: "Building", label: t('photoType.building') },
  { value: "People", label: t('photoType.people') },
  { value: "Event", label: t('photoType.event') },
  { value: "Nature", label: t('photoType.nature') }
];

// ============================================================================
// SORT OPTIONS
// ============================================================================

/**
 * Sort option interface
 */
export interface SortOption {
  value: string;
  label: string;
  icon: any;
}

/**
 * Get sort options with translations
 * @param t - Translation function from language context
 * @returns Array of sort options
 */
export const getSortOptions = (t: any): SortOption[] => [
  { value: "newest", label: t('sort.newest'), icon: Clock },
  { value: "oldest", label: t('sort.oldest'), icon: Calendar },
  { value: "popular", label: t('sort.popular'), icon: TrendingUp },
  { value: "year_desc", label: t('sort.yearNewest'), icon: Calendar },
  { value: "year_asc", label: t('sort.yearOldest'), icon: Calendar }
];

// ============================================================================
// TAG CATEGORIES
// ============================================================================

/**
 * Tag category interface
 */
export interface TagCategory {
  icon: string;
  name: string;
  tags: string[];
}

/**
 * Tag categories with predefined tags for photo categorization
 * Used across PhotoUpload, TagsFilter, and other tag-related components
 */
export const TAG_CATEGORIES: Record<string, TagCategory> = {
  people: {
    icon: '👥',
    name: 'People & Society',
    tags: [
      'Family', 'Wedding', 'Children', 'Elderly', 'Portrait',
      'Group Photo', 'Celebration', 'Community', 'Fashion', 'Traditional Dress'
    ]
  },
  places: {
    icon: '🏛️',
    name: 'Places & Buildings',
    tags: [
      'Church', 'School', 'Market', 'Town Square', 'Bridge',
      'Old Building', 'Monument', 'Cemetery', 'Factory', 'Farm'
    ]
  },
  events: {
    icon: '🎉',
    name: 'Events & Occasions',
    tags: [
      'Festival', 'Religious Ceremony', 'Sports Event', 'Market Day',
      'Parade', 'Concert', 'Dance', 'Fair', 'Meeting', 'Ceremony'
    ]
  },
  work: {
    icon: '⚒️',
    name: 'Work & Industry',
    tags: [
      'Agriculture', 'Crafts', 'Trade', 'Construction', 'Transport',
      'Fishing', 'Farming', 'Workshop', 'Market Vendor', 'Blacksmith'
    ]
  },
  transport: {
    icon: '🚂',
    name: 'Transportation',
    tags: [
      'Train', 'Horse Cart', 'Bicycle', 'Old Car', 'Boat',
      'Railway', 'Station', 'Road', 'Bridge', 'Public Transport'
    ]
  },
  nature: {
    icon: '🌳',
    name: 'Nature & Environment',
    tags: [
      'River', 'Forest', 'Field', 'Garden', 'Park',
      'Landscape', 'Trees', 'Flowers', 'Animals', 'Weather'
    ]
  },
  culture: {
    icon: '🎭',
    name: 'Culture & Tradition',
    tags: [
      'Folk Dance', 'Traditional Music', 'Folklore', 'Costume', 'Art',
      'Literature', 'Theater', 'Cultural Event', 'Heritage', 'Customs'
    ]
  },
  historical: {
    icon: '📜',
    name: 'Historical Events',
    tags: [
      'War', 'Peace', 'Political Event', 'Royal Visit', 'Memorial',
      'Independence', 'Revolution', 'Reconstruction', 'Historic Moment', 'Archive'
    ]
  }
} as const;

/**
 * Get all tags as a flat array
 * Useful for search functionality and quick lookups
 */
export const getAllTags = (): string[] => {
  return Object.values(TAG_CATEGORIES).flatMap(category => category.tags);
};

/**
 * Popular tags that are most commonly used
 * Can be filtered based on available tags in photos
 */
export const POPULAR_TAGS = [
  'Family', 'Church', 'Festival', 'Market', 'Traditional Dress', 'Group Photo'
] as const;
