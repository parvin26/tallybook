/**
 * Centralized design tokens matching Lovable TALLY Design System
 * All tokens map to CSS custom properties defined in globals.css
 */

export const tokens = {
  colors: {
    background: 'hsl(var(--background))',
    foreground: 'hsl(var(--foreground))',
    card: 'hsl(var(--card))',
    primary: 'hsl(var(--primary))',
    secondary: 'hsl(var(--secondary))',
    accent: 'hsl(var(--accent))',
    mutedForeground: 'hsl(var(--muted-foreground))',
    border: 'hsl(var(--border))',
  },
  radius: {
    xl: 'rounded-xl', // 0.75rem / 12px
    '2xl': 'rounded-2xl', // 1rem / 16px
    '3xl': 'rounded-3xl', // 1.5rem / 24px
  },
  spacing: {
    4: '1rem', // 16px
    6: '1.5rem', // 24px
    8: '2rem', // 32px
    10: '2.5rem', // 40px
    12: '3rem', // 48px
    16: '4rem', // 64px
  },
  shadows: {
    card: 'var(--shadow-card)',
    soft: 'var(--shadow-soft)',
  },
} as const
