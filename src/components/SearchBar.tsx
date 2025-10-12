import React, { useState } from 'react';
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
import municipalityData from '../../data/municipalities.json';

// Tip za lokaciju s dodatnim podacima
interface Location {
  id: number;
  county: string;
  type: string;
  name: string;
  displayName: string;
  // ✅ DODAJ UNIQUE KEY ZA URL
  urlKey: string; // npr: "Privlaka-Zadarska" ili samo "Zagreb"
}

// Kreiraj array lokacija s jedinstvenim display nazivima
const allLocations: Location[] = municipalityData.records.map(record => {
  const id = record[0] as number;
  const county = record[1] as string;
  const type = record[2] as string;
  const name = record[3] as string;
  
  return {
    id,
    county,
    type,
    name,
    displayName: name,
    urlKey: name // zasad samo naziv
  };
});

// Pronađi duplikate i dodaj im županiju u naziv
const nameCounts = new Map<string, number>();
allLocations.forEach(location => {
  nameCounts.set(location.name, (nameCounts.get(location.name) || 0) + 1);
});

// ✅ AŽURIRAJ displayName i urlKey za duplikate
allLocations.forEach(location => {
  if (nameCounts.get(location.name)! > 1) {
    // Skrati naziv županije
    const countyShort = location.county
      .replace(/^[IVX]+\s/, '')
      .replace('DUBROVAČKO-NERETVANSKA', 'Dubrovačko-neretvanska')
      .replace('SPLITSKO-DALMATINSKA', 'Splitsko-dalmatinska')
      .replace('OSJEČKO-BARANJSKA', 'Osječko-baranjska')
      .replace('VUKOVARSKO-SRIJEMSKA', 'Vukovarsko-srijemska')
      .replace('POŽEŠKO-SLAVONSKA', 'Požeško-slavonska')
      .replace('BRODSKO-POSAVSKA', 'Brodsko-posavska')
      .replace('VIROVITIČKO-PODRAVSKA', 'Virovitičko-podravska')
      .replace('KOPRIVNIČKO-KRIŽEVAČKA', 'Koprivničko-križevačka')
      .replace('BJELOVARSKO-BILOGORSKA', 'Bjelovarsko-bilogorska')
      .replace('PRIMORSKO-GORANSKA', 'Primorsko-goranska')
      .replace('SISAČKO-MOSLAVAČKA', 'Sisačko-moslavačka')
      .replace('KRAPINSKO-ZAGORSKA', 'Krapinsko-zagorska')
      .replace('ŠIBENSKO-KNINSKA', 'Šibensko-kninska')
      .replace('LIČKO-SENJSKA', 'Ličko-senjska')
      .replace('KARLOVAČKA', 'Karlovačka')
      .replace('VARAŽDINSKA', 'Varaždinska')
      .replace('ZAGREBAČKA', 'Zagrebačka')
      .replace('MEĐIMURSKA', 'Međimurska')
      .replace('ISTARSKA', 'Istarska')
      .replace('ZADARSKA', 'Zadarska')
      .replace('GRAD ZAGREB', 'Zagreb');
    
    location.displayName = `${location.name} (${countyShort})`;
    // ✅ KLJUČNI DIO: urlKey s nazivom i županijom
    location.urlKey = `${location.name}-${countyShort.replace(/\s+/g, '')}`;
  }
});

const SearchBar = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && isValid && selectedLocation) {
      navigate(`/location/${encodeURIComponent(selectedLocation.urlKey)}`);
    }
  };

  // Filtriranje lokacija na temelju unosa korisnika
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

  // ✅ ISPRAVLJENO: Jednostavnija logika
  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    
    // Automatski otvori dropdown ako ima teksta
    if (value.trim()) {
      setOpen(true);
    }
    
    // Provjeri je li unos točan naziv lokacije
    const matchingLocation = allLocations.find(location => 
      location.name === value || location.displayName === value
    );
    
    setSelectedLocation(matchingLocation || null);
    setIsValid(!!matchingLocation);
  };

  return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-lg">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-grow">
            <Input
              type="text"
              placeholder={t('search.placeholder')}
              className="search-input pr-10 rounded-r-none h-12 bg-white text-gray-900 placeholder:text-gray-500 border-r-0 focus-visible:ring-offset-0 shadow-sm"
              value={searchQuery}
              onChange={(e) => {
                handleInputChange(e.target.value);
                setOpen(true); // ✅ KLJUČNO: Uvijek otvori dropdown na promjenu
              }}
              onFocus={() => {
                if (searchQuery.trim()) {
                  setOpen(true); // ✅ Otvori i pri fokusu ako ima teksta
                }
              }}
              style={{
                backgroundColor: '#ffffff',
                color: '#1f2937'
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
          <Command shouldFilter={false}> {/* ✅ KLJUČNO: Disable default filtering */}
            <CommandInput
              placeholder={t('search.inputPlaceholder')}
              value={searchQuery}
              onValueChange={(value) => {
                handleInputChange(value);
              }}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{t('search.noLocations')}</CommandEmpty>
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={`${location.id}-${location.name}`}
                    onSelect={() => selectLocation(location)}
                    className="cursor-pointer text-gray-900 hover:bg-gray-100"
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
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button
        type="submit"
        className="rounded-l-none h-12 px-4 bg-blue-600 hover:bg-blue-700"
        disabled={!isValid || !searchQuery.trim()}
      >
        <Search className="h-5 w-5" />
        <span className="ml-2 hidden md:inline">{t('search.button')}</span>
      </Button>
    </form>
  );
};

export default SearchBar;