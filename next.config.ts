import type { NextConfig } from 'next'
import withPWA from 'next-pwa'
// Default runtime caching strategies (fonts/images/etc.)
// See: https://github.com/shadowwalker/next-pwa
import runtimeCaching from 'next-pwa/cache'

const nextConfig: NextConfig = {
  // Keep this file minimal; next-pwa wraps the config below.
  // Next 16 uses Turbopack by default; next-pwa injects webpack config.
  // Adding an explicit (empty) turbopack config prevents Next's mismatch error.
  turbopack: {},
}

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching,
})(nextConfig)
