import type { TFunction } from 'i18next'

/**
 * Single source for human-readable expense category labels.
 * Prevents raw i18n keys (e.g. expenseCategories.Other) from appearing in the UI.
 */
export function getExpenseCategoryLabel(categoryKey: string | null | undefined, t: TFunction): string {
  if (categoryKey == null || categoryKey === '') return ''
  const normalized = categoryKey.toLowerCase().trim()
  const out = t(`expenseCategories.${normalized}`)
  if (out === `expenseCategories.${normalized}` || out === categoryKey) {
    return normalized === 'other' ? 'Other' : categoryKey
  }
  return out
}
