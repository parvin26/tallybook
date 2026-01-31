/**
 * Centralized localStorage/sessionStorage keys.
 * Single source of truth — use these constants everywhere instead of hardcoded strings.
 */
export const STORAGE_KEYS = {
  INTRO_SEEN: 'tally_intro_seen',
  COUNTRY: 'tally-country',
  LANGUAGE: 'tally-language',
  GUEST_MODE: 'tally-guest-mode',
  ACTIVE_BUSINESS: 'tally-active-business',
  /** Guest mode: transactions to migrate on sign-up. */
  GUEST_TRANSACTIONS: 'tally-guest-transactions',
  /** Guest mode: inventory items (Ledger Principle — single source of truth). */
  INVENTORY_ITEMS: 'tally-inventory-items',
  /** Guest mode: inventory movements (used to derive quantity via trigger in auth; manually synced in guest). */
  INVENTORY_MOVEMENTS: 'tally-inventory-movements',
  /** Quick amount buttons for Sale page. */
  SALE_PRESETS: 'tally-sale-presets',
  /** Quick amount buttons for Expense page. */
  EXPENSE_PRESETS: 'tally-expense-presets',
  /** Quick amount buttons for Inventory/Stock (restock, quantity sold). */
  INVENTORY_PRESETS: 'tally-inventory-presets',
  /** PWA install banner: dismiss timestamp (Not now = hide 5 days). */
  PWA_INSTALL_BANNER_DISMISSED_AT: 'tally-pwa-install-banner-dismissed-at',
} as const
