"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { marketing, type MarketingCopy } from "./marketing";
import { Language, translations, TranslationCatalog } from "./translations";

export type { Language };

const STORAGE_KEY = "nakhatra_app_language";
// Read the pre-rename key once so an existing visitor keeps their language.
const LEGACY_STORAGE_KEY = "kundali_app_language";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationCatalog;
}

const LanguageContext = createContext<LanguageContextType>({
  language: "en",
  setLanguage: () => {},
  t: translations.en,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en");

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = (localStorage.getItem(STORAGE_KEY) ??
          localStorage.getItem(LEGACY_STORAGE_KEY)) as Language;
        if (stored && (stored === "en" || stored === "ne" || stored === "hi")) {
          setLanguageState(stored);
        }
      } catch (e) {
        console.error("Failed to load language preference", e);
      }
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch (e) {
        console.error("Failed to save language preference", e);
      }
    }
  };

  const value = {
    language,
    setLanguage,
    t: translations[language] || translations.en,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  return useContext(LanguageContext);
}

/** The marketing site's copy in the active language. */
export function useMarketing(): MarketingCopy {
  return marketing[useContext(LanguageContext).language] ?? marketing.en;
}

/**
 * Wide letter-spacing is a Latin display convention. Applied to Devanagari it
 * pulls conjuncts apart ("स्क्रोल" -> "स् क्रो ल"), so it only ships for `en`.
 */
export function useLatinTracking(classes: string) {
  return useContext(LanguageContext).language === "en" ? classes : "";
}
