// src/utils/photoUploadHelpers.ts

/**
 * Cache for address search results
 */
export const searchCache = new Map<string, string[]>();

/**
 * Generate upload title based on location type
 */
export const getUploadTitle = (type: string | null, location: string, t: (key: string) => string): string => {
  const cityType = (type?.toLowerCase() === 'grad') ? 'city' : 'municipality';
  return `${t(`upload.addPhotoTo${cityType.charAt(0).toUpperCase() + cityType.slice(1)}`)} ${location}`;
};

/**
 * Extract house number from address string
 */
export const extractHouseNumber = (fullAddress: string): string | null => {
  const match = fullAddress.match(/\d+/);
  return match ? match[0] : null;
};

/**
 * Photo type options
 */
export const getPhotoTypeOptions = (t: (key: string) => string) => [
  { value: "Street", label: t('photoType.street') },
  { value: "Building", label: t('photoType.building') },
  { value: "People", label: t('photoType.people') },
  { value: "Event", label: t('photoType.event') },
  { value: "Nature", label: t('photoType.nature') }
];
