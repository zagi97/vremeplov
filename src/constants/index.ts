/**
 * Application-wide constants
 * Centralized location for magic numbers and strings
 */

// ============================================================================
// PAGINATION
// ============================================================================

/**
 * Number of photos to display per page in admin dashboard
 */
export const PHOTOS_PER_PAGE = 10;

/**
 * Number of items per page for various listings
 */
export const ITEMS_PER_PAGE = {
  ADMIN_PHOTOS: 10,
  GALLERY: 24,
  NOTIFICATIONS: 5,
  SEARCH_RESULTS: 20,
} as const;

// ============================================================================
// FILE UPLOAD
// ============================================================================

/**
 * Maximum file size for image uploads (in bytes)
 * 20MB = 20 * 1024 * 1024
 * Note: This is for the INPUT file before compression.
 * Firebase Storage rules enforce 10MB limit on compressed files.
 */
export const MAX_FILE_SIZE = 20 * 1024 * 1024;

/**
 * Supported image file formats
 */
export const SUPPORTED_IMAGE_FORMATS = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;

/**
 * Maximum image dimensions
 */
export const IMAGE_DIMENSIONS = {
  MAX_ORIGINAL_WIDTH: 2400,
  THUMBNAIL_WIDTH: 800,
  MEDIUM_WIDTH: 1200,
  LARGE_WIDTH: 1600,
} as const;

// ============================================================================
// TEXT LIMITS
// ============================================================================

/**
 * Maximum character limits for text inputs
 */
export const TEXT_LIMITS = {
  /** Maximum characters for descriptions, reasons, comments */
  DESCRIPTION: 250,
  /** Maximum characters for photo title */
  TITLE: 100,
  /** Maximum characters for user bio */
  BIO: 500,
  /** Maximum characters for location name */
  LOCATION: 100,
  /** Maximum characters for author name */
  AUTHOR: 100,
} as const;

// ============================================================================
// API & DATABASE
// ============================================================================

/**
 * Firestore query limits
 */
export const QUERY_LIMITS = {
  /** Maximum number of IDs in Firestore 'in' query */
  FIRESTORE_IN_LIMIT: 10,
  /** Maximum address search results to display */
  ADDRESS_SEARCH_RESULTS: 8,
  /** Maximum number of recent photos to cache */
  RECENT_PHOTOS_CACHE: 50,
} as const;

/**
 * Cache durations (in milliseconds)
 */
export const CACHE_DURATION = {
  /** 5 minutes */
  SHORT: 5 * 60 * 1000,
  /** 15 minutes */
  MEDIUM: 15 * 60 * 1000,
  /** 1 hour */
  LONG: 60 * 60 * 1000,
  /** 24 hours */
  DAY: 24 * 60 * 60 * 1000,
} as const;

// ============================================================================
// UI CONSTANTS
// ============================================================================

/**
 * Default number of skeleton items to show in loading states
 */
export const SKELETON_COUNTS = {
  PHOTOS: 9,
  COMMENTS: 3,
  NOTIFICATIONS: 5,
  TABLE_ROWS: 5,
} as const;

/**
 * Debounce delays (in milliseconds)
 */
export const DEBOUNCE_DELAY = {
  /** For search inputs */
  SEARCH: 300,
  /** For autocomplete */
  AUTOCOMPLETE: 200,
  /** For resize events */
  RESIZE: 150,
} as const;

/**
 * Animation durations (in milliseconds)
 */
export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ============================================================================
// PHOTO METADATA
// ============================================================================

/**
 * Valid year range for historical photos
 */
export const YEAR_RANGE = {
  MIN: 1800,
  MAX: new Date().getFullYear(),
} as const;

/**
 * Photo type categories
 */
export const PHOTO_TYPES = {
  STREET: 'Street',
  BUILDING: 'Building',
  PEOPLE: 'People',
  EVENT: 'Event',
  NATURE: 'Nature',
} as const;

// ============================================================================
// USER TIERS
// ============================================================================

/**
 * User tier upload limits (photos per day)
 */
export const TIER_LIMITS = {
  NEW_USER: 1,
  VERIFIED: 3,
  CONTRIBUTOR: 5,
  POWER_USER: 10,
} as const;

/**
 * Photos required to reach each tier
 */
export const TIER_REQUIREMENTS = {
  NEW_USER: 0,
  VERIFIED: 1,
  CONTRIBUTOR: 10,
  POWER_USER: 50,
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Common error messages
 * Note: For user-facing errors, prefer using translation keys from locales
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error occurred',
  FILE_TOO_LARGE: 'File size exceeds maximum limit',
  INVALID_FORMAT: 'Invalid file format',
  UPLOAD_FAILED: 'Upload failed',
  AUTH_REQUIRED: 'Authentication required',
  PERMISSION_DENIED: 'Permission denied',
  NOT_FOUND: 'Resource not found',
} as const;

// ============================================================================
// ROUTES
// ============================================================================

/**
 * Application routes
 */
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  ADMIN: '/admin',
  MAP: '/memory-map',
  LOCATION: '/location/:locationName',
  PHOTO: '/photo/:id',
  USER: '/user/:userId',
  LEADERBOARD: '/leaderboard',
} as const;

// ============================================================================
// STORAGE KEYS
// ============================================================================

/**
 * localStorage/sessionStorage keys
 */
export const STORAGE_KEYS = {
  LANGUAGE: 'language',
  THEME: 'theme',
  USER_PREFERENCES: 'userPreferences',
  CACHE_PREFIX: 'cache_',
} as const;

// ============================================================================
// MAP SETTINGS
// ============================================================================

/**
 * Map configuration
 */
export const MAP_CONFIG = {
  /** Default center coordinates (Croatia) */
  DEFAULT_CENTER: { lat: 45.1, lng: 15.2 } as const,
  /** Default zoom level */
  DEFAULT_ZOOM: 8,
  /** Max zoom for detail view */
  MAX_ZOOM: 18,
  /** Min zoom */
  MIN_ZOOM: 6,
} as const;
