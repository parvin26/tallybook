import type { MetadataRoute } from 'next'

const BASE_URL =
  process.env.APP_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://tallybook.app')

/**
 * Static sitemap for Tally - public, indexable pages only.
 * Served at /sitemap.xml on Vercel.
 * Excludes: auth, dashboard, admin, onboarding flow, API routes.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const today = new Date().toISOString().slice(0, 10) // YYYY-MM-DD

  return [
    {
      url: BASE_URL,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/app`,
      lastModified: today,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/help`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: today,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ]
}
