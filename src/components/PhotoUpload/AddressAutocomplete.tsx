// src/components/PhotoUpload/AddressAutocomplete.tsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { toast } from 'sonner';
import { useDebounce } from '@/hooks/useDebounce';
import { searchCache, extractHouseNumber } from '@/utils/photoUploadHelpers';
import { translateWithParams } from '@/contexts/LanguageContext';

interface AddressAutocompleteProps {
  locationName: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect: (address: string, coordinates: { latitude: number; longitude: number } | null) => void;
  onManualPositioning: (streetCoords: { latitude: number; longitude: number }, streetName: string, houseNumber: string, fullAddress: string) => void;
  placeholder?: string;
  t: (key: string) => string;
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({
  locationName,
  value,
  onChange,
  onAddressSelect,
  onManualPositioning,
  placeholder,
  t
}) => {
  const [availableAddresses, setAvailableAddresses] = useState<string[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const debouncedSearchTerm = useDebounce(value, 500);
  const currentRequestRef = useRef<AbortController | null>(null);
  const isSelectingAddressRef = useRef(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Helper function
  const extractStreetName = (fullAddress: string): string => {
    return fullAddress.replace(/\d+.*$/, '').trim();
  };

  const closeDropdown = () => {
    setShowDropdown(false);
    setLoadingAddresses(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  // Search addresses function
  const searchAddresses = useCallback(async (searchTerm: string) => {
    // Check cache first
    const cacheKey = `${searchTerm}_${locationName}`;
    if (searchCache.has(cacheKey)) {
      console.log('📋 Using cached results for:', searchTerm);
      const cachedResults = searchCache.get(cacheKey);
      setAvailableAddresses(cachedResults || []);
      setLoadingAddresses(false);
      setShowDropdown(true);
      return;
    }

    setLoadingAddresses(true);
    setShowDropdown(true);

    try {
      // Cancel previous request if still running
      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
      }

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

      if (abortController.signal.aborted) return;

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
            const streetCoords = {
              latitude: parseFloat(streetResult.lat),
              longitude: parseFloat(streetResult.lon)
            };

            addresses.add(`${streetOnly} (kliknite za broj ${extractedHouseNumber})`);
            console.log(`Found street "${streetOnly}". Manual positioning ready.`);

            // Trigger manual positioning
            const fullAddress = `${streetOnly} ${extractedHouseNumber}`;
            onManualPositioning(streetCoords, streetOnly, extractedHouseNumber, fullAddress);
            closeDropdown();

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

      // Save to cache
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
  }, [locationName, onManualPositioning, t]);

  // Trigger search when debounced term changes
  useEffect(() => {
    if (isSelectingAddressRef.current) {
      console.log('🚫 Skipping search - address being selected');
      isSelectingAddressRef.current = false;
      return;
    }

    if (debouncedSearchTerm.length >= 2) {
      console.log('🚀 Starting search for:', debouncedSearchTerm);
      searchAddresses(debouncedSearchTerm);
    } else {
      setAvailableAddresses([]);
      setShowDropdown(false);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    isSelectingAddressRef.current = false;
    onChange(newValue);

    if (newValue.length >= 2 && !loadingAddresses) {
      setLoadingAddresses(true);
      setShowDropdown(true);
    }

    if (newValue.length < 2) {
      setShowDropdown(false);
      setLoadingAddresses(false);
      setAvailableAddresses([]);

      if (currentRequestRef.current) {
        currentRequestRef.current.abort();
        currentRequestRef.current = null;
      }
    }
  };

  const handleInputFocus = () => {
    if (value.length > 0 && availableAddresses.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleSelect = async (address: string) => {
    console.log('📍 Address selected:', address);
    isSelectingAddressRef.current = true;
    closeDropdown();

    if (address.includes('(kliknite za broj')) {
      return;
    }

    onChange(address);

    try {
      const fullSearchTerm = `${address}, ${locationName}, Croatia`;
      const encodedSearch = encodeURIComponent(fullSearchTerm);

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodedSearch}&addressdetails=1&limit=1&countrycodes=hr&accept-language=hr`,
        {
          headers: {
            'User-Agent': 'Vremeplov.hr (vremeplov.app@gmail.com)'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();

        if (data && data.length > 0) {
          const result = data[0];
          const coords = {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };

          onAddressSelect(address, coords);
          console.log('✅ Coordinates found:', coords);
        } else {
          onAddressSelect(address, null);
          console.warn('No coordinates found for address');
        }
      }
    } catch (error) {
      console.error('Error getting coordinates:', error);
      onAddressSelect(address, null);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          type="text"
          placeholder={placeholder || t('upload.searchAddress')}
          value={value}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          className="pl-10"
        />
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {loadingAddresses && (
            <div className="p-3 text-sm text-gray-500 text-center">
              {t('upload.searchingAddresses')}
            </div>
          )}

          {!loadingAddresses && availableAddresses.length === 0 && value.length >= 2 && (
            <div className="p-3 text-sm text-gray-500 text-center">
              {t('upload.noAddressesFound')}
            </div>
          )}

          {!loadingAddresses && availableAddresses.map((address, index) => (
            <div
              key={index}
              onClick={() => handleSelect(address)}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer text-sm border-b last:border-b-0"
            >
              {address}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
