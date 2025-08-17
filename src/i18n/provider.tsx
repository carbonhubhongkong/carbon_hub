'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import { locales, defaultLocale, type Locale } from './config';

// Static imports for better reliability
import enMessages from './translations/en.json';
import zhTWMessages from './translations/zh-TW.json';
import zhCNMessages from './translations/zh-CN.json';

const messagesMap = {
  'en': enMessages,
  'zh-TW': zhTWMessages,
  'zh-CN': zhCNMessages,
} as const;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  messages: Record<string, unknown>;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

interface I18nProviderProps {
  children: ReactNode;
}

// Simple loading component
const I18nLoading = () => (
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center', 
    height: '100vh',
    fontSize: '16px',
    color: '#666'
  }}>
    Loading...
  </div>
);

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [messages, setMessages] = useState<Record<string, unknown>>(messagesMap[defaultLocale]);

  useEffect(() => {
    // Update messages when locale changes
    const newMessages = messagesMap[locale];
    if (newMessages) {
      console.log(`Setting messages for locale: ${locale}`, Object.keys(newMessages));
      setMessages(newMessages);
    } else {
      console.warn(`Messages for locale ${locale} not found, falling back to ${defaultLocale}`);
      setMessages(messagesMap[defaultLocale]);
    }
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (locales.includes(newLocale)) {
      console.log(`Setting locale to: ${newLocale}`);
      setLocaleState(newLocale);
      // Store in localStorage for persistence
      try {
        localStorage.setItem('carbon-hub-locale', newLocale);
      } catch (error) {
        console.warn('Failed to save locale to localStorage:', error);
      }
    } else {
      console.warn(`Invalid locale: ${newLocale}, falling back to ${defaultLocale}`);
      setLocaleState(defaultLocale);
    }
  };

  useEffect(() => {
    // Load saved locale from localStorage on mount
    try {
      const savedLocale = localStorage.getItem('carbon-hub-locale') as Locale;
      if (savedLocale && locales.includes(savedLocale)) {
        console.log(`Loading saved locale: ${savedLocale}`);
        setLocaleState(savedLocale);
      }
    } catch (error) {
      console.warn('Failed to load saved locale from localStorage:', error);
    }
  }, []);

  // Ensure we have valid messages before rendering
  if (!messages || Object.keys(messages).length === 0) {
    console.error('No messages available, falling back to default locale');
    setMessages(messagesMap[defaultLocale]);
    return <I18nLoading />;
  }

  console.log('I18n provider ready, rendering with messages:', Object.keys(messages));

  return (
    <I18nContext.Provider value={{ locale, setLocale, messages }}>
      <NextIntlClientProvider messages={messages} locale={locale}>
        {children}
      </NextIntlClientProvider>
    </I18nContext.Provider>
  );
};
