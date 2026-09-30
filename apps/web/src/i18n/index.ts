import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import en from './locales/en.json';
import ru from './locales/ru.json';
import uzLatn from './locales/uz-Latn.json';
import uzCyrl from './locales/uz-Cyrl.json';

// TT §5: EN / RU / O'Z (Latin) / ЎЗ (Cyrillic) — four selectable variants,
// Uzbek counted twice for its two scripts. Machine-translated for RU/UZ
// beyond the English source; flagged for native review before launch.
export const SUPPORTED_LOCALES = ['en', 'ru', 'uz-Latn', 'uz-Cyrl'] as const;

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ru: { translation: ru },
      'uz-Latn': { translation: uzLatn },
      'uz-Cyrl': { translation: uzCyrl },
    },
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LOCALES,
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'lc_locale',
      caches: ['localStorage'],
    },
  });

export default i18n;
