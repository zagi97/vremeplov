import enTranslations from './en.json';
import hrTranslations from './hr.json';

export type Language = 'en' | 'hr';

export type TranslationMap = { [key: string]: string };

export const translations: Record<Language, TranslationMap> = {
  en: enTranslations,
  hr: hrTranslations,
};
