import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useEffect, useState } from 'react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from '@/locales/zh';
import en from '@/locales/en';
import ja from '@/locales/ja';
import ko from '@/locales/ko';

const STORAGE_KEY = 'app_language';

export type Language = 'zh' | 'en' | 'ja' | 'ko';

export const languageNames: Record<Language, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

i18n.use(initReactI18next).init({
  resources: {
    zh: { translation: zh },
    en: { translation: en },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: 'zh',
  fallbackLng: 'zh',
  interpolation: {
    escapeValue: false,
  },
});

export const [LanguageProvider, useLanguage] = createContextHook(() => {
  const [currentLanguage, setCurrentLanguage] = useState<Language>('zh');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(STORAGE_KEY);
      if (savedLanguage && ['zh', 'en', 'ja', 'ko'].includes(savedLanguage)) {
        setCurrentLanguage(savedLanguage as Language);
        i18n.changeLanguage(savedLanguage);
      }
    } catch (error) {
      console.error('Failed to load language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const changeLanguage = async (language: Language) => {
    try {
      i18n.changeLanguage(language);
      setCurrentLanguage(language);
      await AsyncStorage.setItem(STORAGE_KEY, language);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return {
    currentLanguage,
    changeLanguage,
    isLoading,
    t: i18n.t,
  };
});
