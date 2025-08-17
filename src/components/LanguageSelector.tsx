'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useI18n } from '@/i18n/provider';
import { locales, localeNames, type Locale } from '@/i18n/config';
import './LanguageSelector.css';

const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLanguageSelect = (selectedLocale: Locale) => {
    setLocale(selectedLocale);
    setIsOpen(false);
  };

  const currentLanguage = localeNames[locale];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className="language-selector-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="language-name">{currentLanguage}</span>
        <span className={`language-arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="language-dropdown" role="listbox">
          {locales.map((loc) => (
            <button
              key={loc}
              className={`language-option ${loc === locale ? 'selected' : ''}`}
              onClick={() => handleLanguageSelect(loc)}
              role="option"
              aria-selected={loc === locale}
            >
              <span className="language-name">{localeNames[loc]}</span>
              {loc === locale && <span className="checkmark">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default LanguageSelector;
