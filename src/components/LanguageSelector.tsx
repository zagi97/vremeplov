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
import 'flag-icons/css/flag-icons.min.css';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  // Language names based on current language
  const languageNames = {
    hr: {
      hr: 'Hrvatski',
      en: 'Engleski'
    },
    en: {
      hr: 'Croatian',
      en: 'English'
    }
  };

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
      <DropdownMenuContent align="end" className="min-w-[160px] z-[100001]">
        <DropdownMenuItem
          onClick={() => setLanguage('hr')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="fi fi-hr"></span>
          <span>{languageNames[language as 'hr' | 'en'].hr}</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setLanguage('en')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="fi fi-gb"></span>
          <span>{languageNames[language as 'hr' | 'en'].en}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSelector;
