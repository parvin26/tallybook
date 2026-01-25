# TALLY MVP - CRITICAL AMENDMENTS

⚠️⚠️⚠️ CRITICAL INSTRUCTIONS ⚠️⚠️⚠️

This codebase HAS EXISTING WORKING FEATURES.

DO NOT:
❌ Rebuild pages from scratch
❌ Refactor working code "to be cleaner"
❌ Change existing component structure
❌ Modify database schema unless explicitly told
❌ Delete files to "start fresh"

DO:
✅ Read existing code first
✅ Add features incrementally
✅ Preserve all existing functionality
✅ Make minimal targeted changes
✅ Test each change doesn't break existing features

IF UNSURE: Ask before modifying existing code.

---

✅ PREREQUISITE COMPLETED:
"Step 0: Compatibility Cleanup" has been run.
- Credit Score Widget removed from home
- PDF functions renamed (no "loan package" language)
- +/– symbols added to formatCurrency
- Defaults verified

---

## AMENDMENT 1: Preserve Existing Code

## AMENDMENT 2: Business Health Score (NEW IMPLEMENTATION)

⚠️ NOTE: Existing CreditScoreWidget was removed in Step 0.

Now BUILD NEW IMPLEMENTATION at /health route (NOT on home page):

CREATE src/app/health/page.tsx

Requirements:
- Access from Settings page button: "Pemeriksaan Perniagaan / Business Check-in"
- Optional: Add to bottom nav as 5th tab (Settings → Health)
- DO NOT link from home page

Visual rules (STRICT):
- Use neutral colors ONLY (white card, gray text)
- NO green gradient
- NO tier badges (Bronze/Gold/Platinum)
- NO red/green colors
- NO gauges or speedometers

Scoring logic:
- Consistency (50%): Days logged in last 14 days
- Clarity (30%): Logged both sale + expense in last 7 days
- Stability (20%): Low variance (optional, keep simple)
- Score 0-100 (not 0-1000)

Language:
- Neutral, descriptive only
- NO: "score dropped", "improve performance", "failed"
- YES: "based on what you logged", "suggestion: log 1 transaction today"

## AMENDMENT 3: Existing Code to Preserve

These features are ALREADY WORKING. DO NOT rewrite them:

✅ KEEP AS-IS (only modify as instructed):
- src/app/page.tsx (home page layout)
- src/app/sale/page.tsx (recording works)
- src/app/expense/page.tsx (recording works)
- src/app/history/page.tsx (viewing works)
- src/app/summary/page.tsx (P&L works)
- src/hooks/useTransactions.ts
- src/hooks/useTodayProfit.ts
- src/components/TransactionList.tsx
- src/components/BottomNav.tsx
- src/lib/supabase/supabaseClient.ts
- src/contexts/BusinessContext.tsx
- Database: businesses + transactions tables

MODIFY MINIMALLY:
- Only add features requested (edit, delete, i18n)
- Do not refactor working code
- Do not change existing component structure
- Preserve all existing functionality

RULE: If unsure whether to modify something → DON'T. Build new alongside existing.
