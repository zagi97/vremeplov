import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react"; // Možeš ukloniti ChevronDown
import { useNavigate } from "react-router-dom";
// Ukloni import VALID_LOCATIONS
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
import municipalityData from '../../data/municipalities.json'; // Provjeri putanju!

// Izvuci samo imena gradova i općina iz JSON-a
const allLocations: string[] = municipalityData.records.map(record => record[3] as string);

const SearchBar = () => {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && isValid) {
      navigate(`/location/${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Filtriranje lokacija na temelju unosa korisnika
  const filteredLocations = allLocations.filter((location: string) =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectLocation = (location: string) => {
    setSearchQuery(location);
    setIsValid(true); // Budući da je lokacija odabrana iz liste, uvijek je validna
    setOpen(false);
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    // Provjeri je li unos točan naziv lokacije iz liste
    const isValidLocation = allLocations.includes(value);
    setIsValid(isValidLocation);
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
              onChange={(e) => handleInputChange(e.target.value)}
              onClick={() => setOpen(true)}
              style={{
                backgroundColor: '#ffffff',
                color: '#1f2937'
              }}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
          <Command>
            <CommandInput
              placeholder={t('search.inputPlaceholder')}
              value={searchQuery}
              onValueChange={handleInputChange}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{t('search.noLocations')}</CommandEmpty>
              <CommandGroup>
                {filteredLocations.map((location) => (
                  <CommandItem
                    key={location}
                    onSelect={() => selectLocation(location)}
                    className="cursor-pointer text-gray-900 hover:bg-gray-100"
                  >
                    {location}
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