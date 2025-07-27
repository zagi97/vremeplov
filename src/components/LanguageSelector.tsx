import React from 'react';
import { Button } from "@/components/ui/button";
import { useLanguage, Language } from '../contexts/LanguageContext';
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
      className="flex items-center gap-2 text-sm text-white hover:text-gray-200 hover:bg-white/10 border border-white/20"
      aria-label={`Switch to ${language === 'en' ? 'Croatian' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-medium">
        {language === 'en' ? 'HR' : 'EN'}
      </span>
    </Button>
  );
};

export default LanguageSelector;