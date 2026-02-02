# Green colours used in Tally

There are **11 distinct green-related colours** in use (plus one likely typo variant).

---

## 1. **#29978C** — Main Tally teal (primary action green)

- **RGB:** 41, 151, 140  
- **Usage:** Buttons, links, borders, focus rings, icons, active states.  
- **Code examples:**
  - `src/app/settings/page.tsx` — `text-[#29978C]`, `border-[#29978C]`, `bg-[#29978C]`
  - `src/app/sale/page.tsx` — `bg-[#29978C]`, `focus-visible:border-[#29978C]`
  - `src/app/app/page.tsx` — `text-[#29978C]` (View all activity link)
  - `src/components/PWAInstallBanner.tsx` — `bg-[#29978C]`
  - Many other files: summary, reports, balance, health, stock, onboarding, modals, etc.

![#29978C](https://via.placeholder.com/80x40/29978C/29978C?text=%2329978C)

---

## 2. **#238579** — Darker hover (main button hover)

- **RGB:** 35, 133, 121  
- **Usage:** `hover:bg-[#238579]` on primary buttons and links.  
- **Code examples:**
  - `src/app/settings/page.tsx` — `hover:bg-[#238579]`
  - `src/app/sale/page.tsx` — `hover:bg-[#238579]`
  - `src/app/reports/page.tsx` — `hover:bg-[#238579]`
  - `src/app/stock/page.tsx` — `hover:bg-[#238579]`
  - Same pattern in expense, transaction, onboarding, PWAInstallBanner, OnboardingOverlay, etc.

![#238579](https://via.placeholder.com/80x40/238579/238579?text=%23238579)

---

## 3. **#238a7f** — Slightly different hover (likely typo)

- **RGB:** 35, 138, 127  
- **Usage:** Only on welcome page button hover.  
- **Code:** `src/app/welcome/page.tsx` line 152 — `hover:bg-[#238a7f]`  
- **Note:** Probably intended to match #238579.

![#238a7f](https://via.placeholder.com/80x40/238a7f/238a7f?text=%23238a7f)

---

## 4. **#2F8F7A** — Design system primary (sage green)

- **HSL:** `164 50% 37%`  
- **Usage:** Via CSS variable `--primary`; used by `bg-primary`, `text-primary`, `.tally-button-primary`, `--money-in`, `--success`, `--ring`.  
- **Code:** `src/app/globals.css` — `--primary: 164 50% 37%; /* #2F8F7A - sage green */`

![#2F8F7A](https://via.placeholder.com/80x40/2F8F7A/2F8F7A?text=%232F8F7A)

---

## 5. **#E3F1EC** — Soft accent background

- **HSL:** `156 30% 92%`  
- **Usage:** `--accent`; soft green-tinted backgrounds.  
- **Code:** `src/app/globals.css` — `--accent: 156 30% 92%; /* #E3F1EC */`

![#E3F1EC](https://via.placeholder.com/80x40/E3F1EC/E3F1EC?text=%23E3F1EC)

---

## 6. **#E8F5E9** — Mint fallback

- **Usage:** Fallback for `--tally-mint` (e.g. onboarding info box).  
- **Code:** `src/components/OnboardingOverlay.tsx` — `var(--tally-mint,#E8F5E9)`

![#E8F5E9](https://via.placeholder.com/80x40/E8F5E9/E8F5E9?text=%23E8F5E9)

---

## 7. **rgba(41,151,140,0.1)** — 10% #29978C

- **Usage:** Button/outline hover background.  
- **Code:** `src/app/settings/page.tsx` — `hover:bg-[rgba(41,151,140,0.1)]`

---

## 8. **rgba(41,151,140,0.12)** — 12% #29978C

- **Usage:** Selected state background (payment type, quick amount, edit item).  
- **Code:** `src/app/settings/page.tsx`, `src/components/EditItemModal.tsx`, `src/components/AddItemModal.tsx`, `src/components/PaymentTypeSelectorLovable.tsx`

---

## 9. **rgba(41,151,140,0.25)** — 25% #29978C (focus ring)

- **Usage:** Input/select focus ring.  
- **Code:** `src/components/ui/input.tsx`, `src/app/sale/page.tsx`, `src/app/settings/page.tsx`, `src/app/expense/page.tsx`, `src/components/EditTransactionModal.tsx`

---

## 10. **rgba(187,216,211,0.45)** — Date picker selected day

- **Usage:** Selected day background in DateRangePicker.  
- **Code:** `src/components/DateRangePicker.tsx` — `bg-[rgba(187,216,211,0.45)]`

---

## 11. **Light sage (HSL 168 30% 75%)**

- **Usage:** `--money-in-bg`, `--success-bg` (approx. #9EC9C2).  
- **Code:** `src/app/globals.css` — `--money-in-bg: 168 30% 75%;`, `--success-bg: 168 30% 75%;`

---

## Summary

| # | Colour        | Hex / value              | Where defined / used                    |
|---|---------------|--------------------------|----------------------------------------|
| 1 | Main teal     | #29978C                  | Inline in 20+ components                |
| 2 | Hover dark    | #238579                  | Inline hover states                    |
| 3 | Hover variant | #238a7f                  | welcome/page.tsx only                  |
| 4 | Sage primary  | #2F8F7A (--primary)      | globals.css                            |
| 5 | Accent bg     | #E3F1EC (--accent)      | globals.css                            |
| 6 | Mint          | #E8F5E9 (--tally-mint)  | OnboardingOverlay fallback             |
| 7 | 10% teal      | rgba(41,151,140,0.1)    | Settings buttons                       |
| 8 | 12% teal      | rgba(41,151,140,0.12)   | Selected states                        |
| 9 | 25% teal      | rgba(41,151,140,0.25)   | Focus rings                            |
|10 | Date picker   | rgba(187,216,211,0.45)  | DateRangePicker                        |
|11 | Light sage    | HSL 168 30% 75%         | globals.css (--money-in-bg, --success-bg) |

**Total: 11 distinct greens** (12 if you count #238a7f separately).

To see swatches of all of these, open **`public/green-colours-swatches.html`** in your browser.
