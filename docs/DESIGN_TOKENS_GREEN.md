# Tally green / teal design tokens

## Primary Tally green = #2F8F7A

**#2F8F7A** is the single canonical solid brand green (sage). All solid green/teal usage should reference tokens that resolve to this value.

---

## Tokens to use going forward

| Use case | Token | Notes |
|----------|--------|------|
| **Solid green** (buttons, links, icons, active states) | `--primary` (HSL) / `primary` (Tailwind) or `--tally-green` | Use `bg-primary`, `text-primary`, `.tally-button-primary` in new components. |
| **Solid green hover** | `--primary-hover` / `tally-sale-hover` (Tailwind) | Darker sage for hover. |
| **Focus ring / border** | `--ring` (same as primary) | Inputs, selects: `focus:ring-primary`. |
| **Soft backgrounds** (chips, selection, cards) | `--primary-soft-bg` (HSL 156 30% 92% → #E3F1EC), `--accent` | Backgrounds only; do not use for solid buttons. |
| **Money-in / success** | `--money-in`, `--success` (= primary), `--money-in-bg`, `--success-bg` | Success and money-in states; bg tokens are supporting only. |

---

## Legacy / deprecated (do not use in new components)

| Token | Status | Use instead |
|-------|--------|-------------|
| `--tally-sale` | Legacy alias → `--primary` | `primary` / `--primary` |
| `--tally-sale-hover` | Legacy alias → `--primary-hover` | `primary-hover` |
| `--cta-primary` / `--cta-hover` | Legacy alias → primary | `primary` / `primary-hover` |
| Raw hex `#29978C`, `#238579`, `#238a7f` | Deprecated in code; mass replace is a separate pass | Use tokens above. |
| `--tally-mint` | Soft mint fallback (#E8F5E9); keep for compatibility | Prefer `--primary-soft-bg` / `--accent` where possible. |

---

## Soft / derived greens (supporting only)

Use for backgrounds, chips, focus/selection states—**not** for solid buttons or primary actions.

| Token | Value | Role |
|-------|--------|------|
| `--accent` | 156 30% 92% (#E3F1EC) | Soft accent background |
| `--primary-soft-bg` | 156 30% 92% | Chips, selection bg (same family as accent) |
| `--primary-soft-border` | 164 40% 80% | Light sage border for selected states |
| `--money-in-bg` / `--success-bg` | 168 30% 75% | Light sage; money-in/success backgrounds only |
| `--tally-mint` | #E8F5E9 | Legacy mint fallback |

Opacity-based variants (e.g. `rgba(41,151,140,0.1)`) are still used inline in some components; a future pass can replace them with tokens derived from `--primary` (e.g. `--primary-soft-bg-alpha`).

---

## Where tokens are defined

- **`src/app/globals.css`** — `:root`:
  - Canonical: `--primary`, `--primary-hover`, `--tally-green`
  - Legacy aliases: `--tally-sale`, `--tally-sale-hover`, `--cta-primary`, `--cta-hover`, `--cta-text`
  - Soft/derived: `--primary-soft-bg`, `--primary-soft-border`, `--tally-mint`
  - UI (non-green): `--tally-bg`, `--tally-surface`, `--tally-surface-2`, `--tally-border`, `--tally-text`, `--tally-text-muted`, `--tally-radius`, `--tally-shadow`

- **`tailwind.config.ts`** — theme extends these via `var(--...)`; no hex values for green there.

---

## Components whose appearance will visibly change (token updates only)

These components **reference the green/primary tokens** we updated or newly defined.

1. **BottomNav** — Active nav item uses `text-tally-sale` → now resolves to `#2F8F7A` (was undefined).
2. **Welcome page** — Button hover was `#238a7f` (typo); now uses `hover:bg-tally-sale-hover` (primary-hover token).

Any component that uses **only** `primary` / `bg-primary` / `.tally-button-primary` was already using `--primary` (which was already #2F8F7A in HSL). No change for those.

Components that still use **raw hex** (`#29978C`, `#238579`) in class names or styles were **not** changed in this step; cleaning those up is a separate, explicit pass.
