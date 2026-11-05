import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import { SupportedLanguage, LanguageOption } from '../types';
import { translations, SUPPORTED_LANGUAGES, TranslationDict } from '../i18n/translations';
import { getMetaValue, setMetaValue } from '../services/offlineStorage';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (key: string, fallbackOrParams?: string | Record<string, string | number>, params?: Record<string, string | number>) => string;
  currentLanguageOption: LanguageOption;
  availableLanguages: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const STORAGE_LANG_KEY = 'app_language_preference';

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>('en');

  useEffect(() => {
    // Load persisted language preference on launch
    const loadSavedLanguage = async () => {
      try {
        const savedLang = await getMetaValue(STORAGE_LANG_KEY);
        if (
          savedLang &&
          SUPPORTED_LANGUAGES.some((opt) => opt.code === savedLang)
        ) {
          setLanguageState(savedLang as SupportedLanguage);
        }
      } catch (err) {
        console.warn('[LanguageContext] Could not load saved language:', err);
      }
    };

    loadSavedLanguage();
  }, []);

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang);
    // Persist to local offline storage asynchronously
    setMetaValue(STORAGE_LANG_KEY, newLang).catch((err) => {
      console.warn('[LanguageContext] Failed to save language preference:', err);
    });
  };

  const currentLanguageOption = useMemo(() => {
    return (
      SUPPORTED_LANGUAGES.find((opt) => opt.code === language) ||
      SUPPORTED_LANGUAGES[0]
    );
  }, [language]);

  const t = useCallback((
    key: string,
    fallbackOrParams?: string | Record<string, string | number>,
    params?: Record<string, string | number>
  ): string => {
    let fallbackText: string | undefined;
    let actualParams: Record<string, string | number> | undefined;

    if (typeof fallbackOrParams === 'string') {
      fallbackText = fallbackOrParams;
      actualParams = params;
    } else if (typeof fallbackOrParams === 'object' && fallbackOrParams !== null) {
      actualParams = fallbackOrParams;
    }

    const dict: TranslationDict = translations[language] || translations.en;
    let text = dict[key] || translations.en[key] || fallbackText || key;

    // Parameter interpolation: replace {paramName} with value
    if (actualParams) {
      Object.keys(actualParams).forEach((paramKey) => {
        text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(actualParams[paramKey]));
      });
    }

    return text;
  }, [language]);

  const contextValue = useMemo(() => ({
    language,
    setLanguage,
    t,
    currentLanguageOption,
    availableLanguages: SUPPORTED_LANGUAGES,
  }), [language, t, currentLanguageOption]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
