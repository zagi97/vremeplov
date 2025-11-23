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
import YearPicker from "../components/YearPicker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { userService } from '@/services/userService';
import { municipalityData } from '../../data/municipalities';
import { parseLocationFromUrl } from '@/utils/locationUtils';
import { useDebounce } from '@/hooks/useDebounce';
import { IMAGE_CONFIG, resizeImage, generateImageSizes } from '@/utils/imageOptimization';
import { searchCache, getUploadTitle, extractHouseNumber, getPhotoTypeOptions } from '@/utils/photoUploadHelpers';
import { useFileUpload } from '@/hooks/useFileUpload';
import { isPhotoUploadFormValid, validateCityBounds } from '@/utils/photoUploadValidation';
import { ManualLocationPicker } from './PhotoUpload/ManualLocationPicker';
import { LocationConfirmation } from './PhotoUpload/LocationConfirmation';

interface PhotoUploadProps {
  locationName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

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

  const PHOTO_TYPES = getPhotoTypeOptions(t);

  // File upload hook
  const { selectedFile, previewUrl, handleFileChange, removeFile: removeFileBase } = useFileUpload(t);

  // Basic state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [uploading, setUploading] = useState(false);

  // Extended remove file handler that also clears tagged persons
  const removeFile = useCallback(() => {
    removeFileBase();
    setTaggedPersons([]);
  }, [removeFileBase]);

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

  // Validate address selection
  if (addressSearch.trim() !== '' && (!selectedAddress || !coordinates)) {
    toast.error(t('upload.mustSelectAddress'));
    return;
  }

  // Validate coordinates are within city bounds
  const boundsValidation = validateCityBounds(
    coordinates,
    streetOnlyCoordinates,
    locationName,
    15 // 15km radius
  );

  if (!boundsValidation.valid) {
    toast.error(boundsValidation.errorMessage || t('errors.locationOutOfBounds'), {
      duration: 5000,
    });
    return;
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
    removeFile(); // Also clears tagged persons
    handleClearAddress();
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
            <ManualLocationPicker
              streetOnlyCoordinates={streetOnlyCoordinates}
              streetName={streetName}
              houseNumber={houseNumber}
              onLocationSelect={(coords) => {
                setCoordinates(coords);
                setSelectedAddress(`${streetName} ${houseNumber}`);
                setAddressSearch(`${streetName} ${houseNumber}`);
                setNeedsManualPositioning(false);
                closeAddressDropdown();
              }}
              t={t}
            />
          )}

          {/* LOCATION CONFIRMATION SECTION */}
          {coordinates && selectedAddress && !needsManualPositioning && (
            <LocationConfirmation
              coordinates={coordinates}
              selectedAddress={selectedAddress}
              streetName={streetName}
              houseNumber={houseNumber}
              onChangeLocation={() => {
                setNeedsManualPositioning(true);
                setCoordinates(null);
              }}
              onReset={handleClearAddress}
              t={t}
            />
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
              disabled={uploading || !isOnline || !isPhotoUploadFormValid(formData, selectedFile, addressSearch, selectedAddress, coordinates)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {uploading ? t('upload.uploading') : !isOnline ? t('upload.noConnection') : !isPhotoUploadFormValid(formData, selectedFile, addressSearch, selectedAddress, coordinates) ? t('upload.fillRequired') : t('upload.shareMemory')}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default PhotoUpload;