import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'hr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
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

// Translation object
type TranslationMap = { [key: string]: string };

const translations: Record<Language, TranslationMap> = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.dashboard': 'Dashboard',
    'nav.login': 'Login',
    'nav.logout': 'Logout',
    'nav.admin': 'Admin',
    
    // Home page
    'home.title': 'Croatian Historical Photos',
    'home.subtitle': 'Preserve and share Croatia\'s rich photographic heritage',
    'home.description': 'Discover historical photographs from across Croatia. Share your own family photos and help preserve our cultural memory for future generations.',
    'home.upload': 'Upload Photo',
    'home.explore': 'Explore Gallery',
    'home.recent': 'Recent Photos',
    
    // Upload
    'upload.title': 'Share Historical Photo',
    'upload.select': 'Select Photo',
    'upload.drag': 'Drag and drop your photo here, or click to select',
    'upload.year': 'Year',
    'upload.author': 'Author/Photographer',
    'upload.description': 'Short Description',
    'upload.story': 'Detailed Story',
    'upload.submit': 'Upload Photo',
    'upload.cancel': 'Cancel',
    'upload.success': 'Photo uploaded successfully!',
    'upload.error': 'Failed to upload photo',
    'upload.offline': 'You are offline',
    'upload.tagPerson': 'Tag Person',
    'upload.enterName': 'Enter person\'s name',
    'upload.saveTag': 'Save Tag',
    'upload.cancelTag': 'Cancel',
    
    // Gallery
    'gallery.noPhotos': 'No photos yet',
    'gallery.noPhotosDesc': 'Be the first to share a historical photo and help preserve Croatian heritage!',
    'gallery.loading': 'Loading photos...',
    
    // Photo detail
    'photo.year': 'Year',
    'photo.author': 'Author',
    'photo.location': 'Location',
    'photo.story': 'Story',
    'photo.taggedPeople': 'Tagged People',
    'photo.comments': 'Comments',
    'photo.addComment': 'Add Comment',
    
    // Auth
    'auth.signInGoogle': 'Sign in with Google',
    'auth.signOut': 'Sign Out',
    'auth.signInSuccess': 'Successfully signed in!',
    'auth.signOutSuccess': 'Successfully signed out!',
    'auth.adminLogin': 'Admin Login',
    'auth.email': 'Email',
    'auth.password': 'Password',
    
    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.required': 'Required',
    'common.optional': 'Optional',
    
    // Footer
    'footer.about': 'About',
    'footer.contact': 'Contact',
    'footer.privacy': 'Privacy Policy',
    'footer.terms': 'Terms of Service',
    'footer.rights': 'All rights reserved',
  },
  hr: {
    // Navigation
    'nav.home': 'Početna',
    'nav.about': 'O nama',
    'nav.contact': 'Kontakt',
    'nav.dashboard': 'Kontrolna ploča',
    'nav.login': 'Prijava',
    'nav.logout': 'Odjava',
    'nav.admin': 'Admin',
    
    // Home page
    'home.title': 'Hrvatske povijesne fotografije',
    'home.subtitle': 'Sačuvajte i podijelite bogatu fotografsku baštinu Hrvatske',
    'home.description': 'Otkrijte povijesne fotografije iz cijele Hrvatske. Podijelite svoje obiteljske fotografije i pomozite sačuvati našu kulturnu memoriju za buduće generacije.',
    'home.upload': 'Učitaj fotografiju',
    'home.explore': 'Istraži galeriju',
    'home.recent': 'Nedavne fotografije',
    
    // Upload
    'upload.title': 'Podijeli povijesnu fotografiju',
    'upload.select': 'Odaberi fotografiju',
    'upload.drag': 'Povuci i spusti fotografiju ovdje ili klikni za odabir',
    'upload.year': 'Godina',
    'upload.author': 'Autor/Fotograf',
    'upload.description': 'Kratki opis',
    'upload.story': 'Detaljna priča',
    'upload.submit': 'Učitaj fotografiju',
    'upload.cancel': 'Odustani',
    'upload.success': 'Fotografija je uspješno učitana!',
    'upload.error': 'Neuspješno učitavanje fotografije',
    'upload.offline': 'Niste povezani s internetom',
    'upload.tagPerson': 'Označi osobu',
    'upload.enterName': 'Unesite ime osobe',
    'upload.saveTag': 'Spremi oznaku',
    'upload.cancelTag': 'Odustani',
    
    // Gallery
    'gallery.noPhotos': 'Nema fotografija',
    'gallery.noPhotosDesc': 'Budite prvi koji će podijeliti povijesnu fotografiju i pomoći sačuvati hrvatsku baštinu!',
    'gallery.loading': 'Učitavanje fotografija...',
    
    // Photo detail
    'photo.year': 'Godina',
    'photo.author': 'Autor',
    'photo.location': 'Lokacija',
    'photo.story': 'Priča',
    'photo.taggedPeople': 'Označene osobe',
    'photo.comments': 'Komentari',
    'photo.addComment': 'Dodaj komentar',
    
    // Auth
    'auth.signInGoogle': 'Prijavite se s Googleom',
    'auth.signOut': 'Odjava',
    'auth.signInSuccess': 'Uspješno ste se prijavili!',
    'auth.signOutSuccess': 'Uspješno ste se odjavili!',
    'auth.adminLogin': 'Admin prijava',
    'auth.email': 'Email',
    'auth.password': 'Lozinka',
    
    // Common
    'common.save': 'Spremi',
    'common.cancel': 'Odustani',
    'common.edit': 'Uredi',
    'common.delete': 'Obriši',
    'common.loading': 'Učitavanje...',
    'common.error': 'Greška',
    'common.success': 'Uspjeh',
    'common.required': 'Obavezno',
    'common.optional': 'Neobavezno',
    
    // Footer
    'footer.about': 'O nama',
    'footer.contact': 'Kontakt',
    'footer.privacy': 'Pravila privatnosti',
    'footer.terms': 'Uvjeti korištenja',
    'footer.rights': 'Sva prava pridržana',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Check localStorage first, then browser language, fallback to English
    const saved = localStorage.getItem('language') as Language;
    if (saved) return saved;
    
    const browserLang = navigator.language.toLowerCase();
    return browserLang.startsWith('hr') ? 'hr' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};