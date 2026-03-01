import { useState, useEffect, useCallback } from 'react';
import { photoService } from '../services/firebaseService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
import { translateWithParams, useLanguage } from '../contexts/LanguageContext';
import { generateImageSizes } from '@/utils/imageOptimization';
import { useFileUpload } from '@/hooks/useFileUpload';
import { validateCityBounds } from '@/utils/photoUploadValidation';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface TaggedPerson {
  id: string;
  name: string;
  x: number;
  y: number;
}

interface PhotoFormData {
  year: string;
  description: string;
  detailedDescription: string;
  author: string;
  photoType: string;
  sublocation: string;
}

const INITIAL_FORM_DATA: PhotoFormData = {
  year: '',
  description: '',
  detailedDescription: '',
  author: '',
  photoType: '',
  sublocation: '',
};

interface UsePhotoUploadParams {
  locationName: string;
  onSuccess?: () => void;
}

export function usePhotoUpload({ locationName, onSuccess }: UsePhotoUploadParams) {
  const { t } = useLanguage();
  const { user } = useAuth();

  // File upload hook
  const { selectedFile, previewUrl, handleFileChange, removeFile: removeFileBase } = useFileUpload(t);

  // Basic state
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [uploading, setUploading] = useState(false);

  // Address state
  const [addressSearch, setAddressSearch] = useState('');
  const [selectedAddress, setSelectedAddress] = useState('');
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);

  // Manual positioning state
  const [needsManualPositioning, setNeedsManualPositioning] = useState(false);
  const [streetOnlyCoordinates, setStreetOnlyCoordinates] = useState<Coordinates | null>(null);
  const [houseNumber, setHouseNumber] = useState('');
  const [streetName, setStreetName] = useState('');

  // Tagged persons state
  const [taggedPersons, setTaggedPersons] = useState<TaggedPerson[]>([]);

  // Form data
  const [formData, setFormData] = useState<PhotoFormData>(INITIAL_FORM_DATA);

  // Extended remove file handler that also clears tagged persons
  const removeFile = useCallback(() => {
    removeFileBase();
    setTaggedPersons([]);
  }, [removeFileBase]);

  // Handler for when address is selected from autocomplete
  const handleAddressSelect = useCallback((address: string, coords: Coordinates | null) => {
    setSelectedAddress(address);
    setAddressSearch(address);

    if (coords) {
      setCoordinates(coords);
      toast.success(t('upload.locationFound'));
    } else {
      toast.warning(t('upload.coordinatesNotFound'));
    }
  }, [t]);

  // Handler for manual positioning (when street found but not exact address)
  const handleManualPositioning = useCallback((
    streetCoords: Coordinates,
    street: string,
    house: string,
    fullAddress: string
  ) => {
    setStreetOnlyCoordinates(streetCoords);
    setStreetName(street);
    setHouseNumber(house);
    setSelectedAddress(fullAddress);
    setAddressSearch(fullAddress);
    setNeedsManualPositioning(true);
  }, []);

  // Clear address
  const handleClearAddress = useCallback(() => {
    setAddressSearch('');
    setSelectedAddress('');
    setCoordinates(null);
    setNeedsManualPositioning(false);
    setStreetOnlyCoordinates(null);
    setHouseNumber('');
    setStreetName('');
  }, []);

  // Handle adding a new tag
  const handleAddTag = useCallback((newTag: { name: string; x: number; y: number }) => {
    const tagWithId = {
      ...newTag,
      id: Date.now().toString()
    };
    setTaggedPersons(prev => [...prev, tagWithId]);
  }, []);

  // Handle manual location confirmation
  const handleManualLocationSelect = useCallback((coords: Coordinates) => {
    setCoordinates(coords);
    setSelectedAddress(`${streetName} ${houseNumber}`);
    setAddressSearch(`${streetName} ${houseNumber}`);
    setNeedsManualPositioning(false);
  }, [streetName, houseNumber]);

  // Handle change location (re-enter manual positioning)
  const handleChangeLocation = useCallback(() => {
    setNeedsManualPositioning(true);
    setCoordinates(null);
  }, []);

  // Handle address search change
  const handleAddressSearchChange = useCallback((value: string) => {
    setAddressSearch(value);
    if (selectedAddress && value !== selectedAddress) {
      setSelectedAddress('');
      setCoordinates(null);
    }
  }, [selectedAddress]);

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

  // Handle form submission
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

    if (addressSearch.trim() !== '' && (!selectedAddress || !coordinates)) {
      toast.error(t('upload.mustSelectAddress'));
      return;
    }

    const boundsValidation = validateCityBounds(
      coordinates,
      streetOnlyCoordinates,
      locationName,
      15
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
      const imageSizes = await generateImageSizes(selectedFile);

      const timestamp = Date.now();
      const sanitizedLocation = locationName
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9_-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      const baseName = `${sanitizedLocation}-${timestamp}`;

      // Upload all image variants in parallel
      const uploadPromises: Promise<{ type: string; url: string; width?: number; suffix?: string }>[] = [];

      const originalFileName = `${baseName}-original.jpg`;
      uploadPromises.push(
        photoService.uploadImage(imageSizes.original.blob, originalFileName, user.uid, photoId)
          .then(url => ({ type: 'original', url }))
      );

      for (const webp of imageSizes.webp) {
        const webpFileName = `${baseName}-${webp.suffix}.webp`;
        uploadPromises.push(
          photoService.uploadImage(webp.blob, webpFileName, user.uid, photoId)
            .then(url => ({ type: 'webp', url, width: webp.width, suffix: webp.suffix }))
        );
      }

      for (const jpeg of imageSizes.jpeg) {
        const jpegFileName = `${baseName}-${jpeg.suffix}.jpg`;
        uploadPromises.push(
          photoService.uploadImage(jpeg.blob, jpegFileName, user.uid, photoId)
            .then(url => ({ type: 'jpeg', url, width: jpeg.width, suffix: jpeg.suffix }))
        );
      }

      const results = await Promise.all(uploadPromises);

      const uploadedUrls: {
        original: string;
        webp: Array<{ url: string; width: number; suffix: string }>;
        jpeg: Array<{ url: string; width: number; suffix: string }>;
      } = { original: '', webp: [], jpeg: [] };

      for (const result of results) {
        if (result.type === 'original') {
          uploadedUrls.original = result.url;
        } else if (result.type === 'webp') {
          uploadedUrls.webp.push({ url: result.url, width: result.width!, suffix: result.suffix! });
        } else if (result.type === 'jpeg') {
          uploadedUrls.jpeg.push({ url: result.url, width: result.width!, suffix: result.suffix! });
        }
      }

      let uploaderName = 'Unknown';
      if (user?.displayName && user.displayName.trim() !== '') {
        uploaderName = user.displayName.trim();
      } else if (user?.email && user.email.trim() !== '') {
        uploaderName = user.email.split('@')[0].trim();
      }

      const photoData: Record<string, unknown> = {
        imageUrl: uploadedUrls.original,
        responsiveImages: {
          webp: uploadedUrls.webp,
          jpeg: uploadedUrls.jpeg,
          original: uploadedUrls.original,
        },
        imageDimensions: {
          width: imageSizes.original.width,
          height: imageSizes.original.height,
        },
        imageStoragePath: `photos/${user.uid}/${photoId}/${baseName}-original.jpg`,
        year: formData.year,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        author: formData.author,
        authorId: user.uid,
        location: locationName,
        sublocation: formData.sublocation.trim() || '',
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

      if (coordinates && selectedAddress) {
        photoData.coordinates = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: selectedAddress
        };
      }

      await photoService.addPhoto(photoData);

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
      removeFile();
      handleClearAddress();
      setFormData(INITIAL_FORM_DATA);

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
        toast.error(errorMessage || t('upload.error'));
      }
    } finally {
      setUploading(false);
    }
  };

  return {
    // State
    formData,
    setFormData,
    uploading,
    isOnline,
    selectedFile,
    previewUrl,
    addressSearch,
    selectedAddress,
    coordinates,
    needsManualPositioning,
    streetOnlyCoordinates,
    streetName,
    houseNumber,
    taggedPersons,

    // Handlers
    handleSubmit,
    handleFileChange,
    removeFile,
    handleAddressSelect,
    handleManualPositioning,
    handleClearAddress,
    handleAddTag,
    handleManualLocationSelect,
    handleChangeLocation,
    handleAddressSearchChange,
  };
}
