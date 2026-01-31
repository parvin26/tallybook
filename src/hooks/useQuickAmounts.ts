'use client'

import { useState, useEffect, useCallback } from 'react'
import { STORAGE_KEYS } from '@/lib/storage-keys'

const MAX_PRESETS_PER_TYPE = 5
const DEFAULT_SALE_PRESETS = [10, 20, 50, 100, 200]
const DEFAULT_EXPENSE_PRESETS = [5, 10, 20, 50, 100, 1000]
const DEFAULT_INVENTORY_PRESETS = [10, 20, 50, 100, 200]

function parsePresets(key: string, defaultPresets: number[]): number[] {
  if (typeof window === 'undefined') return defaultPresets.slice(0, MAX_PRESETS_PER_TYPE)
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return defaultPresets.slice(0, MAX_PRESETS_PER_TYPE)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultPresets.slice(0, MAX_PRESETS_PER_TYPE)
    const numbers = parsed.filter((n: unknown) => typeof n === 'number' && Number.isFinite(n) && n >= 0)
    const result = numbers.length > 0 ? numbers : defaultPresets
    const trimmed = result.slice(0, MAX_PRESETS_PER_TYPE)
    if (result.length > MAX_PRESETS_PER_TYPE) {
      savePresetsToStorage(key, trimmed)
    }
    return trimmed
  } catch {
    return defaultPresets.slice(0, MAX_PRESETS_PER_TYPE)
  }
}

function savePresetsToStorage(key: string, presets: number[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(presets))
}

export function useQuickAmounts() {
  const [salePresets, setSalePresetsState] = useState<number[]>(() =>
    parsePresets(STORAGE_KEYS.SALE_PRESETS, DEFAULT_SALE_PRESETS)
  )
  const [expensePresets, setExpensePresetsState] = useState<number[]>(() =>
    parsePresets(STORAGE_KEYS.EXPENSE_PRESETS, DEFAULT_EXPENSE_PRESETS)
  )
  const [inventoryPresets, setInventoryPresetsState] = useState<number[]>(() =>
    parsePresets(STORAGE_KEYS.INVENTORY_PRESETS, DEFAULT_INVENTORY_PRESETS)
  )

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    setSalePresetsState(parsePresets(STORAGE_KEYS.SALE_PRESETS, DEFAULT_SALE_PRESETS))
    setExpensePresetsState(parsePresets(STORAGE_KEYS.EXPENSE_PRESETS, DEFAULT_EXPENSE_PRESETS))
    setInventoryPresetsState(parsePresets(STORAGE_KEYS.INVENTORY_PRESETS, DEFAULT_INVENTORY_PRESETS))
  }, [])

  const saveSalePresets = useCallback((presets: number[]) => {
    const sorted = [...presets].filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b).slice(0, MAX_PRESETS_PER_TYPE)
    setSalePresetsState(sorted)
    savePresetsToStorage(STORAGE_KEYS.SALE_PRESETS, sorted)
  }, [])

  const saveExpensePresets = useCallback((presets: number[]) => {
    const sorted = [...presets].filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b).slice(0, MAX_PRESETS_PER_TYPE)
    setExpensePresetsState(sorted)
    savePresetsToStorage(STORAGE_KEYS.EXPENSE_PRESETS, sorted)
  }, [])

  const saveInventoryPresets = useCallback((presets: number[]) => {
    const sorted = [...presets].filter((n) => Number.isFinite(n) && n >= 0).sort((a, b) => a - b).slice(0, MAX_PRESETS_PER_TYPE)
    setInventoryPresetsState(sorted)
    savePresetsToStorage(STORAGE_KEYS.INVENTORY_PRESETS, sorted)
  }, [])

  const resetSalePresets = useCallback(() => {
    setSalePresetsState(DEFAULT_SALE_PRESETS)
    savePresetsToStorage(STORAGE_KEYS.SALE_PRESETS, DEFAULT_SALE_PRESETS)
  }, [])

  const resetExpensePresets = useCallback(() => {
    setExpensePresetsState(DEFAULT_EXPENSE_PRESETS)
    savePresetsToStorage(STORAGE_KEYS.EXPENSE_PRESETS, DEFAULT_EXPENSE_PRESETS)
  }, [])

  const resetInventoryPresets = useCallback(() => {
    setInventoryPresetsState(DEFAULT_INVENTORY_PRESETS)
    savePresetsToStorage(STORAGE_KEYS.INVENTORY_PRESETS, DEFAULT_INVENTORY_PRESETS)
  }, [])

  return {
    salePresets,
    expensePresets,
    inventoryPresets,
    saveSalePresets,
    saveExpensePresets,
    saveInventoryPresets,
    resetSalePresets,
    resetExpensePresets,
    resetInventoryPresets,
    defaultSalePresets: DEFAULT_SALE_PRESETS,
    defaultExpensePresets: DEFAULT_EXPENSE_PRESETS,
    defaultInventoryPresets: DEFAULT_INVENTORY_PRESETS,
  }
}
