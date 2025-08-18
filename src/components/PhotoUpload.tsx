import React, { useState, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Upload, Calendar, MapPin, User, Image as ImageIcon, Navigation, Search } from "lucide-react";
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { photoService, geocodingService } from '../services/firebaseService';
import { toast } from 'sonner';
import { useAuth } from '../contexts/AuthContext';
// ✅ DODAJ useLanguage HOOK
import { useLanguage } from '../contexts/LanguageContext';
import { CharacterCounter } from "./ui/character-counter";
import PhotoTagger from "./PhotoTagger";
import { TooltipProvider } from "./ui/tooltip";
import { SimpleMiniMap } from "./SimpleMiniMap";

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
  // ✅ KORISTI LANGUAGE HOOK
  const { t } = useLanguage();
  const { user } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [uploading, setUploading] = useState(false);

  // ✅ Address state
  const [addressSearch, setAddressSearch] = useState<string>('');
  const [availableAddresses, setAvailableAddresses] = useState<string[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showAddressDropdown, setShowAddressDropdown] = useState(false);
  const [coordinates, setCoordinates] = useState<{latitude: number, longitude: number} | null>(null);

  // Tagged persons state
  const [taggedPersons, setTaggedPersons] = useState<Array<{
    id: number;
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
    tags: [] as string[]
  });


// DODAJ SAMO OVE NOVE STATE VARIJABLE U PHOTOUPLOAD KOMPONENTU
const [needsManualPositioning, setNeedsManualPositioning] = useState(false);
const [streetOnlyCoordinates, setStreetOnlyCoordinates] = useState<{latitude: number, longitude: number} | null>(null);
const [houseNumber, setHouseNumber] = useState<string>('');
const [streetName, setStreetName] = useState<string>('');

  // ✅ SEARCH ADDRESSES when user types
// HELPER FUNKCIJE
// HELPER FUNKCIJE (dodaj u PhotoUpload komponentu)
const extractStreetName = (fullAddress: string): string => {
  return fullAddress.replace(/\d+.*$/, '').trim();
};

const extractHouseNumber = (fullAddress: string): string | null => {
  const match = fullAddress.match(/\d+/);
  return match ? match[0] : null;
};

// MODIFICIRAJ POSTOJEĆU handleAddressSearch FUNKCIJU
const handleAddressSearch = async (searchTerm: string) => {
  setAddressSearch(searchTerm);
  
  if (searchTerm.length < 2) {
    setAvailableAddresses([]);
    setShowAddressDropdown(false);
    setNeedsManualPositioning(false);
    return;
  }

  setLoadingAddresses(true);
  setShowAddressDropdown(true);

  try {
    // 1. POKUŠAJ PRONAĆI TOČNU ADRESU (postojeći kod)
    const fullSearchTerm = `${searchTerm}, ${locationName}, Croatia`;
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
      throw new Error('Search request failed');
    }

    const data = await response.json();
    
    // Izvuci adrese
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

    // 2. NOVI DIO: AKO NEMA TOČNE ADRESE, POKUŠAJ SAMO ULICU
    if (!exactAddressFound && addresses.size === 0) {
      const streetOnly = extractStreetName(searchTerm);
      const extractedHouseNumber = extractHouseNumber(searchTerm);
      
      if (streetOnly !== searchTerm && extractedHouseNumber) {
        console.log(`Exact address not found. Trying street only: "${streetOnly}"`);
        
        // Pokušaj pronaći samo ulicu
        const streetSearchTerm = `${streetOnly}, ${locationName}, Croatia`;
        const streetEncodedSearch = encodeURIComponent(streetSearchTerm);
        
        const streetResponse = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${streetEncodedSearch}&addressdetails=1&limit=5&countrycodes=hr&accept-language=hr`,
          {
            headers: {
              'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
            }
          }
        );

        if (streetResponse.ok) {
          const streetData = await streetResponse.json();
          
          if (streetData.length > 0) {
            // Pronašli smo ulicu!
            const streetResult = streetData[0];
            setStreetOnlyCoordinates({
              latitude: parseFloat(streetResult.lat),
              longitude: parseFloat(streetResult.lon)
            });
            setHouseNumber(extractedHouseNumber);
            setStreetName(streetOnly);
            setNeedsManualPositioning(true);
            
            // Dodaj ulicu u rezultate
            addresses.add(streetOnly);
            
            console.log(`Found street "${streetOnly}" but not house number ${extractedHouseNumber}. Enabling manual positioning.`);
            toast.info(`📍 Pronašli smo ${streetOnly}! Odaberite točnu lokaciju za broj ${extractedHouseNumber}`);
          }
        }
      }
    }

    setAvailableAddresses(Array.from(addresses).slice(0, 8));
    
  } catch (error) {
    console.error('Error searching addresses:', error);
    toast.error('Failed to search addresses');
    setAvailableAddresses([]);
  } finally {
    setLoadingAddresses(false);
  }
};

  // ✅ SELECT ADDRESS from dropdown
const handleAddressSelect = async (address: string) => {
  setSelectedAddress(address);
  setAddressSearch(address);
  setShowAddressDropdown(false);

  // DODAJ OVU LOGIKU:
  // Provjeri ako je korisnik prije upisao broj, a sada odabira samo ulicu
  const originalSearch = addressSearch; // "Mlinska ulica 8"
  const selectedStreet = address; // "Mlinska ulica"
  
  const extractedHouseNumber = extractHouseNumber(originalSearch);
  
  if (extractedHouseNumber && originalSearch.includes(selectedStreet)) {
    // Korisnik je htio "Mlinska ulica 8" ali odabrao "Mlinska ulica"
    console.log(`User wanted ${originalSearch} but selected ${selectedStreet}. Enabling manual positioning.`);
    
    try {
      const coords = await geocodingService.getCoordinatesFromAddress(address, locationName);
      if (coords) {
        setStreetOnlyCoordinates(coords);
        setHouseNumber(extractedHouseNumber);
        setStreetName(selectedStreet);
        setNeedsManualPositioning(true);
        toast.info(`📍 Odaberite točnu lokaciju za ${selectedStreet} ${extractedHouseNumber}`);
        return;
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
    }
  }

  // POSTOJEĆI KOD za normalne adrese
  try {
    const coords = await geocodingService.getCoordinatesFromAddress(address, locationName);
    if (coords) {
      setCoordinates(coords);
      console.log('Coordinates found for address:', address, coords);
      toast.success('📍 Address location found!');
    } else {
      toast.warning('Could not find exact coordinates for this address');
    }
  } catch (error) {
    console.error('Error getting coordinates:', error);
  }
};

  // ✅ CLEAR ADDRESS
// MODIFICIRAJ handleClearAddress FUNKCIJU
const handleClearAddress = () => {
  setAddressSearch('');
  setSelectedAddress('');
  setAvailableAddresses([]);
  setShowAddressDropdown(false);
  setCoordinates(null);
  // DODAJ OVE NOVE CLEAR AKCIJE
  setNeedsManualPositioning(false);
  setStreetOnlyCoordinates(null);
  setHouseNumber('');
  setStreetName('');
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
    return !!(selectedFile && formData.year && formData.description && formData.author);
  };

  // Helper function to compress image
  const compressImage = (file: File, maxWidth: number = 1200, quality: number = 0.8): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      if (!ctx) {
        resolve(file);
        return;
      }
      
      img.onload = () => {
        const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        resolve(file);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle file selection with compression
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type.startsWith('image/')) {
        try {
          if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be less than 5MB. Please compress your image.');
            return;
          }

          if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
          }

          const url = URL.createObjectURL(file);
          setPreviewUrl(url);
          
          const compressedFile = await compressImage(file);
          console.log(`Original size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
          console.log(`Compressed size: ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
          
          setSelectedFile(compressedFile);
          
          if (compressedFile.size < file.size) {
            toast.success(`Image compressed from ${(file.size / 1024 / 1024).toFixed(1)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(1)}MB for better upload`);
          }
        } catch (error) {
          console.error('Image compression failed:', error);
          setSelectedFile(file);
        }
      } else {
        toast.error('Please select an image file');
      }
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
      id: Date.now()
    };
    setTaggedPersons(prev => [...prev, tagWithId]);
  };

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
      
      const imageUrl = await photoService.uploadPhotoFile(selectedFile, photoId);
      console.log('File upload successful, creating database record...');
      
      let uploaderName = 'Unknown';
      if (user?.displayName && user.displayName.trim() !== '') {
        uploaderName = user.displayName.trim();
      } else if (user?.email && user.email.trim() !== '') {
        uploaderName = user.email.split('@')[0].trim();
      }

      // ✅ PREPARE COORDINATES AND ADDRESS
      let finalCoordinates = undefined;
      if (coordinates && selectedAddress) {
        finalCoordinates = {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude,
          address: selectedAddress
        };
      }

      const finalPhotoId = await photoService.addPhoto({
        imageUrl: imageUrl,
        imageStoragePath: `photos/${photoId}/${Date.now()}_${selectedFile.name}`,
        year: formData.year,
        description: formData.description,
        detailedDescription: formData.detailedDescription,
        author: formData.author,
        authorId: user.uid,
        location: locationName,
        // ✅ DODAJ COORDINATES
        coordinates: finalCoordinates,
        tags: formData.tags,
        taggedPersons: taggedPersons.map(person => ({
          name: person.name,
          x: person.x,
          y: person.y,
          addedByUid: user.uid,
          isApproved: false
        })),
        uploadedBy: uploaderName,
        uploadedAt: new Date().toISOString()
      });
      
      console.log('Database record created successfully with ID:', finalPhotoId);
      
      if (finalCoordinates) {
        toast.success(`Photo uploaded successfully with location ${selectedAddress}! It will be reviewed and published soon.`);
      } else {
        toast.success(t('upload.success'));
      }
      
      // Reset form
      setSelectedFile(null);
      setTaggedPersons([]);
      setAddressSearch('');
      setSelectedAddress('');
      setAvailableAddresses([]);
      setShowAddressDropdown(false);
      setCoordinates(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl('');
      }
      setFormData({
        year: '',
        description: '',
        detailedDescription: '',
        author: '',
        tags: []
      });

      onSuccess?.();
      
    } catch (error: unknown) {
      console.error('Upload error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code;
      
      if (errorCode === 'storage/unauthorized') {
        toast.error('Upload failed: Storage permissions issue. Please try again.');
      } else if (errorCode === 'storage/quota-exceeded') {
        toast.error('Upload failed: Storage quota exceeded.');
      } else if (errorMessage?.includes('network')) {
        toast.error('Upload failed: Poor internet connection. Please check your connection and try again.');
      } else {
        toast.error(t('upload.error'));
      }
    } finally {
      setUploading(false);
    }
  };

  // Generate year options
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from(
    { length: currentYear - 1899 }, 
    (_, i) => currentYear - i
  );

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          {t('upload.addPhotoTo')} {locationName}
        </CardTitle>
      </CardHeader>
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

          {/* ✅ ADDRESS SEARCH */}
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
        onChange={(e) => handleAddressSearch(e.target.value)}
        className={`pl-10 ${loadingAddresses ? 'pr-10' : selectedAddress ? 'pr-10' : ''}`}
      />
      {loadingAddresses && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}
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

    {/* POSTOJEĆI DROPDOWN S ADRESAMA - bez promjena */}
    {showAddressDropdown && (
      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
        {loadingAddresses ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-sm text-gray-600">Searching for addresses...</span>
          </div>
        ) : availableAddresses.length > 0 ? (
          <div>
            <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b border-gray-200">
              Found {availableAddresses.length} address{availableAddresses.length !== 1 ? 'es' : ''}
            </div>
            {availableAddresses.map((address, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleAddressSelect(address)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 hover:text-blue-700 text-sm border-b border-gray-100 last:border-b-0 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <MapPin className="h-3 w-3 text-gray-400" />
                  <span className="font-medium">{address}</span>
                </div>
              </button>
            ))}
          </div>
        ) : addressSearch.length >= 2 ? (
          <div className="px-4 py-4 text-sm text-gray-500 text-center">
            <MapPin className="h-4 w-4 mx-auto mb-2 text-gray-400" />
            No addresses found for "<span className="font-medium">{addressSearch}</span>"
            <div className="text-xs text-gray-400 mt-1">{t('upload.trySearching')}: "Školska", "Glavni trg", "Crkva"</div>
          </div>
        ) : null}
      </div>
    )}
  </div>

{/* NOVI: MANUAL POSITIONING SEKCIJA */}
{needsManualPositioning && streetOnlyCoordinates && (
  <div className="mt-4 p-4 border border-blue-200 rounded-lg bg-blue-50">
    <div className="flex items-start gap-3 mb-3">
      <div className="p-1 bg-blue-600 text-white rounded">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-blue-800 mb-1">
          📍 {streetName} pronađena! Odaberite točnu lokaciju za broj {houseNumber}
        </h4>
        <p className="text-sm text-blue-700">
          Kliknite na kartu gdje se točno nalazi ova fotografija
        </p>
      </div>
    </div>
    
    <div className="rounded-lg overflow-hidden border border-blue-300">
      <SimpleMiniMap
        center={streetOnlyCoordinates}
        onLocationSelect={(coords) => {
          setCoordinates(coords);
          setSelectedAddress(`${streetName} ${houseNumber}`);
          // VAŽNO: Postavi input field na punu adresu
          setAddressSearch(`${streetName} ${houseNumber}`);
          setNeedsManualPositioning(false);
          setShowAddressDropdown(false);
          toast.success(`📍 Lokacija postavljena za ${streetName} ${houseNumber}!`);
        }}
      />
    </div>
    
    <div className="mt-2 text-xs text-blue-600">
      💡 Tip: Zoom in za veću točnost. Marker će se pojaviti gdje kliknete.
    </div>
  </div>
)}

{/* NOVI: POTVRDA ODABRANE LOKACIJE */}
{coordinates && selectedAddress && !needsManualPositioning && (
  <div className="mt-4 p-4 border border-green-200 rounded-lg bg-green-50">
    <div className="flex items-start gap-3 mb-3">
      <div className="p-1 bg-green-600 text-white rounded">
        <MapPin className="h-4 w-4" />
      </div>
      <div className="flex-1">
        <h4 className="font-medium text-green-800 mb-1">
          ✅ Lokacija postavljena: {selectedAddress}
        </h4>
        <p className="text-sm text-green-700">
          Koordinate: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
        </p>
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => {
          setNeedsManualPositioning(true);
          setCoordinates(null);
        }}
        className="text-green-700 hover:text-green-800 text-xs"
      >
        Promijeni
      </Button>
    </div>
    
    {/* MINI PRIKAZ KARTE S ODABRANIM MJESTOM */}
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
      📍 Odabrana lokacija za fotografiju
    </div>
  </div>
)}

{/* STARI COORDINATES DISPLAY - ukloni ili prilagodi */}
{coordinates && !selectedAddress && (
  <div className="mt-2 flex items-center gap-2 text-xs text-green-600 bg-green-50 p-2 rounded">
    <MapPin className="h-3 w-3" />
    <span>📍 Location found: {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}</span>
  </div>
)}

  <div className="mt-1 text-xs text-gray-500">
    {t('upload.trySearching')}: "Školska", "Glavni trg", "Crkva", "Mlinska", etc.
  </div>
</div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Year */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                {t('upload.year')} *
              </label>
              <select
                value={formData.year}
                onChange={(e) => setFormData(prev => ({...prev, year: e.target.value}))}
                className="w-full px-3 py-2 border border-input bg-background rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                required
              >
                <option value="" disabled hidden>{t('upload.selectYear')}</option>
                {yearOptions.map((year) => (
                  <option key={year} value={year.toString()}>
                    {year}
                  </option>
                ))}
              </select>
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
              onChange={(e) => setFormData({...formData, detailedDescription: e.target.value})}
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