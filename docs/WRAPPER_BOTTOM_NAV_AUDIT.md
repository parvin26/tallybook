# Wrapper and Bottom Navigation Layout Audit

**Scope:** UI issue where attachments container appears clipped/mis-sized, bottom tab bar overlaps content, and Notes textarea/attachments block sit in a wrapper that does not respect safe areas or viewport height. Audit only; no fixes implemented.

---

## SECTION 1: REPRO AND OBSERVED BEHAVIOR

### What is wrong in the screenshot

1. **Bottom tab bar overlaps content:** The fixed bottom navigation (Home, Records, Stock, Reports, Account) is drawn on top of the main content. The "Notes (optional)" textarea and its "Add any notes..." placeholder are partially or fully covered by the tab bar, so the textarea’s bottom edge (or content area) sits underneath the nav.

2. **Attachments container clipped or mis-sized:** The attachments block (e.g. "ChatGPT Image…png", "DPI Sketch.pdf" with remove "x") may appear constrained—either the list area is too short, or the overall attachments section does not get enough vertical space relative to the viewport, contributing to the feeling that content is cramped above the nav.

3. **Wrapper not respecting safe areas or viewport height:** The area containing attachments and the Notes textarea behaves as if it assumes a full viewport height without reserving space for (a) the fixed bottom nav, (b) safe-area insets (e.g. iOS home indicator), or (c) the dynamic mobile viewport (e.g. browser chrome, keyboard). As a result, when the user scrolls to the notes/attachments section, that content ends up in the same vertical band as the nav and is overlapped by it.

### Steps to reproduce (app navigation)

1. Open the app on a mobile viewport (or narrow browser window) so the bottom nav is visible.
2. Go to **Record Sale** or **Record Expense** (e.g. from Home → Record Sale, or via bottom nav → Records then add, or direct route `/sale` or `/expense`).
3. Scroll down so the **Attachments** block and **Notes (optional)** textarea are in view.
4. Observe: the bottom tab bar remains fixed at the bottom of the viewport and overlaps the Notes textarea (and possibly the lower part of the attachments list).
5. Optional: Add one or more attachments and confirm the attachments list and notes area still sit under or immediately against the tab bar when scrolled into view.

---

## SECTION 2: WRAPPER AND LAYOUT TREE

### Component tree (root layout down to this page)

```
RootLayout (src/app/layout.tsx)
  └─ html > body (globals.css: body padding-top/bottom env(safe-area-inset-*))
       └─ Providers
            └─ IntroOrApp
                 └─ [route segment: e.g. app/sale/page or app/expense/page]
                      └─ AppShell (src/components/AppShell.tsx)
                           ├─ div (min-h-screen bg-[var(--tally-bg)])
                           │    ├─ div (sticky top-0 z-40) → AppHeader
                           │    ├─ main (min-h-[60vh], paddingBottom: calc(88px + env(safe-area-inset-bottom, 0px) + 48px))
                           │    │    └─ {children}  ← page content
                           │    └─ (sibling) BottomNav
                           └─ [page content]
```

For **sale** or **expense** page, `{children}` is:

```
main
  └─ div.max-w-[480px].mx-auto.px-6.py-6.pb-48.space-y-6
       ├─ Amount, Quick amounts, Date, Payment type, Stock (sale) / Category (expense), etc.
       ├─ AttachmentInputLovable (attachments block)
       ├─ Notes textarea
       ├─ Save button (mt-8)
       └─ div.h-24.w-full.shrink-0  (spacer)
```

### DOM and CSS layout at wrapper level

| Element | Location | Layout / height / overflow | Notes |
|--------|----------|-----------------------------|--------|
| **body** | globals.css L68–72 | `padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom);` | No height constraint; document scroll. |
| **AppShell outer div** | AppShell.tsx L23 | `min-h-screen` (Tailwind → `min-height: 100vh`), no overflow | Wrapper grows with content. |
| **main** | AppShell.tsx L26–32 | `min-h-[60vh]`, inline `paddingBottom: calc(88px + env(safe-area-inset-bottom, 0px) + 48px)` | No overflow; padding intended to reserve space for nav + gap. |
| **BottomNav** | BottomNav.tsx L22–27 | `position: fixed; bottom: 0; left: 0; right: 0; z-50`, `height: 88px`, `paddingBottom: env(safe-area-inset-bottom)` | Out of flow; overlays content at viewport bottom. |
| **Page content div (sale/expense)** | sale/page.tsx L285, expense/page.tsx L207 | `max-w-[480px] mx-auto px-6 py-6 pb-48 space-y-6` | No fixed height; `pb-48` (192px) + internal spacer `h-24` (96px). |
| **AttachmentInputLovable** | AttachmentInputLovable.tsx L55–121 | `space-y-3`; list is `space-y-2`; no max-height or overflow on container | No explicit height; can grow with files. |
| **Notes textarea** | sale L428–434, expense L311–317 | `rows={3}`, full width, no max-height | Normal flow. |

Scroll container: **body** (default document scroll). There is no inner scroll container (e.g. no `overflow-auto` + fixed height on main or content div) in this path. So in principle, main’s `paddingBottom` should sit below the content div and be the region the fixed nav covers when scrolled to the bottom.

---

## SECTION 3: ACTIONS REQUESTED VS ACTIONS DONE

| Requested action | Where requested | What was implemented | What is not done / incomplete | Evidence |
|------------------|-----------------|----------------------|-------------------------------|----------|
| Reserve space so last content (e.g. Save button) stays above fixed nav | Conversation summary: "Global Footer Overlap Fix" | AppShell: `main` has `paddingBottom: calc(NAV_HEIGHT + env(safe-area-inset-bottom) + BOTTOM_GAP)` (AppShell.tsx L26–30). Sale/expense: content div has `pb-48`, and a spacer `div.h-24` after Save (sale L453–454, expense L334–335). | Padding may still be insufficient on short viewports when user scrolls to notes/attachments; or 100vh vs visual viewport causes layout to end “under” the nav. | AppShell.tsx L7–9, L26–32; sale L285, L453–454; expense L207, L334–335. |
| Prevent footer overlapping main content | Same | Same as above: main paddingBottom + page-level pb-48 and h-24 spacer. | Overlap still occurs for Notes/attachments when they are in the visible viewport with the nav. | As above. |
| Use safe-area insets | Implied by mobile layout | Body: `padding-top/bottom: env(safe-area-inset-*)` (globals.css L71–72). Main: `env(safe-area-inset-bottom)` in paddingBottom. BottomNav: `paddingBottom: env(safe-area-inset-bottom)`. | Not verified on real iOS/Android; no use of `100dvh` or similar for viewport height. | globals.css L68–72; AppShell L30; BottomNav L27. |
| Sufficient bottom padding on sale/expense | Same | `pb-48` (192px) on content div + 96px spacer. | Total reserve (288px from content + main’s ~136px + safe-area) may still be less than needed when notes/attachments are “in view” on short viewports, or viewport height (100vh) may not match visual viewport. | sale L285, L453–454; expense L207, L334–335. |

No separate written “request” docs were found in-repo; the mapping above is from the conversation summary and current code.

---

## SECTION 4: ROOT CAUSE ANALYSIS

Ranked by likelihood:

**1. 100vh vs visual viewport on mobile (min-h-screen, no 100dvh)**  
- **Evidence:** AppShell outer div uses `min-h-screen` (Tailwind = `min-height: 100vh`). Only IntroOverlay uses `max-h-[100dvh]` (IntroOverlay.tsx L318). On mobile, `100vh` is the large viewport (includes browser chrome); when the URL bar hides, the visible viewport shrinks but `100vh` does not, so the “bottom” of the layout can extend below what the user sees. Content can then appear to end under the fixed nav from the user’s perspective.  
- **Missing:** No measurement of actual computed height vs visual viewport on target devices.  
- **Conclusion:** Likely contributor: layout height and “bottom” are tied to `100vh`, not the dynamic viewport.

**2. Padding reserve is below the fold when notes are in view**  
- **Evidence:** main’s `paddingBottom` is correct in value (88 + safe-area + 48). Sale/expense add pb-48 + h-24. So the reserved space is at the very end of the document. When the user scrolls so that the Notes textarea is “in view” (e.g. centered or in the lower half of the screen), the viewport can show both notes and the fixed nav; the nav is drawn on top of whatever is in that band, including the textarea. So the issue is not that padding is missing, but that for a typical scroll position that brings notes into view, the notes sit in the same vertical band as the nav.  
- **Missing:** No guarantee that “scroll to show notes” implies “notes are entirely above the nav.” On short viewports, the amount of content below the notes (Save + spacer + padding) may not push the notes high enough.  
- **Conclusion:** Likely: reserve is at document end; notes/attachments are not given a dedicated “safe” band above the nav for the common “notes in view” scroll position.

**3. Body safe-area padding and fixed nav interaction**  
- **Evidence:** body has `padding-bottom: env(safe-area-inset-bottom)`. BottomNav is `position: fixed` to the viewport. So the nav sticks to the viewport bottom; the document extends into body’s padding. The fixed nav does not sit “inside” the padded body; it overlays the viewport. So when content is long, the last part of the document (including main’s padding) is in the body’s padded region. If the user has scrolled so that the viewport shows notes + nav, the notes are in normal flow and can sit under the nav.  
- **Conclusion:** Contributes only indirectly; the main issue is where the notes sit relative to the viewport when the user scrolls to them.

**4. No explicit “content band” or min distance from nav**  
- **Evidence:** There is no rule that keeps the attachments + notes block a minimum distance above the bottom of the viewport (e.g. “last focusable content must be at least nav height + gap above viewport bottom”). Layout relies on a single block of padding at the end of the page.  
- **Conclusion:** So when notes/attachments are in view, they can legally sit in the overlap zone; nothing prevents it.

**5. Attachments container has no max-height / overflow**  
- **Evidence:** AttachmentInputLovable is `space-y-3` with a list in `space-y-2`; no `max-height` or `overflow` on the attachments list. So it does not appear to be “clipped” by a small box; it grows with content.  
- **Missing:** If in some code path the attachments are inside a fixed-height or overflow-hidden wrapper, that could cause clipping; that path was not found in the sale/expense flow.  
- **Conclusion:** “Clipped or mis-sized” may be the visual effect of the whole block (attachments + notes) being pushed into the nav overlap zone rather than the attachments list having its own height constraint.

---

## SECTION 5: FIX OPTIONS (DO NOT IMPLEMENT)

**Option A: Increase main paddingBottom and/or page-level bottom reserve**

- **Change:** In AppShell, increase `BOTTOM_GAP` or the effective `paddingBottom` (e.g. NAV_HEIGHT + safe-area + 72px or 96px). Optionally increase sale/expense `pb-48` to `pb-56`/`pb-64` and/or the spacer from `h-24` to `h-32` so that when the user scrolls to the notes, there is more empty space below the notes before the nav.
- **Why it helps:** More reserve at the bottom pushes the “end of content” further down the document, so when the user scrolls to see the notes, the notes are more likely to sit above the nav.
- **Risks:** More blank space when scrolled to bottom; may need tuning per breakpoint.
- **Test:** On a short mobile viewport (e.g. 600px height), open sale/expense, scroll until Notes and attachments are visible; confirm notes and attachments are fully above the tab bar and not overlapped.

**Option B: Use 100dvh (or similar) for shell min-height and ensure reserve matches visual bottom**

- **Change:** Replace AppShell’s `min-h-screen` with a class or style using `min-height: 100dvh` (or a CSS variable that uses `100dvh` with fallback to `100vh`) so the shell height tracks the dynamic viewport. Optionally add a small JS/CSS check so the bottom reserve (main’s paddingBottom) is at least the nav height + safe-area + gap relative to the visible viewport.
- **Why it helps:** Aligns layout height with what the user actually sees, reducing the “layout bottom below visual bottom” effect and making the reserved area line up with the nav.
- **Risks:** `100dvh` support and fallbacks; possible reflow on resize.
- **Test:** Same as A on mobile; also resize browser or toggle mobile browser UI and confirm no overlap and no double scrollbars.

**Option C: Dedicated “above nav” band for forms (sale/expense)**

- **Change:** On sale/expense, wrap the attachments + notes (and Save + spacer) in a container that has a minimum bottom margin or padding equal to `NAV_HEIGHT + env(safe-area-inset-bottom) + BOTTOM_GAP` (or a larger value), so that the “form bottom” is always at least that far from the viewport bottom when that section is in view. Alternatively, add a sticky/fixed spacer at the bottom of the form that has height equal to nav + gap so it stays above the nav when scrolling.
- **Why it helps:** Explicitly keeps the form block (attachments + notes) out of the overlap zone when the user scrolls to it.
- **Risks:** Only applies to sale/expense; other AppShell pages would still rely on global padding.
- **Test:** Same as A; also confirm Save button and spacer still behave correctly when scrolled to bottom.

---

AUDIT COMPLETE. NO CHANGES IMPLEMENTED.
