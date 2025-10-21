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

const PhotoUpload: React.FC<PhotoUploadProps> = ({ 
  locationName, 
  onSuccess, 
  onCancel 
}) => {
  // Hooks
  const { t } = useLanguage();
  const { user } = useAuth();

  // ✅ DODAJ OVO - Tier Status State
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
}, [user]);

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
  setAvailableAddresses([]);
  setLoadingAddresses(false);
};

// Dodaj useEffect za handle click outside
const dropdownRef = useRef<HTMLDivElement>(null);
useEffect(() => {
  const handleClickOutside = (event: MouseEvent) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
      closeAddressDropdown();
    }
  };

  if (showAddressDropdown) {
    document.addEventListener('mousedown', handleClickOutside);
  }

  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
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
            
            addresses.add(`${streetOnly} (kliknite za broj ${extractedHouseNumber})`);
            console.log(`Found street "${streetOnly}". Manual positioning ready.`);
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
  
  if (!file.type.startsWith('image/')) {
    toast.error(t('errors.invalidImageType'));
    return;
  }
  
  // Povećajte limit na 20MB jer sada imamo bolju kompresiju
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

  if (!navigator.onLine) {
    toast.error(t('upload.offline'));
    return;
  }

  // ✅ NOVO - Rate Limit Check
  if (uploadLimitInfo && !uploadLimitInfo.canUpload) {
    toast.error(
      t('upload.limitReachedMessage') || 
      `Dostigao si dnevni limit od ${uploadLimitInfo.dailyLimit} ${uploadLimitInfo.dailyLimit === 1 ? 'slike' : 'slika'}. Pokušaj sutra!`
    );
    return;
  }

  setUploading(true);

  try {
    const photoId = Date.now().toString();
    
    console.log('Starting upload process for photoId:', photoId);
    console.log('Selected address:', selectedAddress);
    console.log('Coordinates:', coordinates);
    
    const imageUrl = await photoService.uploadPhotoFile(selectedFile, photoId);
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
    
    // ✅ NOVO - Refresh upload limit after successful upload
    const updatedLimitCheck = await photoService.canUserUploadToday(user.uid);
    setUploadLimitInfo({
      canUpload: updatedLimitCheck.allowed,
      uploadsToday: updatedLimitCheck.uploadsToday,
      remainingToday: updatedLimitCheck.remainingToday,
      userTier: updatedLimitCheck.userTier,
      dailyLimit: updatedLimitCheck.dailyLimit,
      nextTierInfo: updatedLimitCheck.nextTierInfo
    });
    
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
    
    // ✅ NOVO - Check if error is about rate limiting
    if (errorMessage.includes('dnevni limit') || errorMessage.includes('Dostignut')) {
      toast.error(errorMessage);
      
      // Refresh limit info
      if (user) {
        const updatedLimitCheck = await photoService.canUserUploadToday(user.uid);
        setUploadLimitInfo({
          canUpload: updatedLimitCheck.allowed,
          uploadsToday: updatedLimitCheck.uploadsToday,
          remainingToday: updatedLimitCheck.remainingToday,
          userTier: updatedLimitCheck.userTier,
          dailyLimit: updatedLimitCheck.dailyLimit,
          nextTierInfo: updatedLimitCheck.nextTierInfo
        });
      }
    } else if (errorCode === 'storage/unauthorized') {
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
          <ImageIcon className="h-5 w-5" />
          {t('upload.addPhotoTo')} {locationName}
        </CardTitle>
      </CardHeader>
        {/* ✅ DODAJ OVO - TIER STATUS BADGE */}
      {/* ✅ TIER STATUS BADGE - IMPROVED VERSION */}
{uploadLimitInfo && (
  <div className="px-6 pb-4">
    <div className={`p-4 rounded-lg border-2 ${
      uploadLimitInfo.canUpload 
        ? 'bg-blue-50 border-blue-200' 
        : 'bg-red-50 border-red-200'
    }`}>
      {/* Header with Tier Badge */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex-1">
          {/* Tier Badge */}
          {uploadLimitInfo.userTier === 'NEW_USER' && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gray-200 text-gray-700 mb-2">
              🆕 {t('upload.tierNewUser')}
            </div>
          )}
          {uploadLimitInfo.userTier === 'VERIFIED' && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-500 text-white mb-2">
              ✅ {t('upload.tierVerified')}
            </div>
          )}
          {uploadLimitInfo.userTier === 'CONTRIBUTOR' && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-purple-500 text-white mb-2">
              🏆 {t('upload.tierContributor')}
            </div>
          )}
          {uploadLimitInfo.userTier === 'POWER_USER' && (
            <div className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-yellow-400 to-orange-500 text-white mb-2">
              👑 {t('upload.tierPowerUser')}
            </div>
          )}
          
          {/* Stats Text */}
          <p className="text-sm text-gray-700 font-medium">
            {t('upload.dailyLimit')}: <span className="font-bold">{uploadLimitInfo.dailyLimit}</span> {uploadLimitInfo.dailyLimit === 1 ? 'slika' : 'slike'}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {t('upload.uploadedToday')}: <span className="font-semibold">{uploadLimitInfo.uploadsToday}</span> | 
            {' '}{t('upload.remaining')}: <span className={`font-semibold ${uploadLimitInfo.remainingToday > 0 ? 'text-green-600' : 'text-red-600'}`}>
              {uploadLimitInfo.remainingToday}
            </span>
          </p>
          
          {/* Next Tier Info */}
          {uploadLimitInfo.nextTierInfo && (
            <p className="text-xs text-blue-600 mt-2 flex items-start gap-1">
              <span className="flex-shrink-0">💡</span>
              <span>{uploadLimitInfo.nextTierInfo}</span>
            </p>
          )}
        </div>
        
        {/* Progress Circle */}
        <div className="relative w-16 h-16 flex-shrink-0 ml-4">
          <svg className="transform -rotate-90 w-16 h-16">
            {/* Background circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              className="text-gray-200"
            />
            {/* Progress circle */}
            <circle
              cx="32"
              cy="32"
              r="28"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 28}`}
              strokeDashoffset={`${2 * Math.PI * 28 * (1 - uploadLimitInfo.uploadsToday / uploadLimitInfo.dailyLimit)}`}
              className={uploadLimitInfo.canUpload ? 'text-blue-500' : 'text-red-500'}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold">
              {uploadLimitInfo.uploadsToday}/{uploadLimitInfo.dailyLimit}
            </span>
          </div>
        </div>
      </div>
      
      {/* Error Message if limit reached */}
      {!uploadLimitInfo.canUpload && (
        <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-md">
          <div className="flex items-start gap-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-red-800">
                {t('upload.limitReached')}
              </h3>
              <p className="mt-1 text-xs text-red-700">
                {t('upload.limitReachedMessage')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
)}
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
                    accept="image/*"
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
                  type="text"
                  placeholder={t('upload.searchAddress')}
                  value={addressSearch}
                  onChange={handleAddressInputChange}
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
{/* ✅ DODAJ ERROR MESSAGE */}
{addressSearch.trim() !== '' && !selectedAddress && (
  <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
    <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
    </svg>
    {t('upload.mustSelectAddress')}
  </div>
)}
              {/* Search Status Indicator */}
              {addressSearch.length >= 2 && (
  <div className="absolute right-12 top-1/2 transform -translate-y-1/2 text-xs text-gray-500">
    {loadingAddresses ? t('searching') : 
     debouncedSearchTerm !== addressSearch ? t('typing') : 
     availableAddresses.length > 0 ? 
       translateWithParams(t, 'foundCount', { count: availableAddresses.length }) : 
       t('noResults')
    }
  </div>
)}

              {/* Dropdown with Results */}
              {showAddressDropdown && (
                <div ref={dropdownRef} className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                  {loadingAddresses ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
                      <span className="text-sm text-gray-600">{t('upload.searchingAddresses')}</span>
                    </div>
                  ) : availableAddresses.length > 0 ? (
                    <div>
                    <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
  {translateWithParams(t, 'foundAddresses', { count: availableAddresses.length })}
  {searchCache.has(`${debouncedSearchTerm}_${locationName}`) && (
    <span className="ml-2 text-green-600">📋 ({t('cached')})</span>
  )}
</div>
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
                      <div className="text-xs text-gray-400 mt-1">{t('upload.trySearching')}: "Školska", "Glavni trg", "Crkva"</div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-1 text-xs text-gray-500">
  {t('upload.trySearching')}: "Školska", "Glavni trg", "Crkva", "Mlinska", etc.
  {/* Debug info */}
  <span className="ml-2 text-gray-400">
    {translateWithParams(t, 'cacheEntries', { count: searchCache.size })}
    {debouncedSearchTerm !== addressSearch && (
      <span className="ml-2 text-orange-500">⏳ {t('waiting')}</span>
    )}
  </span>
</div>
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
                  className="text-green-700 hover:text-green-800 text-xs"
                >
                  {t('upload.changeLocation')}
                </Button>
              </div>
              
              {/* MINI MAP DISPLAY WITH SELECTED LOCATION */}
              <div className="rounded-lg overflow-hidden border border-green-300 h-32">
                <MapContainer
                  center={[coordinates.latitude, coordinates.longitude]}
                  zoom={17}
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

          {/* OLD COORDINATES DISPLAY - remove or adapt */}
          {coordinates && !selectedAddress && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
              <MapPin className="h-3 w-3" />
               <span>
      {translateWithParams(t, 'upload.locationFoundCoords', { 
        latitude: coordinates.latitude.toFixed(4), 
        longitude: coordinates.longitude.toFixed(4) 
      })}
    </span>
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