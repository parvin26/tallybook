/**
 * Centralized support and contact constants.
 * Single source of truth for WhatsApp support link and app language list.
 */
export const WHATSAPP_SUPPORT_PHONE = '00601116711269'

export function getWhatsAppSupportUrl(text?: string): string {
  const encoded = text ? encodeURIComponent(text) : ''
  return `https://wa.me/${WHATSAPP_SUPPORT_PHONE}${encoded ? `?text=${encoded}` : ''}`
}

/** Language code (ISO 2–3 chars) and status for intro switcher and app. */
export type LanguageStatus = 'active' | 'coming_soon'

export interface AppLanguage {
  code: string
  name: string
  status: LanguageStatus
  /** Short display code for UI (e.g. EN, BM, KRI). */
  shortCode: string
}

export const LANGUAGES: AppLanguage[] = [
  { code: 'en', name: 'English', status: 'active', shortCode: 'EN' },
  { code: 'bm', name: 'Bahasa Malaysia', status: 'active', shortCode: 'BM' },
  { code: 'krio', name: 'Krio', status: 'active', shortCode: 'KRI' },
  { code: 'tet', name: 'Tetum', status: 'coming_soon', shortCode: 'TET' },
  { code: 'sw', name: 'Swahili', status: 'coming_soon', shortCode: 'SW' },
  { code: 'hi', name: 'Hindi', status: 'coming_soon', shortCode: 'HI' },
  { code: 'vi', name: 'Vietnamese', status: 'coming_soon', shortCode: 'VI' },
  { code: 'id', name: 'Indonesian', status: 'coming_soon', shortCode: 'ID' },
]

/** Country code → preferred language codes (for reference; full data in countries.ts). */
export const COUNTRY_LANGUAGE_MAP: Record<string, string[]> = {
  MY: ['en', 'bm'],
  SG: ['en'],
  ID: ['en', 'id'],
  VN: ['en', 'vi'],
  PH: ['en'],
  TL: ['en', 'tet'],
  KE: ['en', 'sw'],
  IN: ['en', 'hi'],
  SL: ['en', 'krio'],
}
