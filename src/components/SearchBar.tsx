import React, { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { VALID_LOCATIONS } from "../constants/locations";
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


/* // Temporary sample data - replace with API data later
const sampleLocations = [
  "Zagreb", "Split", "Rijeka", "Osijek", "Zadar", 
  "Pula", "Slavonski Brod", "Karlovac", "Varaždin", 
  "Šibenik", "Dubrovnik", "Vinkovci", "Čakovec", 
  "Vukovar", "Koprivnica", "Požega", "Đakovo", 
  "Virovitica", "Samobor", "Čačinci", "Metković"
].sort(); */

const SearchBar = () => {
   const { t } = useLanguage(); // 🆕 DODAJ
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

  const filteredLocations = VALID_LOCATIONS.filter(location =>
    location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectLocation = (location: string) => {
     // Only allow selection of "Čačinci"
    if (location === "Čačinci") {
      setSearchQuery(location);
      setIsValid(true);
      setOpen(false);
    }
  };

  const handleInputChange = (value: string) => {
    setSearchQuery(value);
    // Check if the entered value exactly matches a valid location
    const isValidLocation = VALID_LOCATIONS.includes(value) && value === "Čačinci";
    setIsValid(isValidLocation);
    // When user types manually, they need to select from dropdown
    /* setIsValid(false); */
  };

return (
    <form onSubmit={handleSearch} className="relative flex w-full max-w-lg">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="flex-grow">
            <Input
              type="text"
              placeholder={t('search.placeholder')} // 🆕 ZAMIJENI
              className="pr-10 rounded-r-none h-12 bg-white/90 backdrop-blur-sm border-r-0 focus-visible:ring-offset-0"
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onClick={() => setOpen(true)}
            />
          </div>
        </PopoverTrigger>
        <PopoverContent className="p-0 w-[300px] md:w-[400px]" align="start">
          <Command>
            <CommandInput 
              placeholder={t('search.inputPlaceholder')} // 🆕 ZAMIJENI
              value={searchQuery}
              onValueChange={handleInputChange}
              className="h-9"
            />
            <CommandList>
              <CommandEmpty>{t('search.noLocations')}</CommandEmpty> {/* 🆕 ZAMIJENI */}
              <CommandGroup>
                {filteredLocations.map((location) => {
                  const isEnabled = location === "Čačinci";
                  return (
                    <CommandItem
                      key={location}
                      onSelect={() => selectLocation(location)}
                      disabled={!isEnabled}
                      className={`cursor-pointer ${
                        isEnabled 
                          ? "text-gray-900 hover:bg-gray-100" 
                          : "text-gray-400 cursor-not-allowed opacity-50"
                      }`}
                    >
                      {location}
                    </CommandItem>
                  );
                })}
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
        <span className="ml-2 hidden md:inline">{t('search.button')}</span> {/* 🆕 ZAMIJENI */}
      </Button>
    </form>
  );
};

export default SearchBar;