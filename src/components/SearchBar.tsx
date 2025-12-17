import React, { useState, useRef, useEffect } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { loadMunicipalities, type Location } from '../utils/municipalityLoader';

const SearchBar = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const navigate = useNavigate();
  
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  
  const containerRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && allLocations.length === 0 && !loading) {
      setLoading(true);
      loadMunicipalities()
        .then(setAllLocations)
        .finally(() => setLoading(false));
    }
  }, [open, allLocations.length, loading]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && isValid && selectedLocation) {
      navigate(`/location/${encodeURIComponent(selectedLocation.urlKey)}`);
    }
  };

  const filteredLocations = allLocations
    .filter((location: Location) =>
      location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.displayName.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => a.displayName.localeCompare(b.displayName, 'hr'));

  const selectLocation = (location: Location) => {
    setSearchQuery(location.displayName);
    setSelectedLocation(location);
    setIsValid(true);
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    if (value.trim()) {
      setOpen(true);
    }
    
    const matchingLocation = allLocations.find(location => 
      location.name === value || location.displayName === value
    );
    
    setSelectedLocation(matchingLocation || null);
    setIsValid(!!matchingLocation);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      if (
        containerRef.current && 
        !containerRef.current.contains(target) &&
        !document.querySelector('[role="dialog"]')?.contains(target)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <form ref={containerRef} onSubmit={handleSearch} className="relative flex w-full max-w-lg">
      <Popover
        open={open}
        onOpenChange={(newOpen: boolean) => {
          if (newOpen) {
            setOpen(true);
          }
        }}
      >
        <PopoverTrigger asChild>
          {/* ✅ FIX 1: Remove type="button" from div, use proper role */}
          <div className="flex-grow" role="combobox" aria-expanded={open} aria-haspopup="listbox">
            <Input
              ref={inputRef}
              type="text"
              placeholder={t('search.placeholder')}
              className="search-input pr-10 rounded-r-none h-10 md:h-12 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 border-r-0 focus-visible:ring-0 focus-visible:ring-offset-0 dark:focus:border-gray-600 shadow-sm dark:border-gray-600"
              value={searchQuery}
              onChange={(e) => {
                handleInputChange(e.target.value);
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setOpen(true);
                }
              }}
              aria-label={t('search.placeholder')}
              aria-controls="location-listbox"
            />
          </div>
        </PopoverTrigger>
        <PopoverContent
          className="p-0 w-[300px] md:w-[400px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          align="start"
          onOpenAutoFocus={(e: { preventDefault: () => any; }) => e.preventDefault()}
          onEscapeKeyDown={(e: { preventDefault: () => void; }) => {
            e.preventDefault();
            setOpen(false);
          }}
          onPointerDownOutside={(e: { preventDefault: () => void; }) => {
            e.preventDefault();
          }}
          onFocusOutside={(e: { preventDefault: () => void; }) => {
            e.preventDefault();
          }}
          onInteractOutside={(e: { preventDefault: () => void; }) => {
            e.preventDefault();
          }}
        >
          <Command shouldFilter={false}>
            <CommandList id="location-listbox" role="listbox">
              {loading ? (
                <CommandEmpty className="py-6 text-center text-gray-600 dark:text-gray-300">{t('common.loading')}</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty className="py-6 text-center text-gray-600 dark:text-gray-300">{t('search.noLocations')}</CommandEmpty>
                  <CommandGroup>
                    {filteredLocations.map((location) => (
                      <CommandItem
                        key={`${location.id}-${location.name}`}
                        onSelect={() => selectLocation(location)}
                        className="cursor-pointer text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                        onMouseDown={(e: { preventDefault: () => any; }) => e.preventDefault()}
                        role="option"
                        aria-selected={selectedLocation?.id === location.id}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{location.name}</span>
                          {location.displayName !== location.name && (
                            <span className="text-sm text-gray-500 dark:text-gray-400">{location.county.replace(/^[IVX]+\s/, '')}</span>
                          )}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {/* ✅ FIX 2: Add aria-label to button */}
      <Button
        type="submit"
        className="rounded-l-none h-10 md:h-12 px-3 md:px-4 bg-blue-600 hover:bg-blue-700 text-white"
        disabled={!isValid || !searchQuery.trim()}
        aria-label={t('search.button') || 'Search photos'}
      >
        <Search className="h-5 w-5" aria-hidden="true" />
        <span className="ml-2 hidden md:inline">{t('search.button')}</span>
      </Button>
    </form>
  );
};

export default SearchBar;