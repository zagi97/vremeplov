import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationMap } from '../locales';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

// Helper function for string interpolation
export const translateWithParams = (
  t: (key: string) => string,
  key: string,
  params: Record<string, string | number>
) => {
  let translation = t(key);
  Object.entries(params).forEach(([param, value]) => {
    translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
  });
  return translation;
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, default to Croatian (primary target audience)
    const saved = localStorage.getItem('language') as Language;
    if (saved) return saved;

    // Default to Croatian - users can manually switch to English if needed
    return 'hr';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([param, value]) => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), String(value));
      });
    }
    return translation;
  };

  const value = {
    language,
    setLanguage,
    t,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

// Re-export types for convenience
export type { Language };
