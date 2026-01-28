/**
 * Shared UI class strings for marketing page
 * All classes use Tailwind token utilities and component patterns
 */

export const ui = {
  page: 'min-h-screen bg-background text-foreground',
  container: 'mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8',
  section: 'py-16 sm:py-20',
  sectionAlt: 'py-16 sm:py-20 bg-accent/40',
  heroWrap: 'min-h-[90vh] flex items-center',
  heroGrid: 'grid gap-10 lg:grid-cols-2 lg:gap-14 items-center',
  heroTitle: 'text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground leading-tight',
  heroBody: 'mt-5 text-base sm:text-lg text-muted-foreground leading-relaxed max-w-xl',
  ctaRow: 'mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4',
  buttonPrimary: 'tally-button-primary',
  buttonSecondary: 'inline-flex items-center justify-center rounded-xl px-6 py-4 text-lg font-medium border-2 border-border bg-card text-foreground hover:bg-accent/50 active:scale-[0.98] transition-all',
  card: 'tally-card border border-border',
  mockFrame: 'w-full rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden',
  microLabel: 'text-xs font-semibold uppercase tracking-wide text-muted-foreground',
} as const
