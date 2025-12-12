import React from 'react';
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from '../contexts/LanguageContext';
import { Globe, ChevronDown } from 'lucide-react';

// Flag SVG Components
const CroatiaFlag = () => (
  <svg width="20" height="15" viewBox="0 0 21 15" xmlns="http://www.w3.org/2000/svg">
    <rect width="21" height="5" fill="#FF0000"/>
    <rect y="5" width="21" height="5" fill="#FFFFFF"/>
    <rect y="10" width="21" height="5" fill="#0000FF"/>
  </svg>
);

const UKFlag = () => (
  <svg width="20" height="15" viewBox="0 0 60 30" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="t">
      <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/>
    </clipPath>
    <path d="M0,0 v30 h60 v-30 z" fill="#012169"/>
    <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6"/>
    <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#t)" stroke="#C8102E" strokeWidth="4"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10"/>
    <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6"/>
  </svg>
);

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="flex items-center gap-1.5 text-xs sm:text-sm text-white hover:text-gray-200 hover:bg-white/10 border border-white/20 px-2 sm:px-3 py-1 transition-all"
          aria-label="Select language"
        >
          <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          <span className="font-medium text-[10px] sm:text-sm">
            {language.toUpperCase()}
          </span>
          <ChevronDown className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          onClick={() => setLanguage('hr')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <CroatiaFlag />
          <span>Hrvatski</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <UKFlag />
          <span>English</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;