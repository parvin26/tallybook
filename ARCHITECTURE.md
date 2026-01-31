# Tally — Website Architecture

This document outlines the Tally project's architecture for export to other AI builders. It includes file structure, component hierarchy, data flow, routing, and tech stack.

---

## Tech Stack (from package.json)

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16.1.3 (App Router) |
| **UI** | React 19.2.3, React DOM 19.2.3 |
| **Styling** | Tailwind CSS 3.4.17, clsx 2.1.1, tailwind-merge 2.5.5 |
| **Backend / Auth** | Supabase (@supabase/supabase-js 2.39.0, @supabase/ssr 0.5.2) |
| **Data & State** | TanStack React Query 5.0.0 |
| **Forms** | React Hook Form 7.0.0, @hookform/resolvers 3.0.0, Zod 3.0.0 |
| **i18n** | i18next 23.7.0, react-i18next 13.5.0 |
| **Charts / PDF** | Recharts 2.10.0, jspdf 2.0.0 |
| **Icons** | Lucide React 0.468.0 |
| **Notifications** | Sonner 1.0.0 |
| **Dates** | date-fns 3.0.0 |
| **PWA** | next-pwa 5.6.0 |
| **Dev / Build** | TypeScript 5, ESLint 9, PostCSS 10.4.20, Autoprefixer 10.4.20 |

---

## 1. File Structure (Mermaid)

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

---

## 2. Component Hierarchy (Mermaid)

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

---

## 3. Data Flow (Mermaid)

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

---

## 4. Routing & Navigation (Mermaid)

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

## 5. Middleware

- **File:** `middleware.ts` at project root.
- **Matcher:** All paths except `_next`, `favicon.ico`, `icons`, `brand`, `manifest.json`, and static file extensions.
- **Behavior:** For matched routes, calls `NextResponse.next()` (no redirects). Static paths are explicitly passed through.

---

## 6. Provider Nesting Order

From outer to inner:

1. `QueryClientProvider`
2. `AuthProvider`
3. `BusinessProvider`
4. `IntroProvider`
5. `AuthGuard` (when intro decision is made)
   - `children` (route content)
   - `IntroOverlay`
   - `TelemetryConsent`
   - `GuestDataImport`
   - `Toaster`

---

## 7. Key Paths Summary

| Path | Purpose |
|------|--------|
| `/` | Marketing / landing |
| `/onboarding/country` | Choose country |
| `/onboarding/language` | Choose language |
| `/onboarding/start`, `/onboarding/about` | Onboarding steps |
| `/app` | App home (after intro/onboarding) |
| `/login` | Sign in (or guest entry) |
| `/verify` | OTP / verification |
| `/welcome` | First-time welcome (authenticated + business) |
| `/setup` | Create/select business (authenticated, no business) |
| `/sale`, `/expense` | Record sale / expense |
| `/history` | Transaction list |
| `/transaction/[id]` | Transaction detail + edit |
| `/stock` | Inventory |
| `/reports`, `/summary`, `/balance`, `/health` | Reports & balance |
| `/contacts` | Contacts |
| `/settings` | Account & app settings |
| `/help` | Help |
| `/about`, `/privacy`, `/terms` | Legal / info (public) |

---

*Generated for export to other AI builders. Reflects the codebase as of the audit date.*
