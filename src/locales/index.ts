import { enTranslations, hrTranslations } from './translations';

export type Language = 'en' | 'hr';

export type TranslationMap = { [key: string]: string };

export const translations: Record<Language, TranslationMap> = {
  en: enTranslations as TranslationMap,
  hr: hrTranslations as TranslationMap,
};
