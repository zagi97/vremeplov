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
import { AddressAutocomplete } from './PhotoUpload/AddressAutocomplete';

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

  // Address state (simplified - most logic in AddressAutocomplete)
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [selectedAddress, setSelectedAddress] = useState<string>('');
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

    // Handler for when address is selected from autocomplete
  const handleAddressSelect = (address: string, coords: { latitude: number; longitude: number } | null) => {
    setSelectedAddress(address);
    setAddressSearch(address);

    if (coords) {
      setCoordinates(coords);
      toast.success(t('upload.locationFound'));
    } else {
      toast.warning(t('upload.coordinatesNotFound'));
    }
  };

  // Handler for manual positioning (when street found but not exact address)
  const handleManualPositioning = (
    streetCoords: { latitude: number; longitude: number },
    streetName: string,
    houseNumber: string,
    fullAddress: string
  ) => {
    setStreetOnlyCoordinates(streetCoords);
    setStreetName(streetName);
    setHouseNumber(houseNumber);
    setSelectedAddress(fullAddress);
    setAddressSearch(fullAddress);
    setNeedsManualPositioning(true);
  };

  // CLEAR ADDRESS
  const handleClearAddress = () => {
    setAddressSearch('');
    setSelectedAddress('');
    setCoordinates(null);
    setNeedsManualPositioning(false);
    setStreetOnlyCoordinates(null);
    setHouseNumber('');
    setStreetName('');
    setManualMarkerPosition(null);
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

    // ✅ STEP 1: Generate all image sizes
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

const imageUrl = uploadedUrls.original; // For backward compatibility

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
    const isStorageError = (err: unknown): err is { code: string } => {
      return typeof err === 'object' && err !== null && 'code' in err;
    };
    const errorCode = isStorageError(error) ? error.code : undefined;

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

          {/* ADDRESS AUTOCOMPLETE */}
          <div>
            <label className="block text-sm font-medium mb-2">
              <Navigation className="inline h-4 w-4 mr-1" />
              {t('upload.specificAddress')} {locationName} {t('upload.optional')}
            </label>

            <AddressAutocomplete
              locationName={locationName}
              value={addressSearch}
              onChange={(value) => {
                setAddressSearch(value);
                // Clear selected address when user starts typing
                if (selectedAddress && value !== selectedAddress) {
                  setSelectedAddress('');
                  setCoordinates(null);
                }
              }}
              onAddressSelect={handleAddressSelect}
              onManualPositioning={handleManualPositioning}
              placeholder={t('upload.searchAddress')}
              t={t}
            />

            <p className="text-xs text-gray-500 mt-1.5">
              💡 {t('upload.addressHelp')}
            </p>

            {/* Error message if user typed but didn't select */}
            {addressSearch.trim() !== '' && !selectedAddress && (
              <div className="mt-1 flex items-center gap-1 text-xs text-red-600">
                <svg className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
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