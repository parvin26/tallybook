/**
 * Centralized country data — single source of truth for supported countries,
 * currencies, and language availability.
 */

export interface Country {
  code: string
  name: string
  currency: string
  symbol: string
  languages: string[]
  comingSoon: string[]
}

export const COUNTRIES: Country[] = [
  { code: 'MY', name: 'Malaysia', currency: 'MYR', symbol: 'RM', languages: ['en', 'bm'], comingSoon: [] },
  { code: 'SG', name: 'Singapore', currency: 'SGD', symbol: 'S$', languages: ['en'], comingSoon: ['zh', 'ms', 'ta'] },
  { code: 'ID', name: 'Indonesia', currency: 'IDR', symbol: 'Rp', languages: ['en'], comingSoon: ['id'] },
  { code: 'VN', name: 'Vietnam', currency: 'VND', symbol: '₫', languages: ['en'], comingSoon: ['vi'] },
  { code: 'PH', name: 'Philippines', currency: 'PHP', symbol: '₱', languages: ['en'], comingSoon: ['tl'] },
  { code: 'TL', name: 'Timor Leste', currency: 'USD', symbol: '$', languages: ['en', 'tetum'], comingSoon: [] },
  { code: 'KE', name: 'Kenya', currency: 'KES', symbol: 'KSh', languages: ['en'], comingSoon: ['sw'] },
  { code: 'CM', name: 'Cameroon', currency: 'XAF', symbol: 'FCFA', languages: ['en'], comingSoon: ['fr'] },
  { code: 'RW', name: 'Rwanda', currency: 'RWF', symbol: 'RF', languages: ['en'], comingSoon: ['rw'] },
  { code: 'IN', name: 'India', currency: 'INR', symbol: '₹', languages: ['en'], comingSoon: ['hi'] },
  { code: 'SL', name: 'Sierra Leone', currency: 'SLE', symbol: 'NLe', languages: ['en', 'krio'], comingSoon: [] },
]
