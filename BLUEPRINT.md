# TALLY — Build Blueprint

Use this document as the full prompt to rebuild this exact website from scratch in another AI tool. It contains a textual summary of the project, the complete tech stack, the database schema, and all architecture diagrams (Mermaid).

---

## 1. PROJECT SUMMARY (TEXTUAL)

**Tally** is a digital ledger web app for small businesses: shops, stalls, and service providers. It is built for daily, casual use—not for accountants. The product helps users record what comes in (sales, payments received) and what goes out (expenses, payments made), and see today’s balance and history.

**Audience:** Small business owners who may not keep formal records, who write in notebooks or rely on memory, or who do not track at all. The app is marketed as “a quiet daily ledger” with “no setup, no complicated screens, no pressure to be perfect.”

**Core flows:**
- **Landing:** A marketing page at `/` explains the value (“When money moves every day… What came in, what went out, and what is left”). CTAs: “Try Tally” (onboarding), “Sign in,” and “Continue where you left off” (when the user has prior usage).
- **Onboarding (no auth):** User picks country → language → optional start/about steps, then enters the app. Country and language are stored in `localStorage` (`tally-country`, `tally-language`).
- **Intro:** After language is set, a one-time intro overlay explains the product. Closing it sets `tally_intro_seen` and sends the user to `/app`.
- **Auth:** Users can use the app as **guests** (data in `localStorage` via `tally-guest-mode`) or **sign in** with Supabase Auth (email/OTP). Guest mode blocks `/login` and `/verify`; authenticated users are redirected from those routes to `/app`.
- **Business:** Authenticated users must have a **business**. If they have none, they are sent to `/setup` to create one. If they have one but have not seen the welcome screen, they are sent to `/welcome` once. The active business id is stored via `lib/businessId.ts` (e.g. in `localStorage`).
- **App home (`/app`):** Shows today’s cash in, cash out, and balance (from `useTodayProfit`); primary actions “Record sale” and “Record expense”; and a short “Recent activity” list (from `useTransactions`). Uses `AppShell` (header + main + bottom nav).
- **Recording:**  
  - **Sale (`/sale`):** Amount, payment type (cash, bank transfer, e-wallets, etc.), optional date, optional attachment, optional inventory deduction. Supports guest (save to `guest-storage`) or Supabase `transactions` insert + optional inventory deduction and attachments.  
  - **Expense (`/expense`):** Amount, category, payment method, optional date/attachment. Same guest vs Supabase split.
- **History:** `/history` lists transactions (from `useTransactions`) with a `TransactionListLovable`; each row can drill into `/transaction/[id]` for detail, edit (modal), and attachments.
- **Stock:** `/stock` lists inventory items per business (`inventory_items`), with add/edit modals and an inventory-history modal. Sales can deduct stock via `inventory_movements` (e.g. `sale_deduction`).
- **Reports & balance:** `/reports` offers links to balance, summary, health. `/balance` shows balance-sheet-style views and can generate a PDF. `/summary` and `/health` use transactions (and business profile) for period summaries and daily health.
- **Other app routes:** `/contacts` (contacts per business: name, phone, type, balance), `/settings` (profile, PWA install, language, sign out, data import/export), `/help`.
- **Public:** `/about`, `/privacy`, `/terms` are public; no auth required.

**Product principles:** Minimal setup, simple screens, mobile-friendly (PWA), multilingual (i18next: English, Bahasa Malaysia, Krio). Data is scoped by business and (when authenticated) by Supabase user; guests use only local storage until/unless they later sign in and import.

---

## 2. FULL TECH STACK

Install and use these exact dependencies and versions where possible.

**Runtime / framework**
- Next.js 16.1.3 (App Router)
- React 19.2.3, React DOM 19.2.3

**Styling**
- Tailwind CSS 3.4.17
- clsx 2.1.1
- tailwind-merge 2.5.5

**Backend & auth**
- Supabase: @supabase/supabase-js 2.39.0, @supabase/ssr 0.5.2

**Data & state**
- TanStack React Query 5.0.0

**Forms & validation**
- React Hook Form 7.0.0
- @hookform/resolvers 3.0.0
- Zod 3.0.0

**i18n**
- i18next 23.7.0
- react-i18next 13.5.0

**Charts & documents**
- Recharts 2.10.0
- jspdf 2.0.0

**UI & feedback**
- Lucide React 0.468.0 (icons)
- Sonner 1.0.0 (toasts)

**Utilities**
- date-fns 3.0.0
- next-pwa 5.6.0 (PWA)

**Dev / build**
- TypeScript 5
- ESLint 9, eslint-config-next 16.1.3
- PostCSS 10.4.20, Autoprefixer 10.4.20

**Environment:** Next.js runs with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`). Optional: `NEXT_PUBLIC_ALLOW_TEST_MODE=true` for test-mode bypass in auth.

---

## 3. DATABASE SCHEMA (SUPABASE / POSTGRES)

Schema lives in the `public` schema. Auth uses Supabase’s `auth.users`. All UUIDs use `gen_random_uuid()` unless noted.

### 3.1 `public.businesses`

| Column           | Type      | Nullable | Default / notes                    |
|------------------|-----------|----------|------------------------------------|
| id               | uuid      | NO       | PK, default gen_random_uuid()     |
| user_id          | uuid      | NO       | References auth.users(id)          |
| name             | text      | NO       | Business display name              |
| business_type    | text      | NO       | e.g. retail, stall, services       |
| state            | text      | NO       | e.g. Malaysian state / region     |
| city             | text      | YES      |                                    |
| starting_cash   | numeric   | NO       | Opening cash balance               |
| starting_bank   | numeric   | NO       | Opening bank balance               |
| is_active       | boolean   | NO       | Default true                       |
| created_at       | timestamptz | YES    | default now()                      |
| updated_at       | timestamptz | YES    | default now()                      |

Indexes / RLS: index on `user_id`; RLS policies so users see only their businesses (or per your auth model).

### 3.2 `public.transactions`

| Column            | Type      | Nullable | Default / notes                    |
|-------------------|-----------|----------|------------------------------------|
| id                | uuid      | NO       | PK, default gen_random_uuid()     |
| business_id       | uuid      | NO       | FK to businesses(id)               |
| transaction_type | text      | NO       | 'sale' \| 'expense' \| 'payment_received' \| 'payment_made' |
| amount            | numeric   | NO       | Always positive                    |
| payment_type      | text      | NO       | 'cash' \| 'bank_transfer' \| 'duitnow' \| 'tng' \| 'boost' \| 'grabpay' \| 'shopeepay' \| 'credit' |
| payment_method    | text      | YES      | 'cash' \| 'bank_transfer' \| 'card' \| 'e_wallet' (for expenses) |
| payment_provider  | text      | YES      | e.g. Maybank, Visa, DuitNow        |
| payment_reference | text      | YES      | Reference or last 4 digits         |
| expense_category  | text      | YES      | For expense transactions           |
| notes             | text      | YES      |                                    |
| transaction_date  | date/text | NO       | ISO date of the transaction        |
| created_at        | timestamptz | YES    | default now()                      |
| updated_at        | timestamptz | YES    | default now()                      |
| deleted_at        | timestamptz | YES    | Soft delete; null = active        |

Indexes: e.g. (business_id, transaction_date), (business_id, payment_method). RLS by business_id and user via businesses.

### 3.3 `public.inventory_items`

| Column              | Type      | Nullable | Default / notes                |
|---------------------|-----------|----------|--------------------------------|
| id                  | uuid      | NO       | PK, default gen_random_uuid()  |
| business_id         | uuid      | NO       | FK to businesses(id)           |
| name                | text      | NO       | Item name                      |
| quantity            | numeric   | NO       | default 0                      |
| unit                | text      | NO       | e.g. 'pcs','pack','kg','g','l','ml' |
| low_stock_threshold | numeric   | YES      | Alert when quantity <= this    |
| created_at          | timestamptz | YES   | default now()                  |
| updated_at          | timestamptz | YES   | default now()                  |

Index: business_id. RLS per business.

### 3.4 `public.inventory_movements`

| Column                 | Type      | Nullable | Default / notes                |
|------------------------|-----------|----------|--------------------------------|
| id                     | uuid      | NO       | PK, default gen_random_uuid()  |
| inventory_item_id      | uuid      | NO       | FK to inventory_items(id) ON DELETE CASCADE |
| business_id            | uuid      | NO       | Denormalized for filtering    |
| movement_type          | text      | NO       | 'opening' \| 'adjustment' \| 'sale_deduction' \| 'expense_addition' \| 'manual_addition' \| 'manual_removal' \| 'restock_add' (or equivalent enum) |
| quantity_delta         | numeric   | NO       | Positive = add, negative = subtract |
| unit                   | text      | NO       | Same as item’s unit            |
| related_transaction_id | uuid      | YES      | FK to transactions(id)         |
| notes                  | text      | YES      |                                |
| occurred_at            | timestamptz | YES   | default now()                  |
| created_at             | timestamptz | YES   | default now()                  |

Indexes: inventory_item_id, business_id. RLS per business.

### 3.5 `public.transaction_attachments`

| Column        | Type      | Nullable | Default / notes                |
|---------------|-----------|----------|--------------------------------|
| id            | uuid      | NO       | PK, default gen_random_uuid()  |
| transaction_id| uuid      | NO       | FK to transactions(id) ON DELETE CASCADE |
| business_id   | uuid      | NO       |                                |
| storage_path  | text      | NO       | Path in Supabase Storage       |
| filename      | text      | NO       | Original filename              |
| mime_type     | text      | NO       | e.g. image/jpeg, application/pdf |
| size_bytes    | bigint    | NO       |                                |
| created_at    | timestamptz | YES   | default now()                  |

Indexes: transaction_id, business_id. RLS per business. Storage: private bucket `tally-attachments`, keyed by business_id and transaction_id.

### 3.6 `public.contacts`

| Column       | Type      | Nullable | Default / notes                |
|--------------|-----------|----------|--------------------------------|
| id           | uuid      | NO       | PK, default gen_random_uuid()  |
| business_id  | uuid      | NO       | FK to businesses(id)          |
| name         | text      | NO       |                                |
| phone        | text      | YES      |                                |
| contact_type | text      | NO       | e.g. 'customer'                |
| balance      | numeric   | YES      | default 0                      |
| created_at   | timestamptz | YES   | default now()                  |
| updated_at   | timestamptz | YES   | default now()                  |

Index: business_id. RLS per business.

### 3.7 Auth

- Use Supabase Auth; `auth.users` is managed by Supabase.
- Link `businesses.user_id` to `auth.users.id` in app logic and RLS.

---

## 4. MERMAID DIAGRAMS

Paste these into any Mermaid-compatible viewer (e.g. GitHub, Notion, Mermaid Live) to reproduce the architecture.

### 4.1 File structure

```mermaid
flowchart TB
    subgraph root["tally/"]
        next["next.config.ts"]
        mid["middleware.ts"]
        pkg["package.json"]
        tail["tailwind.config.ts"]
        post["postcss.config.mjs"]
        public["public/"]
        src["src/"]
        scripts["scripts/"]
    end

    subgraph public["public/"]
        manifest["manifest.json"]
        static["*.svg, favicon"]
    end

    subgraph src["src/"]
        app["app/"]
        components["components/"]
        contexts["contexts/"]
        hooks["hooks/"]
        i18n["i18n/"]
        lib["lib/"]
        styles["styles/"]
        types["types/"]
        assets["assets/"]
    end

    subgraph app["app/"]
        layout["layout.tsx"]
        providers["providers.tsx"]
        page["page.tsx (marketing /)"]
        globals["globals.css"]
        subgraph routes["Routes"]
            onboarding["onboarding/"]
            app_page["app/page.tsx (/app)"]
            login["login/"]
            verify["verify/"]
            welcome["welcome/"]
            setup["setup/"]
            sale["sale/"]
            expense["expense/"]
            history["history/"]
            stock["stock/"]
            reports["reports/"]
            settings["settings/"]
            balance["balance/"]
            summary["summary/"]
            contacts["contacts/"]
            health["health/"]
            help["help/"]
            transaction["transaction/[id]/"]
            about["about/"]
            privacy["privacy/"]
            terms["terms/"]
        end
    end

    subgraph onboarding["onboarding/"]
        start["start/page.tsx"]
        country["country/page.tsx"]
        language["language/page.tsx"]
        about_onb["about/page.tsx"]
    end

    subgraph components["components/"]
        ui["ui/"]
        shell["AppShell, BottomNav, AppHeader"]
        modals["AddItemModal, EditItemModal, EditTransactionModal"]
        inputs["AmountInput, DatePickerLovable, QuickAmountSelectorLovable"]
        lists["TransactionListLovable, SummaryCardLovable"]
        auth["AuthGuard, TallyLogo"]
        overlay["IntroOverlay, OnboardingOverlay"]
    end

    subgraph ui["ui/"]
        button["button.tsx"]
        card["card.tsx"]
        dialog["dialog.tsx"]
        input["input.tsx"]
        select["select.tsx"]
        badge["badge.tsx"]
    end

    subgraph contexts["contexts/"]
        Auth["AuthContext.tsx"]
        Business["BusinessContext.tsx"]
        Intro["IntroContext.tsx"]
    end

    subgraph hooks["hooks/"]
        useTx["useTransactions"]
        useProfit["useTodayProfit"]
        useMonth["useMonthSummary"]
        useWeek["useWeekSummary"]
        useBestDay["useBestDay"]
    end

    subgraph lib["lib/"]
        supabase["supabase/supabaseClient.ts"]
        guest["guest-storage.ts"]
        businessId["businessId.ts"]
        businessProfile["businessProfile.ts"]
        inventory["inventory.ts"]
        attachments["attachments.ts"]
        pdf["pdf-generator.ts"]
        pwa["pwa.ts"]
        telemetry["telemetry.ts"]
        utils["utils.ts"]
        translations["translations.ts"]
    end

    subgraph i18n["i18n/"]
        config["config.ts"]
        locales["locales/en.json, bm.json, krio.json"]
    end

    subgraph types["types/"]
        index["index.ts (Business, Transaction)"]
        stock["stock.ts (InventoryItem)"]
    end

    root --> src
    src --> app
    src --> components
    src --> contexts
    src --> hooks
    src --> lib
    src --> i18n
    src --> types
```

### 4.2 Component hierarchy

```mermaid
flowchart TB
    subgraph RootLayout["layout.tsx"]
        HTML["<html>"]
        Body["<body>"]
        HTML --> Body
    end

    subgraph Providers["providers.tsx"]
        QClient["QueryClientProvider"]
        AuthP["AuthProvider"]
        BizP["BusinessProvider"]
        IntroP["IntroProvider"]
        QClient --> AuthP
        AuthP --> BizP
        BizP --> IntroP
    end

    subgraph Conditional["Intro decision"]
        IntroOverlayOnly["IntroOverlay + placeholder"]
        AuthGuardWrap["AuthGuard"]
        IntroP --> IntroOverlayOnly
        IntroP --> AuthGuardWrap
    end

    subgraph AuthGuardChildren["Inside AuthGuard"]
        PageChildren["{children} = current route page"]
        IntroOverlay2["IntroOverlay"]
        Telemetry["TelemetryConsent"]
        GuestImport["GuestDataImport"]
        Toaster["Toaster (sonner)"]
    end

    Body --> Providers
    IntroP --> PageChildren
    AuthGuardWrap --> PageChildren
    AuthGuardWrap --> IntroOverlay2
    AuthGuardWrap --> Telemetry
    AuthGuardWrap --> GuestImport
    AuthGuardWrap --> Toaster

    subgraph AppShellLayout["Pages using AppShell"]
        AppShell["AppShell"]
        AppHeader["AppHeader"]
        BottomNav["BottomNav"]
        MainContent["<main> Page content"]
        AppShell --> AppHeader
        AppShell --> MainContent
        AppShell --> BottomNav
    end

    subgraph AppHome["/app (AppHomePage)"]
        HomeHeader["HomeHeader"]
        SummaryCard["SummaryCardLovable"]
        TxList["TransactionListLovable"]
        ContinueChoice["ContinueChoice"]
    end

    subgraph SalePage["/sale"]
        AmountInput["AmountInput"]
        QuickAmount["QuickAmountSelectorLovable"]
        PaymentType["PaymentTypeSelectorLovable"]
        Attachment["AttachmentInputLovable"]
        DatePicker["DatePickerLovable"]
    end

    subgraph ExpensePage["/expense"]
        AmountInputE["AmountInput"]
        QuickAmountE["QuickAmountSelectorLovable"]
        Category["CategorySelectorLovable"]
        PaymentMethod["PaymentMethodSelector"]
        AttachmentE["AttachmentInputLovable"]
        DatePickerE["DatePickerLovable"]
    end

    subgraph StockPage["/stock"]
        AddItem["AddItemModal"]
        EditItem["EditItemModal"]
        InvHistory["InventoryHistoryModal"]
        Card["Card, CardContent"]
    end

    subgraph HistoryPage["/history"]
        TxListHistory["TransactionListLovable"]
    end

    subgraph TransactionDetail["/transaction/[id]"]
        EditTx["EditTransactionModal"]
        AttViewer["AttachmentViewer"]
    end

    PageChildren --> AppShellLayout
    MainContent --> AppHome
    MainContent --> SalePage
    MainContent --> ExpensePage
    MainContent --> StockPage
    MainContent --> HistoryPage
    MainContent --> TransactionDetail
```

### 4.3 Data flow (storage → app)

```mermaid
flowchart LR
    subgraph Storage
        Supabase["Supabase (Postgres)"]
        LocalStorage["localStorage"]
        SessionStorage["sessionStorage"]
    end

    subgraph SupabaseTables["Supabase tables (conceptual)"]
        users["auth.users"]
        businesses["businesses"]
        transactions["transactions"]
        inventory["inventory items"]
        attachments["attachments"]
    end

    subgraph ClientLib["lib/"]
        supabaseClient["supabaseClient"]
        guestStorage["guest-storage"]
        businessId["businessId"]
        businessProfile["businessProfile"]
        inventoryLib["inventory"]
        attachmentsLib["attachments"]
    end

    subgraph Contexts["Contexts"]
        AuthContext["AuthContext"]
        BusinessContext["BusinessContext"]
        IntroContext["IntroContext"]
    end

    subgraph Hooks["Data hooks"]
        useTransactions["useTransactions"]
        useTodayProfit["useTodayProfit"]
        useMonthSummary["useMonthSummary"]
        useWeekSummary["useWeekSummary"]
        useBestDay["useBestDay"]
    end

    subgraph Pages["Pages / Components"]
        PagesConsume["Pages consume hooks & context"]
    end

    Supabase --> supabaseClient
    LocalStorage --> guestStorage
    LocalStorage --> businessId
    SessionStorage --> AuthContext

    supabaseClient --> AuthContext
    supabaseClient --> BusinessContext
    guestStorage --> AuthContext
    businessId --> BusinessContext

    AuthContext --> PagesConsume
    BusinessContext --> PagesConsume
    IntroContext --> PagesConsume

    supabaseClient --> useTransactions
    supabaseClient --> useTodayProfit
    supabaseClient --> useMonthSummary
    supabaseClient --> useWeekSummary
    supabaseClient --> useBestDay
    BusinessContext --> useTransactions
    BusinessContext --> useTodayProfit
    guestStorage --> useTransactions

    useTransactions --> PagesConsume
    useTodayProfit --> PagesConsume
    useMonthSummary --> PagesConsume
    useWeekSummary --> PagesConsume
    useBestDay --> PagesConsume

    inventoryLib --> sale["/sale, /stock"]
    businessProfile --> balance["/balance, /reports, /summary"]
    attachmentsLib --> sale
    attachmentsLib --> expense["/expense"]
```

### 4.4 Auth and React Query flow

```mermaid
flowchart TB
    subgraph AuthFlow["Auth & business resolution"]
        A1["Supabase auth.getSession()"]
        A2["Check guest-storage (tally-guest-mode)"]
        A3["AuthContext: user, session, authMode"]
        A4["BusinessContext: loadBusiness() via business_id / dev bypass"]
        A5["businessId.ts + localStorage active business"]
        A1 --> A3
        A2 --> A3
        A3 --> A4
        A4 --> A5
    end

    subgraph QueryFlow["React Query flow"]
        Q1["QueryClientProvider (staleTime 60s)"]
        Q2["useTransactions: ['transactions', businessId, guestMode]"]
        Q3["useTodayProfit: ['todayProfit', businessId, today]"]
        Q4["Supabase .from('transactions').select().eq('business_id')"]
        Q1 --> Q2
        Q1 --> Q3
        Q2 --> Q4
        Q3 --> Q4
    end

    subgraph LocalKeys["Key localStorage keys"]
        K1["tally-country"]
        K2["tally-language"]
        K3["tally_intro_seen"]
        K4["tally-welcome-seen"]
        K5["tally-guest-mode"]
        K6["active business id (via businessId.ts)"]
    end
```

### 4.5 Routing and navigation

```mermaid
flowchart TB
    subgraph Entry["Entry"]
        Root["/"]
        Root --> Marketing["Marketing page (page.tsx)"]
        Root --> |"Try Tally"| Onboarding
        Root --> |"Sign in"| Login["/app/login"]
        Root --> |"Continue where you left off"| App["/app"]
    end

    subgraph Onboarding["Onboarding (no auth)"]
        Country["/onboarding/country"]
        Language["/onboarding/language"]
        Start["/onboarding/start"]
        About["/onboarding/about"]
        Country --> Language
        Language --> Start
        Start --> About
    end

    subgraph Auth["Auth & setup"]
        Login["/login or /app/login"]
        Verify["/verify"]
        Welcome["/welcome"]
        Setup["/setup"]
        Login --> Verify
        Verify --> Welcome
        Welcome --> App
        Setup --> App
    end

    subgraph AppRoutes["App routes (AuthGuard allows)"]
        AppHome["/app (home)"]
        Sale["/sale"]
        Expense["/expense"]
        History["/history"]
        Stock["/stock"]
        Reports["/reports"]
        Settings["/settings"]
        Balance["/balance"]
        Summary["/summary"]
        Contacts["/contacts"]
        Health["/health"]
        Help["/help"]
        TransactionId["/transaction/[id]"]
    end

    subgraph Public["Public (no auth)"]
        About["/about"]
        Privacy["/privacy"]
        Terms["/terms"]
    end

    subgraph BottomNavLinks["BottomNav links"]
        NavHome["/ (Home)"]
        NavHistory["/history"]
        NavStock["/stock"]
        NavReports["/reports"]
        NavSettings["/settings"]
    end

    subgraph AuthGuardLogic["AuthGuard logic"]
        AG1["Static paths → pass"]
        AG2["Onboarding → pass"]
        AG3["Public /about, /privacy, /terms → pass"]
        AG4["Intro not seen → wait (no redirect)"]
        AG5["Guest: /login, /verify → redirect /app"]
        AG6["Authenticated: /login, /verify → redirect /app"]
        AG7["Unknown + not loading: !/ and !/app → redirect /login"]
        AG8["User + business + !welcome-seen → /welcome"]
        AG9["User + !business + !/setup → /setup"]
        AG10["User + business + /login|/setup|/verify → /app"]
    end

    Onboarding --> App
    App --> AppHome
    AppHome --> Sale
    AppHome --> Expense
    AppHome --> History
    AppHome --> Stock
    AppHome --> Reports
    AppHome --> Settings
    History --> TransactionId
```

### 4.6 Route → page mapping

```mermaid
flowchart LR
    subgraph PageToRoute["Route → Page component"]
        R1["/"] --> P1["MarketingPage"]
        R2["/onboarding/country"] --> P2["CountryPage"]
        R3["/onboarding/language"] --> P3["LanguagePage"]
        R4["/app"] --> P4["AppHomePage"]
        R5["/login"] --> P5["LoginPage"]
        R6["/setup"] --> P6["SetupPage"]
        R7["/sale"] --> P7["SalePage"]
        R8["/expense"] --> P8["ExpensePage"]
        R9["/history"] --> P9["HistoryPage"]
        R10["/stock"] --> P10["StockPage"]
        R11["/reports"] --> P11["ReportsPage"]
        R12["/settings"] --> P12["SettingsPage"]
        R13["/transaction/[id]"] --> P13["TransactionDetailPage"]
    end
```

---

## 5. IMPLEMENTATION NOTES FOR REBUILD

1. **Provider order (outer → inner):** QueryClientProvider → AuthProvider → BusinessProvider → IntroProvider → AuthGuard. Inside AuthGuard render: route children, IntroOverlay, TelemetryConsent, GuestDataImport, Toaster.
2. **AuthGuard rules:** Do not redirect on static paths, onboarding, or public routes. If intro is not seen, do not redirect. Guest → allow app, redirect /login and /verify to /app. Authenticated → same redirect from /login, /verify. Unknown + not loading + not / or /app → redirect to /login. User + business + welcome not seen → /welcome. User + no business + not /setup → /setup. User + business + on /login, /setup, /verify → /app.
3. **Middleware:** Matcher excludes `_next`, favicon, icons, brand, manifest, and static file extensions; handler returns `NextResponse.next()`.
4. **Guest data:** Store guest transactions (and optionally other guest state) in `localStorage` under a stable key; structure should match the Transaction shape so `GuestDataImport` can later push them to Supabase when the user signs in.
5. **i18n:** Init i18next in a client entry (e.g. `providers` or a dedicated `i18n/config`) with resources for `en`, `bm`, `krio`; set `lng` from `localStorage.getItem('tally-language') || 'en'`.
6. **PWA:** Use next-pwa and a `manifest.json` in `public`; theme color #10b981; offer install from settings and detect standalone/capabilities via `lib/pwa`.

Use this blueprint as the single source of truth to recreate the Tally app in another AI builder or environment.
