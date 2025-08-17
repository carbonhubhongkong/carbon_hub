# Internationalization (i18n) System

This document explains how to use the multi-language support system in Carbon Hub.

## Overview

The application supports three languages:

- **English (en)** - Default language
- **Traditional Chinese (zh-TW)** - 繁體中文
- **Simplified Chinese (zh-CN)** - 简体中文

## Architecture

### File Structure

```
src/i18n/
├── config.ts              # Locale configuration
├── provider.tsx           # React context provider
├── hooks.ts               # Custom hooks for translations
├── translations/          # Translation files
│   ├── en.json           # English translations
│   ├── zh-TW.json        # Traditional Chinese translations
│   └── zh-CN.json        # Simplified Chinese translations
└── README.md              # This file
```

### Key Components

1. **I18nProvider** - Wraps the app and provides translation context
2. **LanguageSelector** - Dropdown for language switching (shows language names only)
3. **Translation files** - JSON files containing all text content

## Usage

### Basic Translation

```tsx
import { useTranslations } from "next-intl";

function MyComponent() {
  const t = useTranslations();

  return (
    <div>
      <h1>{t("common.title")}</h1>
      <p>{t("common.description")}</p>
    </div>
  );
}
```

### Using the Custom Hook

```tsx
import { useLocalizedTranslations } from "@/i18n/hooks";

function MyComponent() {
  const { t, locale, setLocale, common, navigation } =
    useLocalizedTranslations();

  return (
    <div>
      <h1>{common.title()}</h1>
      <p>{navigation.stage1()}</p>
      <button onClick={() => setLocale("zh-TW")}>
        Switch to Traditional Chinese
      </button>
    </div>
  );
}
```

### Translation with Parameters

```tsx
// In translation file (en.json)
{
  "welcome": "Hello, {name}! You have {count} messages."
}

// In component
const t = useTranslations();
<p>{t('welcome', { name: 'John', count: 5 })}</p>
// Output: "Hello, John! You have 5 messages."
```

## Adding New Translations

### 1. Add to English Translation File

```json
// src/i18n/translations/en.json
{
  "newSection": {
    "title": "New Feature",
    "description": "This is a new feature description"
  }
}
```

### 2. Add to Traditional Chinese

```json
// src/i18n/translations/zh-TW.json
{
  "newSection": {
    "title": "新功能",
    "description": "這是新功能的描述"
  }
}
```

### 3. Add to Simplified Chinese

```json
// src/i18n/translations/zh-CN.json
{
  "newSection": {
    "title": "新功能",
    "description": "这是新功能的描述"
  }
}
```

### 4. Use in Component

```tsx
import { useTranslations } from "next-intl";

function NewComponent() {
  const t = useTranslations();

  return (
    <div>
      <h2>{t("newSection.title")}</h2>
      <p>{t("newSection.description")}</p>
    </div>
  );
}
```

## Best Practices

### 1. Translation Keys

- Use descriptive, hierarchical keys (e.g., `stage1.addActivity`)
- Group related translations under common prefixes
- Keep keys consistent across all language files

### 2. Text Content

- Keep English text as the source of truth
- Ensure translations maintain the same meaning and context
- Test translations with native speakers when possible

### 3. Dynamic Content

- Use parameters for dynamic values: `{variableName}`
- Avoid concatenating strings in components
- Use pluralization when needed

### 4. File Organization

- Keep translation files organized by feature or section
- Use consistent naming conventions
- Regularly sync all language files

## Adding a New Language

### 1. Update Configuration

```typescript
// src/i18n/config.ts
export const locales = ["en", "zh-TW", "zh-CN", "ja"] as const;

export const localeNames: Record<Locale, string> = {
  en: "English",
  "zh-TW": "繁體中文",
  "zh-CN": "简体中文",
  ja: "日本語",
};
```

### 2. Create Translation File

```json
// src/i18n/translations/ja.json
{
  "common": {
    "next": "次へ",
    "back": "戻る",
    "save": "保存"
  }
  // ... rest of translations
}
```

### 3. Update Next.js Config

```typescript
// next.config.ts
i18n: {
  locales: ['en', 'zh-TW', 'zh-CN', 'ja'],
  defaultLocale: 'en',
  localeDetection: true,
}
```

## Troubleshooting

### Common Issues

1. **Translation not found**: Check if the key exists in all language files
2. **Language not switching**: Ensure the locale is properly set in the provider
3. **Missing translations**: Verify all language files have the same structure

### Debug Mode

Enable debug logging by checking the browser console for translation-related errors.

## Performance Considerations

- Translations are loaded dynamically based on selected language
- Language preference is stored in localStorage for persistence
- Fallback to English if a translation fails to load
- Lazy loading of translation files reduces initial bundle size

## Testing

Test the i18n system by:

1. Switching between different languages
2. Verifying all text content is translated
3. Checking that dynamic content works in all languages
4. Testing responsive design with different text lengths
5. Validating accessibility features work across languages
