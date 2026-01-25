import { TFunction } from 'i18next'

// These are the database values (must stay as-is for data consistency)
// They are stored in the database, so we can't change them
export const BUSINESS_TYPE_VALUES = [
  'Kedai Runcit',
  'Warung/Gerai',
  'Perkhidmatan',
  'Kedai Online',
  'Perniagaan Rumah',
  'Lain-lain'
] as const

// Get translated label for a business type value
export const getBusinessTypeLabel = (value: string, t: TFunction): string => {
  const map: Record<string, string> = {
    'Kedai Runcit': t('businessTypes.retail'),
    'Warung/Gerai': t('businessTypes.stall'),
    'Perkhidmatan': t('businessTypes.service'),
    'Kedai Online': t('businessTypes.online'),
    'Perniagaan Rumah': t('businessTypes.home'),
    'Lain-lain': t('businessTypes.other'),
  }
  return map[value] || value
}

// Get array of business types with translated labels for display
export const getBusinessTypes = (t: TFunction): Array<{ value: string; label: string }> => {
  return BUSINESS_TYPE_VALUES.map(value => ({
    value,
    label: getBusinessTypeLabel(value, t)
  }))
}

// Malaysian states are proper nouns, so they stay the same in both languages
export const MALAYSIAN_STATES = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Melaka',
  'Negeri Sembilan',
  'Pahang',
  'Perak',
  'Perlis',
  'Pulau Pinang',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Wilayah Persekutuan Kuala Lumpur',
  'Wilayah Persekutuan Labuan',
  'Wilayah Persekutuan Putrajaya'
] as const
