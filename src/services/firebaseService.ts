// src/services/firebaseService.ts
import { Timestamp } from 'firebase/firestore';

// ========================================
// TYPES & INTERFACES
// ========================================

interface NominatimAddress {
  road?: string;
  street?: string;
  house_number?: string;
  amenity?: string;
  shop?: string;
  building?: string;
}

interface NominatimResult {
  address?: NominatimAddress;
}

export interface Photo {
  id?: string;
  imageUrl: string;
  imageStoragePath: string;
  year: string;
  description: string;
  detailedDescription?: string;
  author: string;
  authorId?: string;
  location: string;
  sublocation?: string;
  responsiveImages?: {
    webp: Array<{ url: string; width: number; suffix: string }>;
    jpeg: Array<{ url: string; width: number; suffix: string }>;
    original: string;
  };
  imageDimensions?: {
    width: number;
    height: number;
  };
  coordinates?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  uploadedBy?: string;
  uploadedAt?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  views: number;
  isApproved: boolean;
  photoType?: string;
  taggedPersons?: Array<{
    name: string;
    x: number;
    y: number;
  }>;
}

export interface Comment {
  id?: string;
  photoId: string;
  userId: string;
  text: string;
  createdAt: Timestamp;
  userName?: string;
  userEmail?: string;
  photoTitle?: string;
  photoLocation?: string;
  isFlagged?: boolean;
  flaggedAt?: Timestamp;
  isApproved?: boolean;
}

export interface TaggedPerson {
  id?: string;
  photoId: string;
  name: string;
  x: number;
  y: number;
  description?: string;
  addedBy: string;
  addedByUid?: string;
  createdAt: Timestamp;
  isApproved: boolean;
  moderatedAt?: Timestamp;
  moderatedBy?: string;
  photoAuthorId?: string;
}

export interface UserLike {
  id?: string;
  userId: string;
  photoId: string;
  createdAt: Timestamp;
}

export interface UserView {
  id?: string;
  userId: string;
  photoId: string;
  createdAt: Timestamp;
}

export interface Story {
  id?: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  location: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  likes: number;
  views: number;
  isApproved: boolean;
  approvedAt?: Timestamp;
  approvedBy?: string;
}

export interface UserDocument {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
  bio?: string;
  location?: string;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  isAdmin?: boolean;
}

// ========================================
// GEOCODING SERVICE
// ========================================

export const geocodingService = {
  /**
   * Get coordinates from address with randomization
   */
  async getCoordinatesFromAddress(address: string, city: string): Promise<{latitude: number, longitude: number} | null> {
    try {
      const fullAddress = address ? `${address}, ${city}, Croatia` : `${city}, Croatia`;
      const encodedAddress = encodeURIComponent(fullAddress);

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Geocoding request failed');
      }

      const data = await response.json();

      if (data && data.length > 0) {
        let latitude = parseFloat(data[0].lat);
        let longitude = parseFloat(data[0].lon);

        // Add small randomization for same streets (10-50m offset)
        const randomOffsetLat = (Math.random() - 0.5) * 0.0005;
        const randomOffsetLon = (Math.random() - 0.5) * 0.0005;

        latitude += randomOffsetLat;
        longitude += randomOffsetLon;

        const result = {
          latitude,
          longitude
        };
        return result;
      }

      return null;
    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  },

  /**
   * Search addresses with better error handling
   */
  async searchAddresses(searchTerm: string, city: string): Promise<string[]> {
    try {
      if (!searchTerm || searchTerm.length < 2) {
        return [];
      }

      const fullSearchTerm = `${searchTerm}, ${city}, Croatia`;
      const encodedSearch = encodeURIComponent(fullSearchTerm);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedSearch}&addressdetails=1&limit=10&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract unique addresses
      const addresses = new Set<string>();

      (data as NominatimResult[]).forEach((item) => {
        if (item.address) {
          const streetName = item.address.road || item.address.street;
          const houseNumber = item.address.house_number;
          const amenity = item.address.amenity;
          const shop = item.address.shop;
          const building = item.address.building;

          // Add streets with numbers
          if (streetName) {
            if (houseNumber) {
              addresses.add(`${streetName} ${houseNumber}`);
            } else {
              addresses.add(streetName);
            }
          }

          // Add points of interest
          if (amenity) {
            addresses.add(amenity);
          }
          if (shop) {
            addresses.add(`${shop} (trgovina)`);
          }
          if (building) {
            addresses.add(building);
          }
        }
      });

      const results = Array.from(addresses).slice(0, 8);
      return results;

    } catch (error) {
      console.error('Error searching addresses:', error);
      return [];
    }
  },

  /**
   * Get basic city information
   */
  async getCityInfo(city: string): Promise<{latitude: number, longitude: number, displayName: string} | null> {
    try {
      const encodedCity = encodeURIComponent(`${city}, Croatia`);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedCity}&limit=1&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }

      return null;
    } catch (error) {
      console.error('Error getting city info:', error);
      return null;
    }
  }
};

// ========================================
// RE-EXPORT NEW SERVICES
// ========================================

// Photo-related services
export { photoService } from './photo/photoService';
export { commentService } from './photo/commentService';
export { tagService } from './photo/tagService';
export { likeService } from './photo/likeService';
export { viewService } from './photo/viewService';

// Story service
export { storyService } from './story/storyService';

// Auth service
export { authService } from './authService';
