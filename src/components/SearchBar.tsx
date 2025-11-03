import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput, // Ovo je ključni element
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
  // Više ne koristimo inputRef za gornje polje, CommandInput ga interno koristi
  // const inputRef = useRef<HTMLInputElement>(null); 

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

  const filteredLocations = allLocations.filter((location: Location) =>
    location.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    location.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    } else {
      setOpen(false); // Zatvori popover ako je prazan unos
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
        onOpenChange={setOpen} // Koristi standardni setOpen iz useState
      >
        <PopoverTrigger asChild>
          {/* ✅ PROMJENA 1: Koristimo samo CommandInput umjesto Input-a u Triggeru */}
          <CommandInput
            placeholder={t('search.placeholder')}
            value={searchQuery}
            onValueChange={handleInputChange}
            onFocus={() => {
              if (searchQuery.trim()) {
                setOpen(true);
              }
            }}
            // ✅ PROMJENA 2: Stilovi da CommandInput izgleda kao glavni search bar
            className="search-input pr-10 rounded-r-none h-12 bg-white text-gray-900 placeholder:text-gray-500 border-r-0 focus-visible:ring-offset-0 shadow-sm"
            style={{
              backgroundColor: '#ffffff',
              color: '#1f2937'
            }}
            aria-label={t('search.placeholder')}
          />
        </PopoverTrigger>
        <PopoverContent 
          // Postavi istu širinu kao trigger da bi se slagalo
          className="p-0 w-[calc(100%-80px)] md:w-[calc(100%-100px)] z-50" 
          align="start"
          // Ovdje su potrebne prilagodbe za Popover, ali ostavljam vaše postojeće
          onOpenAutoFocus={(e: { preventDefault: () => any; }) => e.preventDefault()}
          onEscapeKeyDown={(e: { preventDefault: () => void; }) => {
            e.preventDefault();
            setOpen(false);
          }}
          onPointerDownOutside={(e: { preventDefault: () => void; }) => {
            // Nemojte preventDefault na pointer down outside ako želite da se zatvori
            // e.preventDefault();
          }}
          onFocusOutside={(e: { preventDefault: () => void; }) => {
            // Nemojte preventDefault na focus outside ako želite da se zatvori
            // e.preventDefault();
          }}
          onInteractOutside={() => {
            setOpen(false); // Zatvori popover kada se klikne vani
          }}
        >
          <Command shouldFilter={false}>
            {/* ✅ PROMJENA 3: Uklonili smo CommandInput iz Command bloka! */}
            <CommandList id="location-listbox" role="listbox">
              {loading ? (
                <CommandEmpty className="py-2">{t('common.loading')}</CommandEmpty>
              ) : (
                <>
                  <CommandEmpty className="py-2">{t('search.noLocations')}</CommandEmpty>
                  <CommandGroup>
                    {filteredLocations.map((location) => (
                      <CommandItem
                        key={`${location.id}-${location.name}`}
                        onSelect={() => selectLocation(location)}
                        className="cursor-pointer text-gray-900 hover:bg-gray-100"
                        onMouseDown={(e: { preventDefault: () => any; }) => e.preventDefault()}
                        role="option"
                        aria-selected={selectedLocation?.id === location.id}
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{location.name}</span>
                          {location.displayName !== location.name && (
                            <span className="text-sm text-gray-500">{location.county.replace(/^[IVX]+\s/, '')}</span>
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
      {/* Dugme ostaje isto */}
      <Button
        type="submit"
        className="rounded-l-none h-12 px-4 bg-blue-600 hover:bg-blue-700"
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