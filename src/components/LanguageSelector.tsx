import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hr' : 'en');
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleLanguage}
      className="flex items-center gap-1 text-xs sm:text-sm text-white hover:text-gray-200 hover:bg-white/10 border border-white/20 px-2 sm:px-3 py-1"
      aria-label={`Switch to ${language === 'en' ? 'Croatian' : 'English'}`}
    >
      <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      <span className="font-medium text-[10px] sm:text-sm">
        {language === 'en' ? 'HR' : 'EN'}
      </span>
    </Button>
  );
};

export default LanguageSelector;