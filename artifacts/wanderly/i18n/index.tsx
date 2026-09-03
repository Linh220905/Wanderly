/**
 * i18n engine for Wanderly.
 *
 * Lightweight, no external dependency. Reads the device locale and serves
 * the matching translation object. Falls back to English.
 *
 * Usage:
 *   const { t } = useTranslation();
 *   t.welcome.title  // "Turn every run into an adventure."
 *
 * Interpolation helper:
 *   interpolate(t.summary.days, { count: 3 })  // "3 days"
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en, { type TranslationKeys } from './en';
import vi from './vi';

export type SupportedLocale = 'en' | 'vi';

const translations: Record<SupportedLocale, TranslationKeys> = { en, vi };

const LOCALE_STORAGE_KEY = 'wanderly-locale';

/** Detect device locale, returning 'en' | 'vi'. */
function detectDeviceLocale(): SupportedLocale {
  let locale = 'en';
  try {
    if (Platform.OS === 'ios') {
      locale =
        NativeModules.SettingsManager?.settings?.AppleLocale ??
        NativeModules.SettingsManager?.settings?.AppleLanguages?.[0] ??
        'en';
    } else if (Platform.OS === 'android') {
      locale = NativeModules.I18nManager?.localeIdentifier ?? 'en';
    } else {
      locale = typeof navigator !== 'undefined' ? navigator.language : 'en';
    }
  } catch {
    locale = 'en';
  }

  const lang = locale.split(/[-_]/)[0].toLowerCase();
  return lang === 'vi' ? 'vi' : 'en';
}

/** Replace {{key}} placeholders in a string. */
export function interpolate(
  template: string,
  variables: Record<string, string | number>,
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
    String(variables[key] ?? `{{${key}}}`),
  );
}

// ── Context ──────────────────────────────────────────────

type I18nContextValue = {
  locale: SupportedLocale;
  setLocale: (locale: SupportedLocale) => void;
  t: TranslationKeys;
};

const I18nContext = createContext<I18nContextValue>({
  locale: 'en',
  setLocale: () => {},
  t: en,
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLocale>(detectDeviceLocale());
  const [loaded, setLoaded] = useState(false);

  // Load persisted locale preference
  useEffect(() => {
    AsyncStorage.getItem(LOCALE_STORAGE_KEY)
      .then(saved => {
        if (saved === 'en' || saved === 'vi') {
          setLocaleState(saved);
        }
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const setLocale = useCallback((newLocale: SupportedLocale) => {
    setLocaleState(newLocale);
    AsyncStorage.setItem(LOCALE_STORAGE_KEY, newLocale).catch(() => {});
  }, []);

  const t = useMemo(() => translations[locale], [locale]);

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  if (!loaded) return null;

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}

export { type TranslationKeys };
