import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, Calendar, MapPin, User, Image as ImageIcon, Navigation, Search, Tag } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { photoService, geocodingService } from '../services/firebaseService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { translateWithParams, useLanguage } from '../contexts/LanguageContext';
import { CharacterCounter } from "./ui/character-counter";
import PhotoTagger from "./PhotoTagger";
import { TooltipProvider } from "./ui/tooltip";
import { SimpleMiniMap } from "./SimpleMiniMap";
import YearPicker from "../components/YearPicker"; // ✅ Added YearPicker import
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { userService } from '@/services/userService';
import municipalityData from '../../data/municipalities.json';
import { parseLocationFromUrl } from '@/utils/locationUtils';

// ✅ IMAGE OPTIMIZATION CONFIGURATION
const IMAGE_CONFIG = {
  sizes: [
    { width: 800, suffix: '800w', quality: 0.85 },
    { width: 1200, suffix: '1200w', quality: 0.85 },
    { width: 1600, suffix: '1600w', quality: 0.85 },
  ],
  webp: { quality: 0.85, enabled: true },
  jpeg: { quality: 0.90, enabled: true },
  maxOriginalWidth: 2400,
  maxOriginalHeight: 2400,
};

// ✅ UTILITY: Resize image
const resizeImage = (
  img: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number,
  format: 'image/webp' | 'image/jpeg' = 'image/jpeg'
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    let width = img.width;
    let height = img.height;

    if (width > height) {
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
    } else {
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }
    }

    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Canvas to Blob conversion failed'));
      },
      format,
      quality
    );
  });
};

// ✅ UTILITY: Generate multiple sizes
const generateImageSizes = async (
  file: File
): Promise<{
  original: { blob: Blob; width: number; height: number };
  webp: Array<{ blob: Blob; suffix: string; width: number }>;
  jpeg: Array<{ blob: Blob; suffix: string; width: number }>;
}> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = async (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = async () => {
      try {
        const results = {
          original: { blob: null as any, width: img.width, height: img.height },
          webp: [] as Array<{ blob: Blob; suffix: string; width: number }>,
          jpeg: [] as Array<{ blob: Blob; suffix: string; width: number }>,
        };

        const originalBlob = await resizeImage(
          img,
          IMAGE_CONFIG.maxOriginalWidth,
          IMAGE_CONFIG.maxOriginalHeight,
          IMAGE_CONFIG.jpeg.quality,
          'image/jpeg'
        );
        results.original.blob = originalBlob;

        for (const size of IMAGE_CONFIG.sizes) {
          if (img.width < size.width) continue;

          if (IMAGE_CONFIG.webp.enabled) {
            const webpBlob = await resizeImage(
              img,
              size.width,
              size.width * (img.height / img.width),
              size.quality,
              'image/webp'
            );
            results.webp.push({
              blob: webpBlob,
              suffix: size.suffix,
              width: size.width,
            });
          }

          if (IMAGE_CONFIG.jpeg.enabled) {
            const jpegBlob = await resizeImage(
              img,
              size.width,
              size.width * (img.height / img.width),
              IMAGE_CONFIG.jpeg.quality,
              'image/jpeg'
            );
            results.jpeg.push({
              blob: jpegBlob,
              suffix: size.suffix,
              width: size.width,
            });
          }
        }

        resolve(results);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    reader.readAsDataURL(file);
  });
};

interface PhotoUploadProps {
  locationName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// Custom debounce hook
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Cache for search results
const searchCache = new Map<string, string[]>();

// Linija 279
const getUploadTitle = (type: string | null, location: string, t: any) => {
  const cityType = (type?.toLowerCase() === 'grad') ? 'city' : 'municipality';
  return `${t(`upload.addPhotoTo${cityType.charAt(0).toUpperCase() + cityType.slice(1)}`)} ${location}`;
};

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  locationName, 
  onSuccess, 
  onCancel 
}) => {
  // Hooks
  const { t } = useLanguage();


  const decodedLocationName = decodeURIComponent(locationName);
  const parsedLocation = parseLocationFromUrl(decodedLocationName, municipalityData);

  const { user } = useAuth();

/*   // ✅ DODAJ OVO - Tier Status State
const [uploadLimitInfo, setUploadLimitInfo] = useState<{
  canUpload: boolean;
  uploadsToday: number;
  remainingToday: number;
  userTier: string;
  dailyLimit: number;
  nextTierInfo?: string;
} | null>(null);

// ✅ DODAJ OVO - Check upload limit on mount and when user changes
useEffect(() => {
  const checkUploadLimit = async () => {
    if (!user) return;
    
    try {
      const limitCheck = await photoService.canUserUploadToday(user.uid);
      setUploadLimitInfo({
        canUpload: limitCheck.allowed,
        uploadsToday: limitCheck.uploadsToday,
        remainingToday: limitCheck.remainingToday,
        userTier: limitCheck.userTier,
        dailyLimit: limitCheck.dailyLimit,
        nextTierInfo: limitCheck.nextTierInfo
      });
    } catch (error) {
      console.error('Error checking upload limit:', error);
    }
  };
  
  checkUploadLimit();
}, [user]); */

  const PHOTO_TYPES = [
  { value: "street", label: t('photoType.street') },
  { value: "building", label: t('photoType.building') },
  { value: "people", label: t('photoType.people') },
  { value: "event", label: t('photoType.event') },
  { value: "nature", label: t('photoType.nature') }
];
  
  // Basic state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // Address search state (optimized)
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [availableAddresses, setAvailableAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);

  // Manual positioning state
  const [needsManualPositioning, setNeedsManualPositioning] = useState(false);
  const [streetOnlyCoordinates, setStreetOnlyCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
  const [houseNumber, setHouseNumber] = useState<string>('');
  const [streetName, setStreetName] = useState<string>('');
  const [manualMarkerPosition, setManualMarkerPosition] = useState<{latitude: number, longitude: number} | null>(null);

  // Tagged persons state
  const [taggedPersons, setTaggedPersons] = useState<Array<{
    id: string;
    name: string;
    x: number;
    y: number;
  }>>([]);

  // Form data
  const [formData, setFormData] = useState({
    year: '',
    description: '',
    detailedDescription: '',
    author: '',
    photoType: '', // Dodaj ovo
  });

  const closeAddressDropdown = () => {
  setShowAddressDropdown(false);
  
  setLoadingAddresses(false);
};

const dropdownRef = useRef<HTMLDivElement>(null);
const searchInputRef = useRef<HTMLInputElement>(null); // ✅ DODAJ OVO
// Dodaj useEffect za handle click outside
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    // ✅ POBOLJŠAN - Provjeri da nije kliknut input NI dropdown
    if (
      searchInputRef.current && 
      !searchInputRef.current.contains(event.target as Node) &&
      dropdownRef.current && 
      !dropdownRef.current.contains(event.target as Node)
    ) {
      closeAddressDropdown();
    }
  };

  if (showAddressDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside); // ← Typo ispravljen
  };
}, [showAddressDropdown]);

  // Debounce search term - waits 500ms after user stops typing
  const debouncedSearchTerm = useDebounce(addressSearch, 500);
  
  // Ref for tracking current request
  const currentRequestRef = useRef<AbortController | null>(null);
  
  // Flag to prevent search when selecting an address
  const isSelectingAddressRef = useRef(false);

  // Helper functions
  const extractStreetName = (fullAddress: string): string => {
    return fullAddress.replace(/\d+.*$/, '').trim();
  };

  const extractHouseNumber = (fullAddress: string): string | null => {
    const match = fullAddress.match(/\d+/);
    return match ? match[0] : null;
  };

  // Optimized address search function with caching and debouncing
  const searchAddresses = useCallback(async (searchTerm: string) => {
    // Check cache first
    const cacheKey = `${searchTerm}_${locationName}`;
    if (searchCache.has(cacheKey)) {
      console.log('📋 Using cached results for:', searchTerm);
      const cachedResults = searchCache.get(cacheKey);
      setAvailableAddresses(cachedResults || []);
      setLoadingAddresses(false);
      setShowAddressDropdown(true);
      return;
    }

    setLoadingAddresses(true);
    setShowAddressDropdown(true);

    try {
      // Cancel previous request if still running
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
      
      // Create new AbortController
      const abortController = new AbortController();
      currentRequestRef.current = abortController;

      // 1. TRY TO FIND EXACT ADDRESS
      const fullSearchTerm = `${searchTerm}, ${locationName}, Croatia`;
      const encodedSearch = encodeURIComponent(fullSearchTerm);
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedSearch}&addressdetails=1&limit=10&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          },
          signal: abortController.signal
        }
      );

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        return;
      }

      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      
      // Extract addresses
      const addresses = new Set<string>();
      let exactAddressFound = false;
      
      data.forEach((item: any) => {
        if (item.address) {
          const streetNameFromAPI = item.address.road || item.address.street;
          const houseNumberFromAPI = item.address.house_number;
          const amenity = item.address.amenity;
          const shop = item.address.shop;
          
          if (streetNameFromAPI) {
            if (houseNumberFromAPI) {
              addresses.add(`${streetNameFromAPI} ${houseNumberFromAPI}`);
              exactAddressFound = true;
            } else {
              addresses.add(streetNameFromAPI);
            }
          }
          
          if (amenity && amenity.toLowerCase().includes(searchTerm.toLowerCase())) {
            addresses.add(amenity);
          }
          if (shop && shop.toLowerCase().includes(searchTerm.toLowerCase())) {
            addresses.add(`${shop} (trgovina)`);
          }
        }
      });

      // 2. SEARCH FOR STREET ONLY IF NO EXACT ADDRESS FOUND
      const streetOnly = extractStreetName(searchTerm);
      const extractedHouseNumber = extractHouseNumber(searchTerm);
      
      if (!exactAddressFound && extractedHouseNumber && streetOnly !== searchTerm) {
  console.log(`Exact address not found. Searching for street: "${streetOnly}"`);
  
  const streetSearchTerm = `${streetOnly}, ${locationName}, Croatia`;
  const streetEncodedSearch = encodeURIComponent(streetSearchTerm);
  
  const streetResponse = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${streetEncodedSearch}&addressdetails=1&limit=5&countrycodes=hr&accept-language=hr`,
    {
      headers: {
        'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
      },
      signal: abortController.signal
    }
  );

  if (!abortController.signal.aborted && streetResponse.ok) {
    const streetData = await streetResponse.json();
    
    if (streetData.length > 0) {
      const streetResult = streetData[0];
      setStreetOnlyCoordinates({
        latitude: parseFloat(streetResult.lat),
        longitude: parseFloat(streetResult.lon)
      });
      setHouseNumber(extractedHouseNumber);
      setStreetName(streetOnly);
      
      addresses.add(`${streetOnly} (kliknite za broj ${extractedHouseNumber})`); // ✅ ISPRAVLJENO
      console.log(`Found street "${streetOnly}". Manual positioning ready.`);

      // ✅ AUTO-TRIGGER manual positioning
      setNeedsManualPositioning(true);
      setSelectedAddress(`${streetOnly} ${extractedHouseNumber}`);
      setAddressSearch(`${streetOnly} ${extractedHouseNumber}`);
      closeAddressDropdown(); // Zatvori dropdown

      // Prikaži info poruku
      toast.info(
        translateWithParams(t, 'upload.selectExactLocation', { 
          street: streetOnly, 
          number: extractedHouseNumber 
        }),
        { duration: 5000 }
      );
    }
  }
}

      const finalResults = Array.from(addresses).slice(0, 8);
      
      // Save to cache only if request wasn't cancelled
      if (!abortController.signal.aborted) {
        searchCache.set(cacheKey, finalResults);
        setAvailableAddresses(finalResults);
        console.log('🔍 Search completed for:', searchTerm, 'Results:', finalResults.length);
      }
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('Search request was cancelled');
        return;
      }
      console.error('Error searching addresses:', error);
      toast.error(t('errors.addressSearchFailed'));
      setAvailableAddresses([]);
    } finally {
      if (currentRequestRef.current) {
        setLoadingAddresses(false);
        currentRequestRef.current = null;
      }
    }
  }, [locationName]);

  // Trigger search when debounced term changes
  useEffect(() => {
    // Don't search if we're in the process of selecting an address
    if (isSelectingAddressRef.current) {
      console.log('🚫 Skipping search - address being selected');
      isSelectingAddressRef.current = false; // Reset flag
      return;
    }
    
    if (debouncedSearchTerm.length >= 2) {
      console.log('🚀 Starting search for:', debouncedSearchTerm);
      searchAddresses(debouncedSearchTerm);
    } else {
      setAvailableAddresses([]);
      setShowAddressDropdown(false);
      setLoadingAddresses(false);
    }
  }, [debouncedSearchTerm, searchAddresses]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }
    };
  }, []);

  // ✅ NOVI HANDLER - Re-open dropdown on focus
const handleInputFocus = () => {
  if (addressSearch.length > 0 && availableAddresses.length > 0) {
    setShowAddressDropdown(true);
  }
};

  // Handle input change with immediate loading feedback
  const handleAddressInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    
    // Reset the selection flag when user manually types
    isSelectingAddressRef.current = false;
    
    setAddressSearch(value);
    
    // Clear selected address when user starts typing again
    if (selectedAddress && value !== selectedAddress) {
      setSelectedAddress('');
      setCoordinates(null);
    }
    
    // Show loading immediately if user is typing
    if (value.length >= 2 && !loadingAddresses) {
      setLoadingAddresses(true);
      setShowAddressDropdown(true);
    }
    
    // Hide dropdown if search is too short
    if (value.length < 2) {
      setShowAddressDropdown(false);
      setLoadingAddresses(false);
      setAvailableAddresses([]); // Clear results
      
      // Cancel current request
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
    }
  };

  // SELECT ADDRESS from dropdown
  const handleAddressSelect = async (address: string) => {
    console.log('📍 Address selected:', address);
    
    // Set flag to prevent search from running when we update addressSearch
    isSelectingAddressRef.current = true;
    
    // Immediately close dropdown and clear loading state
    closeAddressDropdown();
    
    // Set the selected address
    setSelectedAddress(address);
    setAddressSearch(address);

    // Cancel current request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }

    // Check if this requires manual positioning
    if (address.includes('(kliknite za broj')) {
      const streetName = address.split(' (kliknite za broj')[0];
      setNeedsManualPositioning(true);
     toast.info(
  translateWithParams(t, 'upload.selectExactLocation', { 
    street: streetName, 
    number: houseNumber 
  })
);
      return;
    }

    // Reset manual positioning state
    setNeedsManualPositioning(false);
    setStreetOnlyCoordinates(null);
    setHouseNumber('');
    setStreetName('');

    // Try to get coordinates for regular address
    try {
      const coords = await geocodingService.getCoordinatesFromAddress(address, locationName);
      if (coords) {
        setCoordinates(coords);
        console.log('Coordinates found for address:', address, coords);
       toast.success(t('upload.locationFound'));
      } else {
        toast.warning(t('upload.coordinatesNotFound'));
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  };

  // CLEAR ADDRESS
  const handleClearAddress = () => {
    setAddressSearch('');
    setSelectedAddress('');
    setAvailableAddresses([]);
    setShowAddressDropdown(false);
    setCoordinates(null);
    setNeedsManualPositioning(false);
    setStreetOnlyCoordinates(null);
    setHouseNumber('');
    setStreetName('');
    setManualMarkerPosition(null);
    setLoadingAddresses(false);

    // Cancel current request
    if (currentRequestRef.current) {
      currentRequestRef.current.abort();
      currentRequestRef.current = null;
    }
  };

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Check if form is valid
const isFormValid = (): boolean => {
  // Basic required fields
  const hasBasicFields = !!(
    selectedFile && 
    formData.year && 
    formData.description && 
    formData.author && 
    formData.photoType !== ''
  );
  
  // ✅ NOVO - Address validation
  // Ako user nije upisao ništa u address search → OK (optional field)
  // Ako JESTE upisao nešto, mora biti selected iz dropdowna
  const isAddressValid = addressSearch.trim() === '' || 
    (addressSearch.trim() !== '' && selectedAddress !== '' && coordinates !== null);
  
  return hasBasicFields && isAddressValid;
};

  // Helper function to compress image
// 1. Poboljšaj kompresiju u PhotoUpload.tsx (linija 285)
// Zamijenite postojeću compressImage funkciju u PhotoUpload.tsx (oko linije 285)

const compressImage = (file: File, maxWidth: number = 1920, quality: number = 0.85): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      console.warn('Canvas not supported, returning original file');
      resolve(file);
      return;
    }
    
    img.onload = () => {
      // Izračunaj optimalne dimenzije
      let { width, height } = img;
      
      // Ako je slika manja od maxWidth, ne mijenjaj je
      if (width <= maxWidth && height <= maxWidth) {
        console.log('Slika je već dovoljno mala, preskoćemo kompresiju');
        resolve(file);
        return;
      }
      
      // Sačuvaj aspect ratio
      const aspectRatio = width / height;
      
      if (width > height) {
        // Landscape - ograniči širinu
        width = Math.min(width, maxWidth);
        height = width / aspectRatio;
      } else {
        // Portrait - ograniči visinu
        height = Math.min(height, maxWidth);
        width = height * aspectRatio;
      }
      
      // Postavi canvas dimenzije
      canvas.width = width;
      canvas.height = height;
      
      // Optimiziraj kvalitetu renderiranja
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      // Crtaj sliku
      ctx.drawImage(img, 0, 0, width, height);
      
      // Određi kvalitetu na osnovu veličine
      let finalQuality = quality;
      if (file.size > 10 * 1024 * 1024) {
        finalQuality = 0.7; // Agresivnija kompresija za velike datoteke
      } else if (file.size > 5 * 1024 * 1024) {
        finalQuality = 0.8;
      }
      
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          
          const originalSizeMB = (file.size / 1024 / 1024).toFixed(2);
          const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(2);
          const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(1);
          
          console.log(`📸 Kompresija uspješna:`);
          console.log(`   Original: ${originalSizeMB}MB`);
          console.log(`   Kompresovano: ${compressedSizeMB}MB`);
          console.log(`   Smanjeno za: ${reduction}%`);
          console.log(`   Dimenzije: ${img.width}x${img.height} → ${width}x${height}`);
          
          resolve(compressedFile);
        } else {
          console.error('Kompresija neuspješna, vraćam original');
          resolve(file);
        }
      }, 'image/jpeg', finalQuality);
    };
    
    img.onerror = () => {
      console.error('Greška pri učitavanju slike za kompresiju');
      resolve(file);
    };
    
    img.src = URL.createObjectURL(file);
  });
};

  // Handle file selection with compression
// Također ažurirajte handleFileChange funkciju (oko linije 320) da bolje rukuje kompresijom:

const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  // ❌ Block non-images
  if (!file.type.startsWith('image/')) {
    toast.error(t('errors.invalidImageType'));
    return;
  }
  
  // ✅ NOVI KOD - BLOCK GIF FILES
  if (file.type === 'image/gif') {
    toast.error('🚫 GIF animacije nisu podržane. Molimo koristite JPG, PNG ili WebP format.', {
      duration: 5000
    });
    event.target.value = ''; // Reset input field
    return;
  }
  
  // ❌ Block large files (20MB limit)
  if (file.size > 20 * 1024 * 1024) {
    toast.error(t('errors.imageTooLarge'));
    return;
  }

  try {
    // Očistite prethodnu preview URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    // Kreiraj preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    
    // Pokaži loading toast za kompresiju
    const loadingToast = toast.loading(t('upload.compressing'));
    
    // Kompresija
    const compressedFile = await compressImage(file);
    
    // Ukloni loading toast
    toast.dismiss(loadingToast);
    
    setSelectedFile(compressedFile);
    
    // Pokaži rezultat kompresije
    const originalSizeMB = (file.size / 1024 / 1024).toFixed(1);
    const compressedSizeMB = (compressedFile.size / 1024 / 1024).toFixed(1);
    
    if (compressedFile.size < file.size) {
      const reduction = ((1 - compressedFile.size / file.size) * 100).toFixed(0);
      toast.success(
        translateWithParams(t, 'upload.compressed', { 
          original: originalSizeMB, 
          compressed: compressedSizeMB, 
          reduction: reduction 
        })
      );
    } else {
      toast.success(t('upload.optimalSize'));
    }
    
  } catch (error) {
    console.error('Greška pri kompresiji:', error);
    toast.error(t('errors.compressionError'));
    // U slučaju greške, koristi original
    setSelectedFile(file);
  }
};
  // Remove selected file
  const removeFile = () => {
    setSelectedFile(null);
    setTaggedPersons([]);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
  };

  // Handle adding a new tag
  const handleAddTag = (newTag: { name: string; x: number; y: number }) => {
    const tagWithId = {
      ...newTag,
      id: Date.now().toString()
    };
    setTaggedPersons(prev => [...prev, tagWithId]);
  };

  // Handle form submission
  // Handle form submission - AŽURIRANO s rate limiting
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  if (!user) {
    toast.error(t('upload.error'));
    return;
  }
  
  if (!selectedFile) {
    toast.error(t('upload.error'));
    return;
  }

  if (!formData.year || !formData.description || !formData.author) {
    toast.error(t('upload.fillRequired'));
    return;
  }

  // ✅ DODAJ OVO - Explicit address validation
if (addressSearch.trim() !== '' && (!selectedAddress || !coordinates)) {
  toast.error(t('upload.mustSelectAddress'));
  return;
}
// ✅ DODATNA PROVJERA - je li marker zaista unutar grada
if (coordinates) {
  // Provjeri je li fotka u Čačincima (ili bilo kojem odabranom gradu)
  const cityCoords = streetOnlyCoordinates || { 
    latitude: 45.6236, 
    longitude: 17.8403 
  }; // Fallback na Čačinci
  
  const isWithinBounds = (
    lat: number,
    lng: number,
    centerLat: number,
    centerLng: number,
    radiusKm: number = 10
  ): boolean => {
    const R = 6371;
    const dLat = (lat - centerLat) * Math.PI / 180;
    const dLng = (lng - centerLng) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(centerLat * Math.PI / 180) *
        Math.cos(lat * Math.PI / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  };
  
  if (!isWithinBounds(
    coordinates.latitude,
    coordinates.longitude,
    cityCoords.latitude,
    cityCoords.longitude,
    15 // 15km radius
  )) {
    toast.error(
      `❌ Odabrana lokacija nije unutar ${locationName}! Molimo odaberite lokaciju bliže centru grada.`,
      { duration: 5000 }
    );
    return;
  }
}

  if (!navigator.onLine) {
    toast.error(t('upload.offline'));
    return;
  }

  setUploading(true);

  try {
    const photoId = Date.now().toString();
    
    console.log('Starting upload process for photoId:', photoId);
    console.log('Selected address:', selectedAddress);
    console.log('Coordinates:', coordinates);
    
    // ✅ STEP 1: Generate all image sizes
console.log('🔄 Starting image optimization...');
const imageSizes = await generateImageSizes(selectedFile);

// ✅ STEP 2: Upload all images
const timestamp = Date.now();
const baseName = `${locationName}-${timestamp}`;

const uploadedUrls: {
  original: string;
  webp: Array<{ url: string; width: number; suffix: string }>;
  jpeg: Array<{ url: string; width: number; suffix: string }>;
} = {
  original: '',
  webp: [],
  jpeg: [],
};

// Upload original
uploadedUrls.original = await photoService.uploadImage(
  imageSizes.original.blob,
  `${baseName}-original.jpg`
);

// Upload WebP versions
for (const webp of imageSizes.webp) {
  const url = await photoService.uploadImage(
    webp.blob,
    `${baseName}-${webp.suffix}.webp`
  );
  uploadedUrls.webp.push({ url, width: webp.width, suffix: webp.suffix });
}

// Upload JPEG fallback
for (const jpeg of imageSizes.jpeg) {
  const url = await photoService.uploadImage(
    jpeg.blob,
    `${baseName}-${jpeg.suffix}.jpg`
  );
  uploadedUrls.jpeg.push({ url, width: jpeg.width, suffix: jpeg.suffix });
}

console.log('✅ All images uploaded:', uploadedUrls);
const imageUrl = uploadedUrls.original; // For backward compatibility
    console.log('File upload successful, creating database record...');
    
    let uploaderName = 'Unknown';
    if (user?.displayName && user.displayName.trim() !== '') {
      uploaderName = user.displayName.trim();
    } else if (user?.email && user.email.trim() !== '') {
      uploaderName = user.email.split('@')[0].trim();
    }

   // ✅ Prepare photo data object
const photoData: any = {
  imageUrl: imageUrl,
  responsiveImages: {
    webp: uploadedUrls.webp,
    jpeg: uploadedUrls.jpeg,
    original: uploadedUrls.original,
  },
  imageDimensions: {
    width: imageSizes.original.width,
    height: imageSizes.original.height,
  },
  imageStoragePath: `photos/${photoId}/${Date.now()}_${selectedFile.name}`,
  year: formData.year,
  description: formData.description,
  detailedDescription: formData.detailedDescription,
  author: formData.author,
  authorId: user.uid,
  location: locationName,
  photoType: formData.photoType,
  taggedPersons: taggedPersons.map(person => ({
    name: person.name,
    x: person.x,
    y: person.y,
    addedByUid: user.uid,
    isApproved: false
  })),
  uploadedBy: uploaderName,
  uploadedAt: new Date().toISOString()
};

// ✅ DODAJ coordinates SAMO ako postoje
if (coordinates && selectedAddress) {
  photoData.coordinates = {
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address: selectedAddress
  };
}
  
const finalPhotoId = await photoService.addPhoto(photoData);
console.log('Database record created successfully with ID:', finalPhotoId);

// ✅ ISPRAVNO - koristi coordinates i selectedAddress
if (coordinates && selectedAddress) {
  toast.success(
    translateWithParams(t, 'upload.successWithLocation', { 
      address: selectedAddress 
    })
  );
} else {
  toast.success(t('upload.success'));
}
    
    
    // Reset form
    setSelectedFile(null);
    setTaggedPersons([]);
    handleClearAddress();
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }
    setFormData({
      year: '',
      description: '',
      detailedDescription: '',
      author: '',
      photoType: ''
    });

    onSuccess?.();
    
  } catch (error: unknown) {
    console.error('Upload error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorCode = (error as any)?.code;
    
    if (errorCode === 'storage/unauthorized') {
      toast.error(t('errors.uploadFailed'));
    } else if (errorCode === 'storage/quota-exceeded') {
      toast.error(t('errors.uploadStorageFull'));
    } else if (errorMessage?.includes('network')) {
      toast.error(t('errors.uploadError'));
    } else {
      toast.error(t('upload.error'));
    }
  } finally {
    setUploading(false);
  }
};

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getUploadTitle(parsedLocation.type, parsedLocation.displayName, t)}
        </CardTitle>
      </CardHeader>
        {/* ✅ DODAJ OVO - TIER STATUS BADGE */}
      {/* ✅ TIER STATUS BADGE - IMPROVED VERSION */}
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {!selectedFile ? (
              <div className="text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="mt-4">
                  <label htmlFor="photo-upload" className="cursor-pointer">
                    <span className="mt-2 block text-sm font-medium text-gray-900">
                      {t('upload.clickToUpload')}
                    </span>
                    <span className="mt-1 block text-xs text-gray-500">
                      {t('upload.fileTypes')}
                    </span>
                  </label>
                  <input
                    id="photo-upload"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            ) : (
              <TooltipProvider>
                <PhotoTagger
                  taggedPersons={taggedPersons}
                  onAddTag={handleAddTag}
                  imageUrl={previewUrl}
                  onRemoveFile={removeFile}
                  photoId={undefined}
                />
              </TooltipProvider>
            )}
          </div>

          {/* OPTIMIZED ADDRESS SEARCH */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Navigation className="inline h-4 w-4 mr-1" />
              {t('upload.specificAddress')} {locationName} {t('upload.optional')}
            </label>
            
            <div className="relative">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder={t('upload.searchAddress')}
                  value={addressSearch}
                  onChange={handleAddressInputChange}
                  onFocus={handleInputFocus}  // ← Ovaj handler zatvara dropdown
                  className={`pl-10 ${
    loadingAddresses ? 'pr-10' : selectedAddress ? 'pr-10' : ''
  } ${
    // ✅ DODAJ ERROR STYLING
    addressSearch.trim() !== '' && !selectedAddress 
      ? 'border-red-300 focus:border-red-500 bg-red-50' 
      : ''
  }`}
                  
                />
                
                {/* Loading Spinner */}
                {loadingAddresses && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  </div>
                )}
                
                {/* Clear Button */}
                {selectedAddress && !loadingAddresses && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearAddress}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-gray-100"
                  >
                    ✕
                  </Button>
                )}
              </div>

              {/* ✅ HELP TEXT - DODAJ OVDJE */}
  <p className="text-xs text-gray-500 mt-1.5">
    💡 {t('upload.addressHelp')}
  </p>



              {/* Dropdown with Results */}
              {showAddressDropdown && (
                <div ref={dropdownRef} className="absolute z-[1000] w-full top-[calc(100%+2px)] bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingAddresses ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-sm text-gray-600">{t('upload.searchingAddresses')}</span>
                    </div>
                  ) : availableAddresses.length > 0 ? (
                    <div>
                      {availableAddresses.map((address, index) => {
                        const isStatusMessage = address.includes('🔍') || address.includes('❌');
                        
                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => {
                              if (!isStatusMessage) {
                                console.log('🔍 Clicking address:', address);
                                handleAddressSelect(address);
                              }
                            }}
                            disabled={isStatusMessage}
                            className={`w-full text-left px-4 py-3 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                              isStatusMessage 
                                ? 'text-gray-500 cursor-default bg-gray-50' 
                                : 'hover:bg-blue-50 hover:text-blue-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {!isStatusMessage && <MapPin className="h-3 w-3 text-gray-400" />}
                              <span className={isStatusMessage ? "font-normal" : "font-medium"}>{address}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : addressSearch.length >= 2 ? (
                    <div className="px-4 py-4 text-sm text-gray-500 text-center">
                      <MapPin className="h-4 w-4 mx-auto mb-2 text-gray-400" />
                      {t('upload.noAddressesFound')} "<span className="font-medium">{addressSearch}</span>"
                      
                    </div>
                  ) : null}
                </div>
              )}
            </div>
{/* ✅ DODAJ ERROR MESSAGE */}
{addressSearch.trim() !== '' && !selectedAddress && (
  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    {t('upload.mustSelectAddress')}
  </div>
)}
          </div>

          {/* MANUAL POSITIONING SECTION */}
          {needsManualPositioning && streetOnlyCoordinates && (
            <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-1 bg-blue-600 text-white rounded">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                   <h4 className="font-medium text-blue-800 mb-1">
          📍 {translateWithParams(t, 'upload.streetFound', { 
            street: streetName, 
            number: houseNumber 
          })}
        </h4>
                  <p className="text-sm text-blue-700">
                    {t('upload.clickOnMap')}
                  </p>
                </div>
              </div>
              
              <div className="rounded-lg overflow-hidden border border-blue-300">
                <SimpleMiniMap
                  center={streetOnlyCoordinates}
                  onLocationSelect={(coords) => {
                    setCoordinates(coords);
                    setSelectedAddress(`${streetName} ${houseNumber}`);
                    setAddressSearch(`${streetName} ${houseNumber}`);
                    setNeedsManualPositioning(false);
                    closeAddressDropdown();
                    toast.success(
  translateWithParams(t, 'upload.locationSet', { 
    street: streetName, 
    number: houseNumber 
  })
);
                  }}
                  t={t}
                />
              </div>
              
              <div className="mt-2 text-xs text-blue-600">
                💡 {t('upload.zoomTip')}
              </div>
            </div>
          )}

          {/* LOCATION CONFIRMATION SECTION */}
          {coordinates && selectedAddress && !needsManualPositioning && (
            <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-start gap-3 mb-3">
                <div className="p-1 bg-green-600 text-white rounded">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 mb-1">
                    ✅ {translateWithParams(t, 'upload.locationSetTitle', { address: selectedAddress })}
                  </h4>
                  <p className="text-sm text-green-700">
                    {t('upload.coordinates')}: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    console.log('Promijeni button clicked');
                    
                    // Check if we have data for manual positioning
                    if (streetName && houseNumber) {
                      // Return to manual positioning mode
                      setNeedsManualPositioning(true);
                      setCoordinates(null);
                     toast.info(
  translateWithParams(t, 'upload.selectNewLocation', { 
    street: streetName, 
    number: houseNumber 
  })
);
                    } else {
                      // No data, completely reset
                      handleClearAddress();
                      toast.info(t('upload.canSearchAgain'));
                    }
                  }}
                  className="text-blue-600 hover:text-blue-800 font-semibold underline hover:no-underline transition-all"
                >
                  {t('upload.changeLocation')}
                </Button>
              </div>
              
              {/* MINI MAP DISPLAY WITH SELECTED LOCATION */}
              <div className="rounded-lg overflow-hidden border border-green-300 h-48">
                <MapContainer
                  center={[coordinates.latitude, coordinates.longitude]}
                  zoom={15}
                  style={{ height: '100%', width: '100%' }}
                  className="rounded-lg"
                  zoomControl={false}
                  dragging={false}
                  scrollWheelZoom={false}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap'
                  />
                  <Marker position={[coordinates.latitude, coordinates.longitude]} />
                </MapContainer>
              </div>
              
              <div className="mt-2 text-xs text-green-600">
                📍 {t('upload.selectedPhotoLocation')}
              </div>
            </div>
          )}


          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year - ✅ UPDATED WITH YEARPICKER */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t('upload.year')} *
              </label>
              <YearPicker
                selectedYear={formData.year}
                onYearSelect={(year) => setFormData(prev => ({...prev, year}))}
                t={t}
                required={true}
              />
            </div>

            {/* Author */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <User className="inline h-4 w-4 mr-1" />
                {t('upload.author')} *
              </label>
              <Input
                type="text"
                placeholder={t('upload.whoTookPhoto')}
                value={formData.author}
                onChange={(e) => setFormData({...formData, author: e.target.value})}
                maxLength={40}
                className={formData.author.length >= 38 ? "border-red-300 focus:border-red-500" : ""}
              />
              <CharacterCounter currentLength={formData.author.length} maxLength={40} />
            </div>
            {/* Photo Type - NOVO POLJE */}
<div>
  <label className="block text-sm font-medium mb-2">
    <Tag className="inline h-4 w-4 mr-1" />
     {t('upload.photoType')} *
  </label>
  <Select
    value={formData.photoType}
    onValueChange={(value) => setFormData({...formData, photoType: value})}
  >
    <SelectTrigger>
      <SelectValue placeholder={t('upload.selectPhotoType')} />
    </SelectTrigger>
    <SelectContent>
      {PHOTO_TYPES.map(type => (
      <SelectItem 
        key={type.value} 
        value={type.value}
        className="hover:bg-blue-50 hover:text-blue-700 cursor-pointer"
      >
        {type.label}
        </SelectItem>
      ))}
    </SelectContent>
  </Select>
</div>
          </div>

          {/* Location (readonly) */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <MapPin className="inline h-4 w-4 mr-1" />
              {t('upload.location')}
            </label>
            <Input
              type="text"
              value={locationName}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              {t('upload.description')} *
            </label>
            <Input
              type="text"
              placeholder={t('upload.briefDescription')}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              maxLength={120}
              className={formData.description.length >= 114 ? "border-red-300 focus:border-red-500" : ""}
            />
            <CharacterCounter currentLength={formData.description.length} maxLength={120} />
          </div>

          {/* Detailed Description */}
<div>
  <label className="block text-sm font-medium mb-2">
    {t('upload.detailedStory')}
  </label>
  <Textarea
    placeholder={t('upload.shareStory')}
    value={formData.detailedDescription}
    onChange={(e) => {
      const value = e.target.value.slice(0, 250);
      setFormData({...formData, detailedDescription: value});
    }}
    maxLength={250}
    rows={3}
    className={formData.detailedDescription.length >= 238 ? "border-red-300 focus:border-red-500" : ""}
  />
  <CharacterCounter currentLength={formData.detailedDescription.length} maxLength={250} />
</div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                {t('common.cancel')}
              </Button>
            )}
            <Button 
              type="submit" 
              disabled={uploading || !isOnline || !isFormValid()}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? t('upload.uploading') : !isOnline ? t('upload.noConnection') : !isFormValid() ? t('upload.fillRequired') : t('upload.shareMemory')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;