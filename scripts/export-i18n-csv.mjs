#!/usr/bin/env node

/**
 * i18n Translation Audit Export Script
 * Exports all translation keys from en.json, bm.json, and krio.json to CSV
 */

import { readFileSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const localesDir = join(rootDir, 'src', 'i18n', 'locales')

/**
 * Flatten nested object into dot notation keys
 * @param {object} obj - The object to flatten
 * @param {string} prefix - The prefix for keys (used recursively)
 * @returns {object} - Flattened object with dot notation keys
 */
function flattenObject(obj, prefix = '') {
  const flattened = {}
  
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key
    
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      // Recursively flatten nested objects
      Object.assign(flattened, flattenObject(value, newKey))
    } else {
      // Store the value (handle arrays and primitives)
      flattened[newKey] = value
    }
  }
  
  return flattened
}

/**
 * Load a JSON locale file, return empty object if file doesn't exist
 * @param {string} lang - Language code (en, bm, krio)
 * @returns {object} - Flattened translation object
 */
function loadLocale(lang) {
  const filePath = join(localesDir, `${lang}.json`)
  
  try {
    const content = readFileSync(filePath, 'utf-8')
    const json = JSON.parse(content)
    return flattenObject(json)
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Warning: ${lang}.json not found, using empty translations`)
      return {}
    }
    throw error
  }
}

/**
 * Determine status for a translation key
 * @param {string} key - The translation key
 * @param {object} en - English translations
 * @param {object} bm - Bahasa Malaysia translations
 * @param {object} krio - Krio translations
 * @returns {string} - Status code
 */
function getStatus(key, en, bm, krio) {
  const enValue = en[key] || ''
  const bmValue = bm[key] || ''
  const krioValue = krio[key] || ''
  
  // Check for missing translations
  if (!enValue) return 'MISSING_EN'
  if (!bmValue) return 'MISSING_BM'
  if (!krioValue) return 'MISSING_KRIO'
  
  // Check if translations are same as English
  if (bmValue === enValue) return 'SAME_AS_EN_BM'
  if (krioValue === enValue) return 'SAME_AS_EN_KRIO'
  
  return 'OK'
}

/**
 * Escape CSV value (handle quotes and commas)
 * @param {string} value - Value to escape
 * @returns {string} - Escaped value
 */
function escapeCsv(value) {
  if (value === null || value === undefined) return ''
  
  const str = String(value)
  
  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  
  return str
}

/**
 * Main export function
 */
function exportTranslations() {
  console.log('Loading translation files...')
  
  // Load all locale files
  const en = loadLocale('en')
  const bm = loadLocale('bm')
  const krio = loadLocale('krio')
  
  console.log(`Loaded ${Object.keys(en).length} English keys`)
  console.log(`Loaded ${Object.keys(bm).length} Bahasa Malaysia keys`)
  console.log(`Loaded ${Object.keys(krio).length} Krio keys`)
  
  // Union all keys across all languages
  const allKeys = new Set([
    ...Object.keys(en),
    ...Object.keys(bm),
    ...Object.keys(krio)
  ])
  
  console.log(`Total unique keys: ${allKeys.size}`)
  
  // Sort keys alphabetically
  const sortedKeys = Array.from(allKeys).sort()
  
  // Generate CSV content
  const csvRows = []
  
  // Header row
  csvRows.push('key,en,bm,krio,status')
  
  // Data rows
  for (const key of sortedKeys) {
    const enValue = en[key] || ''
    const bmValue = bm[key] || ''
    const krioValue = krio[key] || ''
    const status = getStatus(key, en, bm, krio)
    
    csvRows.push([
      escapeCsv(key),
      escapeCsv(enValue),
      escapeCsv(bmValue),
      escapeCsv(krioValue),
      escapeCsv(status)
    ].join(','))
  }
  
  // Write to file
  const outputPath = join(rootDir, 'i18n-audit.csv')
  const csvContent = csvRows.join('\n')
  
  writeFileSync(outputPath, csvContent, 'utf-8')
  
  console.log(`\n✅ Export complete!`)
  console.log(`📄 Output file: ${outputPath}`)
  
  // Print summary statistics
  const statusCounts = {}
  for (const key of sortedKeys) {
    const status = getStatus(key, en, bm, krio)
    statusCounts[status] = (statusCounts[status] || 0) + 1
  }
  
  console.log('\n📊 Summary:')
  for (const [status, count] of Object.entries(statusCounts)) {
    console.log(`  ${status}: ${count}`)
  }
}

// Run the export
try {
  exportTranslations()
} catch (error) {
  console.error('❌ Error exporting translations:', error)
  process.exit(1)
}
