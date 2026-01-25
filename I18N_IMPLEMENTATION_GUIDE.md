# TALLY i18n Implementation Guide

## How Language Switching Works

### 1. **Initialization** (`src/i18n/config.ts`)
```typescript
// Reads language from localStorage on app load
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('tally-language') || 'en'
  : 'en'

i18n.init({
  resources: {
    en: { translation: en },  // English translations from en.json
    bm: { translation: bm },  // Bahasa Malaysia translations from bm.json
  },
  lng: savedLanguage,  // Sets initial language
  fallbackLng: 'en',   // Falls back to English if translation missing
})
```

**Key Point:** i18n is initialized ONCE when the module loads. The language is read from localStorage at that moment.

### 2. **Language Switching** (`src/app/settings/page.tsx`)
```typescript
const handleLanguageChange = (lang: 'bm' | 'en') => {
  i18n.changeLanguage(lang).then(() => {
    localStorage.setItem('tally-language', lang)  // Save preference
    window.location.reload()  // ⚠️ CRITICAL: Reload page to re-render all components
  })
}
```

**Why reload?** React components need to re-render with new translations. The page reload ensures:
- All components re-mount
- All `useTranslation()` hooks get fresh `t()` function
- No stale translations remain

### 3. **Using Translations in Components**
```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()  // Gets t() function for current language
  
  return (
    <div>
      <h1>{t('settings.title')}</h1>  // Uses translation key
      <p>{t('common.loading')}</p>
    </div>
  )
}
```

## PROBLEMS IDENTIFIED & FIXED

### ❌ Problem 1: Hardcoded Malay Arrays
**Files:** `src/app/setup/page.tsx`, `src/app/settings/page.tsx`

**Before:**
```typescript
// ❌ WRONG - Always shows in Malay
const BUSINESS_TYPES = [
  'Kedai Runcit',      // Hardcoded Malay
  'Warung/Gerai',
  // ...
]
```

**After:**
```typescript
// ✅ CORRECT - Uses translations
import { getBusinessTypes } from '@/lib/translations'

const businessTypes = getBusinessTypes(t)  // Returns translated labels
// Returns: [{ value: 'Kedai Runcit', label: 'Retail Shop' }] when English
// Returns: [{ value: 'Kedai Runcit', label: 'Kedai Runcit' }] when Malay
```

**Solution:** Created `src/lib/translations.ts` with:
- `BUSINESS_TYPE_VALUES` - Database values (must stay as-is)
- `getBusinessTypeLabel(value, t)` - Gets translated label
- `getBusinessTypes(t)` - Returns array with translated labels

### ❌ Problem 2: Hardcoded Strings in Settings Page
**File:** `src/app/settings/page.tsx`

**Before:**
```typescript
// ❌ WRONG
<h1>Tetapan</h1>
<p>Profil</p>
<p>Bahasa</p>
toast.error('Tiada transaksi untuk dieksport')
```

**After:**
```typescript
// ✅ CORRECT
<h1>{t('settings.title')}</h1>
<p>{t('settings.profile')}</p>
<p>{t('settings.language')}</p>
toast.error(t('csv.noTransactions'))
```

**Fixed:** All hardcoded strings replaced with `t()` calls.

### ❌ Problem 3: CSV Export Uses Hardcoded Malay
**File:** `src/app/settings/page.tsx`

**Before:**
```typescript
// ❌ WRONG
const headers = ['Tarikh', 'Jenis', 'Jumlah', ...]
const rows = activeTransactions.map(t => [
  t.transaction_type === 'sale' ? 'Jualan' : 'Belanja',  // Hardcoded
])
```

**After:**
```typescript
// ✅ CORRECT
const headers = [
  t('csv.headers.date'),
  t('csv.headers.type'),
  // ...
]
const rows = activeTransactions.map(t => [
  t.transaction_type === 'sale' ? t('csv.sale') : t('csv.expense'),
])
```

### ❌ Problem 4: Missing Translation Keys
**Solution:** Added to both `en.json` and `bm.json`:
- `businessTypes.*` - All business type labels
- `csv.*` - CSV export headers and messages
- `settings.*` - All settings page strings

## COMPLETE IMPLEMENTATION

### File Structure
```
src/
├── i18n/
│   ├── config.ts              # i18n initialization
│   └── locales/
│       ├── en.json            # English translations
│       └── bm.json            # Bahasa Malaysia translations
├── lib/
│   └── translations.ts         # Helper functions for business types
└── app/
    ├── settings/
    │   └── page.tsx           # Uses getBusinessTypes(t)
    └── setup/
        └── page.tsx            # Uses getBusinessTypes(t)
```

### Translation File Structure
```json
{
  "common": { ... },
  "auth": { ... },
  "setup": { ... },
  "settings": { ... },
  "businessTypes": {
    "retail": "Retail Shop" / "Kedai Runcit",
    "stall": "Stall/Kiosk" / "Warung/Gerai",
    ...
  },
  "csv": {
    "headers": { ... },
    "sale": "Sale" / "Jualan",
    "expense": "Expense" / "Belanja"
  }
}
```

### Using Business Types
```typescript
import { getBusinessTypes } from '@/lib/translations'

function MyComponent() {
  const { t } = useTranslation()
  const businessTypes = getBusinessTypes(t)
  
  // businessTypes = [
  //   { value: 'Kedai Runcit', label: 'Retail Shop' },  // When English
  //   { value: 'Kedai Runcit', label: 'Kedai Runcit' }, // When Malay
  //   ...
  // ]
  
  return (
    <select>
      {businessTypes.map(({ value, label }) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  )
}
```

## TESTING CHECKLIST

1. **Set Language to English**
   - Go to Settings → Select "English"
   - Page reloads
   - Check all pages:
     - ✅ No Malay text visible
     - ✅ Business types show in English
     - ✅ All buttons, labels, messages in English
     - ✅ CSV export headers in English

2. **Set Language to Malay**
   - Go to Settings → Select "Bahasa Malaysia"
   - Page reloads
   - Check all pages:
     - ✅ No English text visible (except proper nouns)
     - ✅ Business types show in Malay
     - ✅ All buttons, labels, messages in Malay
     - ✅ CSV export headers in Malay

3. **Verify Language Persists**
   - Set language to English
   - Close browser
   - Reopen browser
   - ✅ Should still be in English

## COMMON ISSUES & SOLUTIONS

### Issue: "Still seeing Malay when English is selected"
**Cause:** Hardcoded strings not replaced with `t()`
**Solution:** Search for hardcoded Malay strings and replace with `t('key')`

### Issue: "Business types always in Malay"
**Cause:** Using hardcoded `BUSINESS_TYPES` array
**Solution:** Use `getBusinessTypes(t)` from `@/lib/translations`

### Issue: "Language doesn't change"
**Cause:** Page not reloading after language change
**Solution:** Ensure `window.location.reload()` is called after `i18n.changeLanguage()`

### Issue: "Some components don't update"
**Cause:** Component not using `useTranslation()` hook
**Solution:** Add `const { t } = useTranslation()` to component

## FILES TO CHECK FOR HARDCODED STRINGS

Search for these patterns:
- `'Kedai Runcit'` - Should use `getBusinessTypes(t)`
- `'Tetapan'` - Should use `t('settings.title')`
- `'Profil'` - Should use `t('settings.profile')`
- `'Bahasa'` - Should use `t('settings.language')`
- Any toast messages with Malay text
- Any dialog titles/content with Malay text
- CSV headers/rows with hardcoded text

## SUMMARY

✅ **Fixed:**
- Created `src/lib/translations.ts` for business types
- Replaced all hardcoded strings in settings page
- Replaced all hardcoded strings in setup page
- Fixed CSV export to use translations
- Added all missing translation keys
- Updated colors to behavioral palette

✅ **How it works:**
1. Language stored in `localStorage.getItem('tally-language')`
2. i18n reads from localStorage on initialization
3. When language changes, page reloads to re-render all components
4. All components use `t()` function for translations
5. Business types use helper function to get translated labels

✅ **Result:**
- When English selected → All text in English
- When Malay selected → All text in Malay
- Language preference persists across sessions
