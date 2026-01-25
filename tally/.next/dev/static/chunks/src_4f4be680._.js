(globalThis.TURBOPACK || (globalThis.TURBOPACK = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/src/i18n/locales/en.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"common\":{\"save\":\"Save\",\"cancel\":\"Cancel\",\"delete\":\"Delete\",\"edit\":\"Edit\",\"back\":\"Back\",\"next\":\"Next\",\"loading\":\"Loading...\",\"saved\":\"Saved\",\"couldntSave\":\"Couldn't save. Try again.\",\"couldntDelete\":\"Couldn't delete. Try again.\",\"optional\":\"optional\",\"saving\":\"Saving...\"},\"auth\":{\"login\":\"Login\",\"phone\":\"Phone Number\",\"sendOTP\":\"Send OTP Code\",\"verifyOTP\":\"Verify OTP Code\",\"otpSent\":\"Code has been sent\",\"enterOTP\":\"Enter 6-digit code\",\"resendOTP\":\"Send new code\",\"logout\":\"Log Out\",\"phonePlaceholder\":\"012-345 6789\",\"otpPlaceholder\":\"123456\",\"sending\":\"Sending...\",\"verifying\":\"Verifying...\",\"invalidPhone\":\"Please enter a valid phone number\",\"invalidOTP\":\"Invalid OTP code. Please try again.\",\"verifyError\":\"Could not verify. Please try again.\",\"loginSuccess\":\"Login successful\",\"sendError\":\"Could not send OTP. Please try again.\",\"testModeMessage\":\"Test mode: Skip OTP. Use test code: {{code}}\",\"devModeTitle\":\"Development Mode\",\"devModeDescription\":\"Skip login for testing\",\"skipLoginButton\":\"Skip Login (Test)\",\"devBypassMessage\":\"Skipping login...\",\"devBypassError\":\"Could not skip login\",\"devModeOnly\":\"Test mode only available in development\"},\"setup\":{\"title\":\"Set Up Your Business\",\"subtitle\":\"Step {{step}} of {{total}}\",\"businessName\":\"Business Name\",\"businessNamePlaceholder\":\"e.g., Ali's Coffee Shop\",\"businessType\":\"Business Type\",\"typeOther\":\"Specify business type (brief)\",\"typeOtherPlaceholder\":\"e.g., Cake Shop, Clothing Store, etc.\",\"state\":\"State\",\"selectState\":\"Select state\",\"city\":\"City/District\",\"cityPlaceholder\":\"e.g., Petaling Jaya\",\"startingCash\":\"Starting Cash\",\"startingBank\":\"Starting Bank Balance\",\"typeOtherRequired\":\"Please specify business type\",\"agreeToTerms\":\"I agree to\",\"terms\":\"Terms\",\"privacy\":\"Privacy Policy\",\"agreeTermsError\":\"Please agree to Terms & Privacy Policy\",\"completeAllFields\":\"Please complete all required fields\",\"success\":\"Business created successfully!\",\"finish\":\"Complete\",\"pleaseLogin\":\"Please login first\"},\"home\":{\"title\":\"Home\",\"todayProfit\":\"Today's Profit\",\"revenue\":\"Revenue\",\"expenses\":\"Expenses\",\"weekProfit\":\"This Week's Profit\",\"monthProfit\":\"This Month's Profit\",\"bestDay\":\"Best Day\",\"recordSale\":\"RECORD SALE\",\"recordExpense\":\"RECORD EXPENSE\",\"recentTransactions\":\"Recent Transactions\",\"recentActivity\":\"Recent Activity\",\"viewAll\":\"View all\",\"noTransactions\":\"No transactions yet\",\"loadingError\":\"Could not load transactions\",\"todaysSummary\":\"Today's Summary\",\"cashIn\":\"Cash In\",\"cashOut\":\"Cash Out\",\"todaysBalance\":\"Today's Balance\",\"businessFallback\":\"Business\"},\"transaction\":{\"recordSale\":\"Record Sale\",\"recordExpense\":\"Record Expense\",\"amount\":\"Amount\",\"quickAmount\":\"Quick Amount\",\"paymentType\":\"Payment Type\",\"category\":\"Category\",\"notes\":\"Notes\",\"notesPlaceholder\":\"Enter notes...\",\"addNotesPlaceholder\":\"Add any notes...\",\"date\":\"Date\",\"time\":\"Time\",\"type\":\"Type\",\"sale\":\"Sale\",\"expense\":\"Expense\",\"edit\":\"Edit Transaction\",\"editTitle\":\"Edit Transaction\",\"delete\":\"Delete Transaction\",\"deleteConfirm\":\"Delete this transaction?\",\"deleteConfirmDesc\":\"You can undo within 30 seconds.\",\"deleteConfirmMessage\":\"Are you sure you want to delete this transaction?\",\"undo\":\"Undo\",\"deleted\":\"Transaction deleted\",\"restored\":\"Transaction restored\",\"updated\":\"Updated\",\"saving\":\"Saving...\",\"deleting\":\"Deleting...\",\"save\":\"SAVE\",\"saveSale\":\"Save Sale\",\"saveExpense\":\"Save Expense\",\"invalidAmount\":\"Please enter a valid amount\",\"noBusiness\":\"No business selected\",\"notFound\":\"Transaction not found\",\"receipt\":\"Receipt/Invoice\",\"takePhoto\":\"Take Photo\",\"chooseFile\":\"Choose File\",\"otherDescription\":\"What was it for?\",\"otherDescriptionPlaceholder\":\"e.g. Repair, supplies\",\"otherPaymentType\":\"Specify other payment type\",\"otherPaymentPlaceholder\":\"e.g., Credit\",\"attachment\":\"Attachment\",\"attachments\":\"Attachments\",\"addPhotoOrFile\":\"Add photo or file\",\"attachmentAdded\":\"Attachment added\"},\"history\":{\"title\":\"Transaction History\",\"transactions\":\"Transactions\",\"transactionsCount\":\"{{count}} transactions\",\"today\":\"Today\",\"yesterday\":\"Yesterday\",\"7days\":\"7 Days\",\"30days\":\"30 Days\",\"noTransactions\":\"No transactions yet\",\"loadingError\":\"Error loading transactions\",\"filteredEmpty\":\"{{count}} transactions found, but none for selected period\"},\"summary\":{\"title\":\"Financial Report\",\"totalRevenue\":\"Total Revenue\",\"totalExpenses\":\"Total Expenses\",\"profitMargin\":\"Profit Margin\",\"netProfit\":\"Net Profit\",\"profitTrend\":\"Profit Trend\",\"profitLoss\":\"Profit & Loss Statement\",\"revenue\":\"REVENUE\",\"expenses\":\"EXPENSES\",\"cashSales\":\"Cash Sales\",\"creditSales\":\"Credit Sales\",\"totalRevenueLabel\":\"TOTAL REVENUE\",\"totalExpensesLabel\":\"TOTAL EXPENSES\",\"exportPDF\":\"Export to PDF\",\"exportP&L\":\"Export P&L Statement\",\"exportComprehensive\":\"Export Comprehensive Package\",\"financialStatements\":\"Financial Statements\",\"periods\":{\"7days\":\"7 Days\",\"30days\":\"30 Days\",\"90days\":\"90 Days\",\"180days\":\"6 Months\",\"365days\":\"1 Year\",\"week\":\"This Week\",\"month\":\"This Month\",\"year\":\"This Year\",\"custom\":\"Custom\"},\"customDateRange\":\"Custom Date Range\",\"startDate\":\"Start Date\",\"endDate\":\"End Date\",\"periodDisplay\":\"{{start}} to {{end}}\"},\"dateRange\":{\"today\":\"Today\",\"yesterday\":\"Yesterday\",\"last7days\":\"Last 7 days\",\"last14days\":\"Last 14 days\",\"last21days\":\"Last 21 days\",\"last30days\":\"Last 30 days\",\"last60days\":\"Last 60 days\",\"last90days\":\"Last 90 days\",\"customRange\":\"Custom Range\",\"startDate\":\"Start Date\",\"endDate\":\"End Date\",\"apply\":\"Apply\"},\"settings\":{\"title\":\"Settings\",\"profile\":\"Profile\",\"businessName\":\"Business Name\",\"businessType\":\"Business Type\",\"location\":\"Location\",\"language\":\"Language\",\"bahasaMalaysia\":\"Bahasa Malaysia\",\"english\":\"English\",\"data\":\"Data\",\"exportCSV\":\"Export CSV\",\"exportCSVDesc\":\"Download CSV\",\"support\":\"Support\",\"aboutTally\":\"About Tally\",\"whatsapp\":\"Contact via WhatsApp\",\"email\":\"Email\",\"legal\":\"Legal\",\"privacy\":\"Privacy Policy\",\"terms\":\"Terms\",\"version\":\"Version\",\"logout\":\"Log Out\",\"businessCheck\":\"Business Check-in\",\"businessCheckDesc\":\"Business Check-in\",\"view\":\"View\",\"editProfile\":\"Edit Business Profile\",\"state\":\"State\",\"city\":\"City/District\",\"updated\":\"Updated\",\"noTransactionsExport\":\"No transactions to export\",\"languageChanged\":\"Bahasa ditukar ke Bahasa Malaysia\",\"languageChangedEn\":\"Language changed to English\",\"languageError\":\"Cannot change language\"},\"health\":{\"title\":\"Business Check-in\",\"subtitle\":\"Based on what you logged\",\"score\":\"Score\",\"consistency\":\"Consistency\",\"clarity\":\"Clarity\",\"stability\":\"Stability\",\"suggestion\":\"Suggestion\",\"logTransaction\":\"Log 1 transaction today\",\"consistencyDesc\":\"{{days}} days with records in last 14 days\",\"clarityDesc\":\"Record both sales and expenses in last 7 days\",\"stabilityDesc\":\"Based on your record consistency\",\"betterConsistency\":\"Record transactions daily for better consistency\",\"betterClarity\":\"Record both sales and expenses for better clarity\",\"keepGoing\":\"Keep recording transactions consistently\"},\"welcome\":{\"title\":\"Welcome to TALLY\",\"subtitle\":\"Digital account book for small businesses\",\"skip\":\"Skip\",\"next\":\"Next\",\"getStarted\":\"Get Started\",\"slide1\":{\"title\":\"Record Sales in < 15 Seconds\",\"description\":\"Enter amount, select payment, save. Done!\"},\"slide2\":{\"title\":\"Auto-Generate Financial Reports\",\"description\":\"P&L, Balance Sheet, and complete reports for banks\"},\"slide3\":{\"title\":\"Build Your Credit Score\",\"description\":\"Consistent records = higher score = access to financing\"},\"slide4\":{\"title\":\"Access Ethical Financing\",\"description\":\"Be Noor Capital - fair loans for small businesses\"},\"slide5\":{\"title\":\"Join Be Noor Ecosystem\",\"description\":\"TALLY + Academy + Capital = complete business growth\"}},\"balanceSheet\":{\"title\":\"Balance Sheet\",\"description\":\"View assets, liabilities, and equity\",\"assets\":\"ASSETS\",\"liabilities\":\"LIABILITIES\",\"equity\":\"EQUITY\",\"currentAssets\":\"Current Assets\",\"cash\":\"Cash\",\"bank\":\"Bank\",\"receivables\":\"Accounts Receivable\",\"inventory\":\"Inventory\",\"totalAssets\":\"TOTAL ASSETS\",\"currentLiabilities\":\"Current Liabilities\",\"payables\":\"Accounts Payable\",\"loans\":\"Loans\",\"totalLiabilities\":\"TOTAL LIABILITIES\",\"startingCapital\":\"Starting Capital\",\"retainedEarnings\":\"Retained Earnings\",\"totalEquity\":\"TOTAL EQUITY\",\"balanceCheck\":\"Check: Assets = Liabilities + Equity\",\"balanced\":\"Balanced ✓\",\"notBalanced\":\"Not balanced\",\"exportPDF\":\"Export to PDF\"},\"help\":{\"title\":\"Help & Support\",\"faq\":\"FAQ\",\"tutorials\":\"Tutorials\",\"contact\":\"Contact Us\",\"whatsapp\":\"WhatsApp\",\"email\":\"Email\",\"guide\":\"Guide\",\"howToRecordSale\":\"How to Record Sale\",\"howToRecordExpense\":\"How to Record Expense\",\"howToViewReports\":\"How to View Reports\",\"howToExportPDF\":\"How to Export PDF\"},\"paymentTypes\":{\"cash\":\"Cash\",\"mobile_money\":\"Mobile Money\",\"bank_transfer\":\"Bank Transfer\",\"other\":\"Other\",\"duitnow\":\"DuitNow\",\"tng\":\"TNG\",\"boost\":\"Boost\",\"grabpay\":\"GrabPay\",\"shopeepay\":\"ShopeePay\",\"credit\":\"Credit\"},\"expenseCategories\":{\"stock_purchase\":\"Stock\",\"rent\":\"Rent\",\"utilities\":\"Utilities\",\"transport\":\"Transport\",\"salaries\":\"Salaries\",\"other\":\"Other\",\"supplies\":\"Supplies\",\"wages\":\"Wages\",\"food\":\"Food\",\"maintenance\":\"Maintenance\"},\"businessTypes\":{\"retail\":\"Retail Shop\",\"stall\":\"Stall/Kiosk\",\"service\":\"Service\",\"online\":\"Online Shop\",\"home\":\"Home Business\",\"other\":\"Other\"},\"csv\":{\"headers\":{\"date\":\"Date\",\"type\":\"Type\",\"amount\":\"Amount\",\"payment\":\"Payment\",\"category\":\"Category\",\"notes\":\"Notes\"},\"sale\":\"Sale\",\"expense\":\"Expense\",\"exportSuccess\":\"CSV exported successfully\",\"noTransactions\":\"No transactions to export\"},\"sale\":{\"deductStockOptional\":\"Deduct from stock (optional)\",\"deductStockToggle\":\"Deduct stock for this sale\",\"itemLabel\":\"Item\",\"selectItem\":\"Select an item\",\"quantitySoldLabel\":\"Quantity sold\",\"unitLabel\":\"Unit\",\"itemRequired\":\"Please select an item\",\"quantityRequired\":\"Please enter quantity sold\"},\"inventory\":{\"history\":\"History\",\"sold\":\"Sold\",\"added\":\"Added\",\"adjusted\":\"Adjusted\",\"noHistory\":\"No movement history\",\"viewTransaction\":\"View transaction\"},\"errors\":{\"unitMismatch\":\"Unit mismatch. Selected item uses different unit.\"},\"warnings\":{\"stockNotUpdated\":\"Sale saved. Stock was not updated.\",\"lowStock\":\"Low stock for {{item}}\"},\"confirm\":{\"negativeStockTitle\":\"Stock will go below zero\",\"negativeStockBody\":\"This will reduce stock below zero. Do you want to continue?\",\"continue\":\"Continue\",\"cancel\":\"Cancel\"},\"stock\":{\"title\":\"Inventory\",\"items\":\"items\",\"noItems\":\"No items yet\",\"addItem\":\"Add Item\",\"editItem\":\"Edit Item\",\"itemName\":\"Item Name\",\"itemNamePlaceholder\":\"e.g., Rice (bag)\",\"quantity\":\"Quantity\",\"unit\":\"Unit\",\"lowStockThreshold\":\"Low Stock Threshold\",\"lowStockThresholdPlaceholder\":\"Alert when quantity reaches this\",\"lowStock\":\"Low stock\",\"itemAdded\":\"Item added\",\"itemUpdated\":\"Item updated\",\"deleteConfirm\":\"Delete Item\",\"deleteConfirmMessage\":\"Are you sure you want to delete {{name}}?\",\"nameRequired\":\"Item name is required\",\"invalidQuantity\":\"Please enter a valid quantity\",\"noBusiness\":\"No business selected\",\"tableNotReady\":\"Inventory table not set up yet. Please run the SQL setup.\",\"saveError\":\"Unable to save item. Please try again.\",\"deleteError\":\"Unable to delete item. Please try again.\",\"units\":{\"pcs\":\"pcs\",\"pack\":\"pack\",\"kg\":\"kg\",\"g\":\"g\",\"l\":\"l\",\"ml\":\"ml\"}},\"nav\":{\"home\":\"Home\",\"records\":\"Records\",\"stock\":\"Stock\",\"reports\":\"Reports\",\"account\":\"Account\"},\"account\":{\"title\":\"Account\",\"businessProfile\":\"Business Profile\",\"ownerName\":\"Owner Name\",\"ownerNamePlaceholder\":\"Enter your name\",\"businessName\":\"Business Name\",\"businessNamePlaceholder\":\"Enter business name\",\"addBusinessName\":\"Add business name\",\"addYourName\":\"Add your name\",\"category\":\"Category\",\"categoryPlaceholder\":\"e.g., Retail, Food & Beverage\",\"country\":\"Country\",\"countryPlaceholder\":\"e.g., Malaysia\",\"state\":\"State/Region\",\"statePlaceholder\":\"e.g., Selangor\",\"area\":\"Area\",\"areaPlaceholder\":\"e.g., Petaling Jaya\",\"location\":\"Location\",\"logo\":\"Logo\",\"uploadLogo\":\"Upload Logo\",\"removeLogo\":\"Remove Logo\",\"edit\":\"Edit\",\"editProfile\":\"Edit Profile\",\"save\":\"Save\",\"cancel\":\"Cancel\",\"profileSaved\":\"Profile saved\",\"showIntro\":\"Show Intro\",\"support\":\"Support\",\"about\":\"About Tally\",\"aboutDesc\":\"Learn what Tally is about\",\"privacy\":\"Privacy\",\"privacyDesc\":\"Your data stays private\",\"contact\":\"Contact\",\"contactDesc\":\"Get in touch with us\",\"preferences\":\"Preferences\",\"notSet\":\"Not set\",\"change\":\"Change\",\"currency\":\"Currency\",\"export\":\"Export\",\"replaceLogo\":\"Replace Logo\",\"saveProfile\":\"Save Profile\",\"ownerNameRequired\":\"Owner name is required\",\"businessNameRequired\":\"Business name is required\",\"countryRequired\":\"Country is required\"},\"report\":{\"common\":{\"exportPDF\":\"Export PDF\",\"custom\":\"Custom\",\"thisWeek\":\"This Week\",\"thisMonth\":\"This Month\",\"lastMonth\":\"Last Month\",\"last6Months\":\"Last 6 Months\",\"thisYear\":\"This Year\",\"asAt\":\"As at\",\"period\":\"Period\"},\"profitLoss\":{\"title\":\"Profit and Loss\",\"period\":\"Period\",\"revenue\":\"REVENUE\",\"expenses\":\"EXPENSES\",\"totalRevenue\":\"Total Revenue\",\"totalExpenses\":\"Total Expenses\",\"netProfit\":\"Net Profit\",\"cash\":\"Cash\",\"bankTransfer\":\"Bank Transfer\",\"mobileMoney\":\"Mobile Money\",\"other\":\"Other\",\"profitMessage\":\"You made {{amount}} profit in this period.\",\"lossMessage\":\"You had {{amount}} loss in this period.\"},\"balanceSheet\":{\"title\":\"Balance Sheet\",\"asAt\":\"As at\",\"cashOnHand\":\"Cash on Hand\",\"bankAccount\":\"Bank Account\",\"inventoryValue\":\"Inventory Value\",\"otherAssets\":\"Other Assets\",\"totalAssets\":\"Total Assets\",\"payables\":\"Payables\",\"loans\":\"Loans\",\"totalLiabilities\":\"Total Liabilities\",\"ownersEquity\":\"Owner's Equity\",\"totalEquity\":\"Total Equity\",\"balanced\":\"Books are balanced\",\"notBalanced\":\"Not balanced\",\"balanceHint\":\"Check opening balances and inventory value.\"},\"businessHealth\":{\"title\":\"Business Health\",\"period\":\"Period\",\"last7Days\":\"Last 7 days\",\"last30Days\":\"Last 30 days\",\"last90Days\":\"Last 90 days\",\"recordingConsistency\":\"Recording consistency\",\"cashflowBalance\":\"Cashflow balance\",\"profitTrend\":\"Profit trend\",\"topExpenseCategory\":\"Top expense category\",\"daysRecorded\":\"{{count}} of last {{total}} days recorded\",\"cashIn\":\"Cash in\",\"cashOut\":\"Cash out\",\"netProfit\":\"Net profit\",\"trendUp\":\"Up\",\"trendDown\":\"Down\",\"trendStable\":\"Stable\",\"emptyStateTitle\":\"Keep recording daily to see trends\",\"emptyStateMessage\":\"We need at least 3 days of entries to show insights\",\"recordSale\":\"Record Sale\",\"recordExpense\":\"Record Expense\"}}}"));}),
"[project]/src/i18n/locales/bm.json (json)", ((__turbopack_context__) => {

__turbopack_context__.v(JSON.parse("{\"common\":{\"save\":\"Simpan\",\"cancel\":\"Batal\",\"delete\":\"Padam\",\"edit\":\"Edit\",\"back\":\"Kembali\",\"next\":\"Seterusnya\",\"loading\":\"Memuatkan...\",\"saved\":\"Disimpan\",\"couldntSave\":\"Tak dapat simpan. Cuba lagi.\",\"couldntDelete\":\"Tak dapat padam. Cuba lagi.\",\"optional\":\"pilihan\",\"saving\":\"Menyimpan...\"},\"auth\":{\"login\":\"Log Masuk\",\"phone\":\"Nombor Telefon\",\"sendOTP\":\"Hantar Kod OTP\",\"verifyOTP\":\"Sahkan Kod OTP\",\"otpSent\":\"Kod telah dihantar\",\"enterOTP\":\"Masukkan kod 6 digit\",\"resendOTP\":\"Hantar kod baru\",\"logout\":\"Log Keluar\",\"phonePlaceholder\":\"012-345 6789\",\"otpPlaceholder\":\"123456\",\"sending\":\"Menghantar...\",\"verifying\":\"Mengesahkan...\",\"invalidPhone\":\"Sila masukkan nombor telefon yang sah\",\"invalidOTP\":\"Kod OTP tidak sah. Cuba lagi.\",\"verifyError\":\"Tak dapat sahkan. Cuba lagi.\",\"loginSuccess\":\"Berjaya masuk\",\"sendError\":\"Tak dapat hantar OTP. Cuba lagi.\",\"testModeMessage\":\"Mod ujian: Langkau OTP. Gunakan kod ujian: {{code}}\",\"devModeTitle\":\"Mod Pembangunan\",\"devModeDescription\":\"Langkau log masuk untuk ujian\",\"skipLoginButton\":\"Langkau Log Masuk (Ujian)\",\"devBypassMessage\":\"Langkau log masuk...\",\"devBypassError\":\"Tidak dapat langkau log masuk\",\"devModeOnly\":\"Mod ujian hanya tersedia dalam mod pembangunan\"},\"setup\":{\"title\":\"Sediakan Perniagaan Anda\",\"subtitle\":\"Langkah {{step}} daripada {{total}}\",\"businessName\":\"Nama Perniagaan\",\"businessNamePlaceholder\":\"Contoh: Kedai Runcit Ali\",\"businessType\":\"Jenis Perniagaan\",\"typeOther\":\"Nyatakan jenis perniagaan (ringkas)\",\"typeOtherPlaceholder\":\"Contoh: Kedai Kek, Kedai Pakaian, dll\",\"state\":\"Negeri\",\"selectState\":\"Pilih negeri\",\"typeOtherRequired\":\"Sila nyatakan jenis perniagaan\",\"city\":\"Bandar/Daerah\",\"cityPlaceholder\":\"Contoh: Petaling Jaya\",\"startingCash\":\"Wang Tunai Permulaan\",\"startingBank\":\"Baki Bank Permulaan\",\"agreeToTerms\":\"Saya setuju\",\"terms\":\"Terma\",\"privacy\":\"Polisi Privasi\",\"agreeTermsError\":\"Sila setuju dengan Terma & Polisi Privasi\",\"completeAllFields\":\"Sila lengkapkan semua maklumat yang diperlukan\",\"success\":\"Perniagaan berjaya dicipta!\",\"finish\":\"Selesai\",\"pleaseLogin\":\"Sila log masuk terlebih dahulu\"},\"home\":{\"title\":\"Utama\",\"todayProfit\":\"Untung Hari Ini\",\"revenue\":\"Hasil\",\"expenses\":\"Belanja\",\"weekProfit\":\"Untung Minggu Ini\",\"monthProfit\":\"Untung Bulan Ini\",\"bestDay\":\"Hari Terbaik\",\"recordSale\":\"REKOD JUALAN\",\"recordExpense\":\"REKOD BELANJA\",\"recentTransactions\":\"Transaksi Terkini\",\"recentActivity\":\"Aktiviti Terkini\",\"viewAll\":\"Lihat semua\",\"noTransactions\":\"Belum ada transaksi\",\"loadingError\":\"Tak dapat memuatkan transaksi\",\"todaysSummary\":\"Ringkasan Hari Ini\",\"cashIn\":\"Wang Masuk\",\"cashOut\":\"Wang Keluar\",\"todaysBalance\":\"Baki Hari Ini\",\"businessFallback\":\"Perniagaan\"},\"transaction\":{\"recordSale\":\"Rekod Jualan\",\"recordExpense\":\"Rekod Belanja\",\"amount\":\"Jumlah\",\"quickAmount\":\"Jumlah Pantas\",\"paymentType\":\"Jenis Pembayaran\",\"category\":\"Kategori\",\"notes\":\"Nota\",\"notesPlaceholder\":\"Masukkan nota...\",\"addNotesPlaceholder\":\"Tambah nota...\",\"date\":\"Tarikh\",\"time\":\"Masa\",\"type\":\"Jenis\",\"sale\":\"Jualan\",\"expense\":\"Belanja\",\"edit\":\"Edit Transaksi\",\"editTitle\":\"Edit Transaksi\",\"delete\":\"Padam Transaksi\",\"deleteConfirm\":\"Padam transaksi ini?\",\"deleteConfirmDesc\":\"Anda boleh batal dalam 30 saat.\",\"deleteConfirmMessage\":\"Adakah anda pasti mahu memadam transaksi ini?\",\"undo\":\"Batal\",\"deleted\":\"Transaksi dipadam\",\"restored\":\"Transaksi dipulihkan\",\"updated\":\"Dikemaskini\",\"saving\":\"Menyimpan...\",\"deleting\":\"Memadam...\",\"save\":\"SIMPAN\",\"saveSale\":\"Simpan Jualan\",\"saveExpense\":\"Simpan Belanja\",\"invalidAmount\":\"Sila masukkan jumlah yang sah\",\"noBusiness\":\"Tiada perniagaan dipilih\",\"notFound\":\"Transaksi tidak dijumpai\",\"receipt\":\"Resit/Invois\",\"takePhoto\":\"Ambil Gambar\",\"chooseFile\":\"Pilih Fail\",\"otherDescription\":\"Untuk apa?\",\"otherDescriptionPlaceholder\":\"cth. Baiki, bekalan\",\"otherPaymentType\":\"Nyatakan jenis pembayaran lain\",\"otherPaymentPlaceholder\":\"cth. Kredit\",\"attachment\":\"Lampiran\",\"attachments\":\"Lampiran\",\"addPhotoOrFile\":\"Tambah foto atau fail\",\"attachmentAdded\":\"Lampiran ditambah\"},\"history\":{\"title\":\"Sejarah Transaksi\",\"transactions\":\"Transaksi\",\"transactionsCount\":\"{{count}} transaksi\",\"today\":\"Hari Ini\",\"yesterday\":\"Semalam\",\"7days\":\"7 Hari\",\"30days\":\"30 Hari\",\"noTransactions\":\"Belum ada transaksi\",\"loadingError\":\"Ralat memuatkan transaksi\",\"filteredEmpty\":\"{{count}} transaksi dijumpai, tetapi tiada untuk tempoh yang dipilih\"},\"summary\":{\"title\":\"Laporan Kewangan\",\"totalRevenue\":\"Jumlah Pendapatan\",\"totalExpenses\":\"Jumlah Perbelanjaan\",\"profitMargin\":\"Margin Keuntungan\",\"netProfit\":\"Untung Bersih\",\"profitTrend\":\"Trend Keuntungan\",\"profitLoss\":\"Penyata Untung Rugi\",\"revenue\":\"PENDAPATAN\",\"expenses\":\"PERBELANJAAN\",\"cashSales\":\"Jualan Tunai\",\"creditSales\":\"Jualan Kredit\",\"totalRevenueLabel\":\"JUMLAH PENDAPATAN\",\"totalExpensesLabel\":\"JUMLAH PERBELANJAAN\",\"exportPDF\":\"Export to PDF\",\"exportP&L\":\"Eksport Penyata Untung Rugi\",\"exportComprehensive\":\"Eksport Pakej Lengkap\",\"financialStatements\":\"Penyata Kewangan\",\"periods\":{\"7days\":\"7 Hari\",\"30days\":\"30 Hari\",\"90days\":\"90 Hari\",\"180days\":\"6 Bulan\",\"365days\":\"1 Tahun\",\"week\":\"Minggu Ini\",\"month\":\"Bulan Ini\",\"year\":\"Tahun Ini\",\"custom\":\"Pilih Tarikh\"},\"customDateRange\":\"Julat Tarikh Tersuai\",\"startDate\":\"Tarikh Mula\",\"endDate\":\"Tarikh Akhir\",\"periodDisplay\":\"{{start}} hingga {{end}}\"},\"dateRange\":{\"today\":\"Hari Ini\",\"yesterday\":\"Semalam\",\"last7days\":\"7 Hari Lepas\",\"last14days\":\"14 Hari Lepas\",\"last21days\":\"21 Hari Lepas\",\"last30days\":\"30 Hari Lepas\",\"last60days\":\"60 Hari Lepas\",\"last90days\":\"90 Hari Lepas\",\"customRange\":\"Julat Tersuai\",\"startDate\":\"Tarikh Mula\",\"endDate\":\"Tarikh Akhir\",\"apply\":\"Guna\"},\"settings\":{\"title\":\"Tetapan\",\"profile\":\"Profil\",\"businessName\":\"Nama Perniagaan\",\"businessType\":\"Jenis Perniagaan\",\"location\":\"Lokasi\",\"language\":\"Bahasa\",\"bahasaMalaysia\":\"Bahasa Malaysia\",\"english\":\"English\",\"data\":\"Data\",\"exportCSV\":\"Eksport CSV\",\"exportCSVDesc\":\"Muat turun CSV\",\"support\":\"Sokongan\",\"aboutTally\":\"Mengenai Tally\",\"whatsapp\":\"Hubungi melalui WhatsApp\",\"email\":\"Email\",\"legal\":\"Undang-undang\",\"privacy\":\"Polisi Privasi\",\"terms\":\"Terma\",\"version\":\"Versi\",\"logout\":\"Log Keluar\",\"businessCheck\":\"Pemeriksaan Perniagaan\",\"businessCheckDesc\":\"Business Check-in\",\"view\":\"Lihat\",\"editProfile\":\"Edit Profil Perniagaan\",\"state\":\"Negeri\",\"city\":\"Bandar/Daerah\",\"updated\":\"Dikemaskini\",\"noTransactionsExport\":\"Tiada transaksi untuk dieksport\",\"languageChanged\":\"Bahasa ditukar ke Bahasa Malaysia\",\"languageChangedEn\":\"Language changed to English\",\"languageError\":\"Tidak dapat menukar bahasa\"},\"health\":{\"title\":\"Pemeriksaan Perniagaan\",\"subtitle\":\"Berdasarkan apa yang anda rekod\",\"score\":\"Skor\",\"consistency\":\"Konsistensi\",\"clarity\":\"Kejelasan\",\"stability\":\"Kestabilan\",\"suggestion\":\"Cadangan\",\"logTransaction\":\"Rekod 1 transaksi hari ini\",\"consistencyDesc\":\"{{days}} hari dengan rekod dalam 14 hari lepas\",\"clarityDesc\":\"Rekod kedua-dua jualan dan belanja dalam 7 hari lepas\",\"stabilityDesc\":\"Berdasarkan konsistensi rekod anda\",\"betterConsistency\":\"Rekod transaksi setiap hari untuk konsistensi yang lebih baik\",\"betterClarity\":\"Rekod kedua-dua jualan dan belanja untuk kejelasan yang lebih baik\",\"keepGoing\":\"Teruskan rekod transaksi anda dengan konsisten\"},\"welcome\":{\"title\":\"Selamat Datang ke TALLY\",\"subtitle\":\"Buku akaun digital untuk perniagaan kecil\",\"skip\":\"Langkau\",\"next\":\"Seterusnya\",\"getStarted\":\"Mula Guna\",\"slide1\":{\"title\":\"Rekod Jualan dalam < 15 Saat\",\"description\":\"Masukkan jumlah, pilih pembayaran, simpan. Selesai!\"},\"slide2\":{\"title\":\"Laporan Kewangan Automatik\",\"description\":\"P&L, Kunci Kira-Kira, dan laporan lengkap untuk bank\"},\"slide3\":{\"title\":\"Bina Skor Kredit Anda\",\"description\":\"Rekod konsisten = skor lebih tinggi = akses pembiayaan\"},\"slide4\":{\"title\":\"Akses Pembiayaan Beretika\",\"description\":\"Be Noor Capital - pinjaman adil untuk perniagaan kecil\"},\"slide5\":{\"title\":\"Sertai Ekosistem Be Noor\",\"description\":\"TALLY + Academy + Capital = pertumbuhan perniagaan lengkap\"}},\"balanceSheet\":{\"title\":\"Lembaran Imbangan\",\"description\":\"Lihat aset, liabiliti, dan ekuiti\",\"assets\":\"ASET\",\"liabilities\":\"LIABILITI\",\"equity\":\"EKUITI\",\"currentAssets\":\"Aset Semasa\",\"cash\":\"Tunai\",\"bank\":\"Bank\",\"receivables\":\"Akaun Belum Terima\",\"inventory\":\"Inventori\",\"totalAssets\":\"JUMLAH ASET\",\"currentLiabilities\":\"Liabiliti Semasa\",\"payables\":\"Akaun Belum Bayar\",\"loans\":\"Pinjaman\",\"totalLiabilities\":\"JUMLAH LIABILITI\",\"startingCapital\":\"Modal Permulaan\",\"retainedEarnings\":\"Keuntungan Tertahan\",\"totalEquity\":\"JUMLAH EKUITI\",\"balanceCheck\":\"Semakan: Aset = Liabiliti + Ekuiti\",\"balanced\":\"Seimbang ✓\",\"notBalanced\":\"Tidak seimbang\",\"exportPDF\":\"Eksport ke PDF\"},\"help\":{\"title\":\"Bantuan & Sokongan\",\"faq\":\"Soalan Lazim\",\"tutorials\":\"Tutorial\",\"contact\":\"Hubungi Kami\",\"whatsapp\":\"WhatsApp\",\"email\":\"Email\",\"guide\":\"Panduan\",\"howToRecordSale\":\"Cara Rekod Jualan\",\"howToRecordExpense\":\"Cara Rekod Belanja\",\"howToViewReports\":\"Cara Lihat Laporan\",\"howToExportPDF\":\"Cara Eksport PDF\"},\"paymentTypes\":{\"cash\":\"Tunai\",\"mobile_money\":\"Wang Elektronik\",\"bank_transfer\":\"Pindahan Bank\",\"other\":\"Lain-lain\",\"duitnow\":\"DuitNow\",\"tng\":\"TNG\",\"boost\":\"Boost\",\"grabpay\":\"GrabPay\",\"shopeepay\":\"ShopeePay\",\"credit\":\"Kredit\"},\"expenseCategories\":{\"stock_purchase\":\"Stok\",\"rent\":\"Sewa\",\"utilities\":\"Utiliti\",\"transport\":\"Pengangkutan\",\"salaries\":\"Gaji\",\"other\":\"Lain-lain\",\"supplies\":\"Bekalan\",\"wages\":\"Gaji\",\"food\":\"Makanan\",\"maintenance\":\"Penyelenggaraan\"},\"businessTypes\":{\"retail\":\"Kedai Runcit\",\"stall\":\"Warung/Gerai\",\"service\":\"Perkhidmatan\",\"online\":\"Kedai Online\",\"home\":\"Perniagaan Rumah\",\"other\":\"Lain-lain\"},\"csv\":{\"headers\":{\"date\":\"Tarikh\",\"type\":\"Jenis\",\"amount\":\"Jumlah\",\"payment\":\"Pembayaran\",\"category\":\"Kategori\",\"notes\":\"Nota\"},\"sale\":\"Jualan\",\"expense\":\"Belanja\",\"exportSuccess\":\"CSV berjaya dieksport\",\"noTransactions\":\"Tiada transaksi untuk dieksport\"},\"sale\":{\"deductStockOptional\":\"Tolak dari stok (pilihan)\",\"deductStockToggle\":\"Tolak stok untuk jualan ini\",\"itemLabel\":\"Item\",\"selectItem\":\"Pilih item\",\"quantitySoldLabel\":\"Kuantiti dijual\",\"unitLabel\":\"Unit\",\"itemRequired\":\"Sila pilih item\",\"quantityRequired\":\"Sila masukkan kuantiti dijual\"},\"inventory\":{\"history\":\"Sejarah\",\"sold\":\"Dijual\",\"added\":\"Ditambah\",\"adjusted\":\"Dilaras\",\"noHistory\":\"Tiada sejarah pergerakan\",\"viewTransaction\":\"Lihat transaksi\"},\"errors\":{\"unitMismatch\":\"Unit tidak sepadan. Item yang dipilih menggunakan unit yang berbeza.\"},\"warnings\":{\"stockNotUpdated\":\"Jualan disimpan. Stok tidak dikemaskini.\",\"lowStock\":\"Stok rendah untuk {{item}}\"},\"confirm\":{\"negativeStockTitle\":\"Stok akan menjadi negatif\",\"negativeStockBody\":\"Ini akan mengurangkan stok di bawah sifar. Adakah anda mahu teruskan?\",\"continue\":\"Teruskan\",\"cancel\":\"Batal\"},\"stock\":{\"title\":\"Inventori\",\"items\":\"item\",\"noItems\":\"Belum ada item\",\"addItem\":\"Tambah Item\",\"editItem\":\"Edit Item\",\"itemName\":\"Nama Item\",\"itemNamePlaceholder\":\"Contoh: Beras (beg)\",\"quantity\":\"Kuantiti\",\"unit\":\"Unit\",\"lowStockThreshold\":\"Ambang Stok Rendah\",\"lowStockThresholdPlaceholder\":\"Amaran apabila kuantiti mencapai ini\",\"lowStock\":\"Stok rendah\",\"itemAdded\":\"Item ditambah\",\"itemUpdated\":\"Item dikemaskini\",\"deleteConfirm\":\"Padam Item\",\"deleteConfirmMessage\":\"Adakah anda pasti mahu memadam {{name}}?\",\"nameRequired\":\"Nama item diperlukan\",\"invalidQuantity\":\"Sila masukkan kuantiti yang sah\",\"noBusiness\":\"Tiada perniagaan dipilih\",\"tableNotReady\":\"Jadual inventori belum disediakan. Sila jalankan SQL setup.\",\"saveError\":\"Tidak dapat menyimpan item. Sila cuba lagi.\",\"deleteError\":\"Tidak dapat memadam item. Sila cuba lagi.\",\"units\":{\"pcs\":\"unit\",\"pack\":\"pek\",\"kg\":\"kg\",\"g\":\"g\",\"l\":\"l\",\"ml\":\"ml\"}},\"nav\":{\"home\":\"Utama\",\"records\":\"Rekod\",\"stock\":\"Stok\",\"reports\":\"Laporan\",\"account\":\"Akaun\"},\"account\":{\"title\":\"Akaun\",\"businessProfile\":\"Profil Perniagaan\",\"ownerName\":\"Nama Pemilik\",\"ownerNamePlaceholder\":\"Masukkan nama anda\",\"businessName\":\"Nama Perniagaan\",\"businessNamePlaceholder\":\"Masukkan nama perniagaan\",\"addBusinessName\":\"Tambah nama perniagaan\",\"addYourName\":\"Tambah nama anda\",\"category\":\"Kategori\",\"categoryPlaceholder\":\"Contoh: Runcit, Makanan & Minuman\",\"country\":\"Negara\",\"countryPlaceholder\":\"Contoh: Malaysia\",\"state\":\"Negeri/Wilayah\",\"statePlaceholder\":\"Contoh: Selangor\",\"area\":\"Kawasan\",\"areaPlaceholder\":\"Contoh: Petaling Jaya\",\"location\":\"Lokasi\",\"logo\":\"Logo\",\"uploadLogo\":\"Muat Naik Logo\",\"removeLogo\":\"Buang Logo\",\"edit\":\"Edit\",\"editProfile\":\"Edit Profil\",\"save\":\"Simpan\",\"cancel\":\"Batal\",\"profileSaved\":\"Profil disimpan\",\"showIntro\":\"Tunjukkan Pengenalan\",\"support\":\"Sokongan\",\"about\":\"Mengenai Tally\",\"aboutDesc\":\"Ketahui tentang Tally\",\"privacy\":\"Privasi\",\"privacyDesc\":\"Data anda kekal peribadi\",\"contact\":\"Hubungi\",\"contactDesc\":\"Hubungi kami\",\"preferences\":\"Pilihan\",\"notSet\":\"Tidak ditetapkan\",\"change\":\"Tukar\",\"currency\":\"Mata Wang\",\"export\":\"Eksport\",\"replaceLogo\":\"Ganti Logo\",\"saveProfile\":\"Simpan Profil\",\"ownerNameRequired\":\"Nama pemilik diperlukan\",\"businessNameRequired\":\"Nama perniagaan diperlukan\",\"countryRequired\":\"Negara diperlukan\"},\"report\":{\"common\":{\"exportPDF\":\"Eksport PDF\",\"custom\":\"Tersuai\",\"thisWeek\":\"Minggu Ini\",\"thisMonth\":\"Bulan Ini\",\"lastMonth\":\"Bulan Lepas\",\"last6Months\":\"6 Bulan Lepas\",\"thisYear\":\"Tahun Ini\",\"asAt\":\"Sehingga\",\"period\":\"Tempoh\"},\"profitLoss\":{\"title\":\"Untung dan Rugi\",\"period\":\"Tempoh\",\"revenue\":\"PENDAPATAN\",\"expenses\":\"PERBELANJAAN\",\"totalRevenue\":\"Jumlah Pendapatan\",\"totalExpenses\":\"Jumlah Perbelanjaan\",\"netProfit\":\"Untung Bersih\",\"cash\":\"Tunai\",\"bankTransfer\":\"Pindahan Bank\",\"mobileMoney\":\"Wang Mudah Alih\",\"other\":\"Lain-lain\",\"profitMessage\":\"Anda membuat untung {{amount}} dalam tempoh ini.\",\"lossMessage\":\"Anda mengalami kerugian {{amount}} dalam tempoh ini.\"},\"balanceSheet\":{\"title\":\"Lembaran Imbangan\",\"asAt\":\"Sehingga\",\"cashOnHand\":\"Wang Tunai\",\"bankAccount\":\"Akaun Bank\",\"inventoryValue\":\"Nilai Inventori\",\"otherAssets\":\"Aset Lain\",\"totalAssets\":\"Jumlah Aset\",\"payables\":\"Hutang\",\"loans\":\"Pinjaman\",\"totalLiabilities\":\"Jumlah Liabiliti\",\"ownersEquity\":\"Ekuiti Pemilik\",\"totalEquity\":\"Jumlah Ekuiti\",\"balanced\":\"Buku seimbang\",\"notBalanced\":\"Tidak seimbang\",\"balanceHint\":\"Semak baki pembukaan dan nilai inventori.\"},\"businessHealth\":{\"title\":\"Kesihatan Perniagaan\",\"period\":\"Tempoh\",\"last7Days\":\"7 hari lepas\",\"last30Days\":\"30 hari lepas\",\"last90Days\":\"90 hari lepas\",\"recordingConsistency\":\"Konsistensi rekod\",\"cashflowBalance\":\"Imbangan aliran tunai\",\"profitTrend\":\"Trend keuntungan\",\"topExpenseCategory\":\"Kategori perbelanjaan teratas\",\"daysRecorded\":\"{{count}} daripada {{total}} hari terakhir direkodkan\",\"cashIn\":\"Wang masuk\",\"cashOut\":\"Wang keluar\",\"netProfit\":\"Untung bersih\",\"trendUp\":\"Naik\",\"trendDown\":\"Turun\",\"trendStable\":\"Stabil\",\"emptyStateTitle\":\"Teruskan merekod setiap hari untuk melihat trend\",\"emptyStateMessage\":\"Kami memerlukan sekurang-kurangnya 3 hari entri untuk menunjukkan pandangan\",\"recordSale\":\"Rekod Jualan\",\"recordExpense\":\"Rekod Belanja\"}}}"));}),
"[project]/src/i18n/config.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$i18next$2f$dist$2f$esm$2f$i18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/i18next/dist/esm/i18next.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$initReactI18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-i18next/dist/es/initReactI18next.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$locales$2f$en$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/src/i18n/locales/en.json (json)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$locales$2f$bm$2e$json__$28$json$29$__ = __turbopack_context__.i("[project]/src/i18n/locales/bm.json (json)");
'use client';
;
;
;
;
const savedLanguage = ("TURBOPACK compile-time truthy", 1) ? localStorage.getItem('tally-language') || 'en' : "TURBOPACK unreachable";
__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$i18next$2f$dist$2f$esm$2f$i18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].use(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$i18next$2f$dist$2f$es$2f$initReactI18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initReactI18next"]).init({
    resources: {
        en: {
            translation: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$locales$2f$en$2e$json__$28$json$29$__["default"]
        },
        bm: {
            translation: __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$locales$2f$bm$2e$json__$28$json$29$__["default"]
        }
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
        escapeValue: false
    },
    debug: ("TURBOPACK compile-time value", "development") === 'development',
    missingKeyHandler: (lng, ns, key)=>{
        if ("TURBOPACK compile-time truthy", 1) {
            console.warn(`[i18n] Missing translation key: ${key} for language: ${lng}`);
        }
    }
});
const __TURBOPACK__default__export__ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$i18next$2f$dist$2f$esm$2f$i18next$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"];
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/app/providers.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Providers",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$i18n$2f$config$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/i18n/config.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function Providers({ children }) {
    _s();
    const [queryClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "Providers.useState": ()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClient"]({
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000
                    }
                }
            })
    }["Providers.useState"]);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 14,
        columnNumber: 5
    }, this);
}
_s(Providers, "PzCurAWmYC6bdCMFZn5b8k1TcGI=");
_c = Providers;
var _c;
__turbopack_context__.k.register(_c, "Providers");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/lib/supabase/supabaseClient.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-client] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://alefhgharkiuwugufxhn.supabase.co");
const supabaseAnonKey = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ("TURBOPACK compile-time value", "sb_publishable_GgJsza6dk6dU7gb9xOy9Mg_Va_7Iu8G");
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true,
        autoRefreshToken: true
    },
    db: {
        schema: 'public'
    },
    global: {
        headers: {
            'apikey': supabaseAnonKey
        }
    }
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/supabaseClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function AuthProvider({ children }) {
    _s();
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthProvider.useEffect": ()=>{
            // Get initial session
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getSession().then({
                "AuthProvider.useEffect": ({ data: { session } })=>{
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);
                }
            }["AuthProvider.useEffect"]);
            // Listen for auth changes
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "AuthProvider.useEffect": (_event, session)=>{
                    setSession(session);
                    setUser(session?.user ?? null);
                    setIsLoading(false);
                }
            }["AuthProvider.useEffect"]);
            return ({
                "AuthProvider.useEffect": ()=>subscription.unsubscribe()
            })["AuthProvider.useEffect"];
        }
    }["AuthProvider.useEffect"], []);
    const signOut = async ()=>{
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
        setUser(null);
        setSession(null);
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: {
            user,
            session,
            isLoading,
            signOut
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_s(AuthProvider, "v3/zOfdXU0hsYF1ENx2NUyL1c2o=");
_c = AuthProvider;
function useAuth() {
    _s1();
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
_s1(useAuth, "b9L3QQ+jgeyIrH0NfHrJ8nn7VMU=");
var _c;
__turbopack_context__.k.register(_c, "AuthProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/contexts/BusinessContext.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "BusinessProvider",
    ()=>BusinessProvider,
    "useBusiness",
    ()=>useBusiness
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/supabaseClient.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
'use client';
;
;
const BusinessContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["createContext"])(undefined);
function BusinessProvider({ children }) {
    _s();
    const [currentBusiness, setCurrentBusiness] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const loadBusiness = async ()=>{
        try {
            setIsLoading(true);
            // Check for dev mode bypass
            const devBypass = ("TURBOPACK compile-time value", "object") !== 'undefined' && sessionStorage.getItem('dev-bypass-auth') === 'true';
            if (devBypass && ("TURBOPACK compile-time value", "development") === 'development') {
                // In dev mode with bypass, get the first active business (for testing)
                const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('businesses').select('*').eq('is_active', true).limit(1).single();
                if (error) {
                    if (error.code === 'PGRST116') {
                        // No business found - this is okay
                        setCurrentBusiness(null);
                    } else {
                        console.error('Error loading business (dev bypass):', {
                            code: error.code,
                            message: error.message
                        });
                        setCurrentBusiness(null);
                    }
                } else if (data) {
                    setCurrentBusiness(data);
                }
                setIsLoading(false);
                return;
            }
            // Get current user
            const { data: { user } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.getUser();
            if (!user) {
                setCurrentBusiness(null);
                setIsLoading(false);
                return;
            }
            const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].from('businesses').select('*').eq('user_id', user.id).eq('is_active', true).limit(1).single();
            if (error) {
                if (error.code === 'PGRST116') {
                    // No business found - this is okay for new users
                    setCurrentBusiness(null);
                } else {
                    console.error('Error loading business:', {
                        code: error.code,
                        message: error.message
                    });
                    setCurrentBusiness(null);
                }
            } else if (data) {
                setCurrentBusiness(data);
            }
        } catch (err) {
            console.error('Error in loadBusiness:', err);
            setCurrentBusiness(null);
        } finally{
            setIsLoading(false);
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "BusinessProvider.useEffect": ()=>{
            loadBusiness();
            // Listen for auth changes
            const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$supabaseClient$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange({
                "BusinessProvider.useEffect": ()=>{
                    loadBusiness();
                }
            }["BusinessProvider.useEffect"]);
            return ({
                "BusinessProvider.useEffect": ()=>subscription.unsubscribe()
            })["BusinessProvider.useEffect"];
        }
    }["BusinessProvider.useEffect"], []);
    const refreshBusiness = async ()=>{
        await loadBusiness();
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(BusinessContext.Provider, {
        value: {
            currentBusiness,
            setCurrentBusiness,
            isLoading,
            refreshBusiness
        },
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/BusinessContext.tsx",
        lineNumber: 109,
        columnNumber: 5
    }, this);
}
_s(BusinessProvider, "f78NK/Mg+Q+jMBHP9h11x6JZkNs=");
_c = BusinessProvider;
function useBusiness() {
    _s1();
    const ctx = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useContext"])(BusinessContext);
    if (!ctx) {
        throw new Error('useBusiness must be used within a BusinessProvider');
    }
    return ctx;
}
_s1(useBusiness, "/dMy7t63NXD4eYACoT93CePwGrg=");
var _c;
__turbopack_context__.k.register(_c, "BusinessProvider");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/src/components/AuthGuard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthGuard",
    ()=>AuthGuard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$BusinessContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/BusinessContext.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function AuthGuard({ children }) {
    _s();
    const { user, isLoading: authLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"])();
    const { currentBusiness, isLoading: businessLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$BusinessContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBusiness"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const [devModeBypass, setDevModeBypass] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    // Static file paths that should never be intercepted
    const isStaticPath = pathname?.startsWith('/_next') || pathname?.startsWith('/favicon.ico') || pathname?.startsWith('/icons') || pathname?.startsWith('/brand') || pathname?.startsWith('/manifest.json') || /\.(png|jpg|jpeg|gif|svg|ico|css|js|map|woff|woff2|ttf|eot)$/i.test(pathname || '');
    const publicRoutes = [
        '/login',
        '/verify',
        '/welcome',
        '/about'
    ];
    const isPublicRoute = publicRoutes.includes(pathname || '');
    const isDevMode = ("TURBOPACK compile-time value", "development") === 'development';
    // Early return for static files - don't apply any auth logic
    if (isStaticPath) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: children
        }, void 0, false);
    }
    // In dev mode, allow bypassing auth
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthGuard.useEffect": ()=>{
            if (isDevMode && !devModeBypass) {
                // Check if user wants to bypass auth
                const bypassAuth = sessionStorage.getItem('dev-bypass-auth') === 'true';
                if (bypassAuth) {
                    // Use requestAnimationFrame to avoid synchronous setState in effect
                    requestAnimationFrame({
                        "AuthGuard.useEffect": ()=>{
                            setDevModeBypass(true);
                            console.log('Dev bypass mode enabled');
                        }
                    }["AuthGuard.useEffect"]);
                }
            }
        }
    }["AuthGuard.useEffect"], [
        isDevMode,
        devModeBypass
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "AuthGuard.useEffect": ()=>{
            // Skip auth checks for static paths (shouldn't reach here, but safety check)
            if (isStaticPath) {
                return;
            }
            // Skip auth checks in dev mode if bypass is enabled
            if (isDevMode && devModeBypass) {
                // Check if welcome has been seen
                const welcomeSeen = localStorage.getItem('tally-welcome-seen');
                if (!welcomeSeen && pathname !== '/welcome') {
                    router.push('/welcome');
                    return;
                }
                // Allow access to all routes except login/verify
                if (pathname === '/login' || pathname === '/verify') {
                    router.push('/');
                }
                return;
            }
            if (authLoading || businessLoading) return;
            // Check if welcome has been seen (only for authenticated users with business)
            if (user && currentBusiness && pathname !== '/welcome' && !isPublicRoute) {
                const welcomeSeen = localStorage.getItem('tally-welcome-seen');
                if (!welcomeSeen) {
                    router.push('/welcome');
                    return;
                }
            }
            // If not logged in and trying to access protected route
            if (!user && !isPublicRoute && !devModeBypass) {
                router.push('/login');
                return;
            }
            // If logged in but no business and not on setup/login
            if (user && !currentBusiness && pathname !== '/setup' && !isPublicRoute) {
                router.push('/setup');
                return;
            }
            // If logged in with business but on login/setup, redirect to home
            if (user && currentBusiness && (pathname === '/login' || pathname === '/verify' || pathname === '/setup')) {
                router.push('/');
                return;
            }
        }
    }["AuthGuard.useEffect"], [
        user,
        currentBusiness,
        authLoading,
        businessLoading,
        pathname,
        router,
        isDevMode,
        devModeBypass,
        isPublicRoute,
        isStaticPath
    ]);
    // Show nothing while checking auth (unless bypass is enabled)
    if (!devModeBypass && (authLoading || !user && !isPublicRoute)) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "min-h-screen bg-background flex items-center justify-center",
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-text-muted",
                children: "Memuatkan..."
            }, void 0, false, {
                fileName: "[project]/src/components/AuthGuard.tsx",
                lineNumber: 102,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/components/AuthGuard.tsx",
            lineNumber: 101,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
        children: children
    }, void 0, false);
}
_s(AuthGuard, "M4R3My/z2aMh+JTpq3ih+QEYj94=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useAuth"],
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$BusinessContext$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useBusiness"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
_c = AuthGuard;
var _c;
__turbopack_context__.k.register(_c, "AuthGuard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=src_4f4be680._.js.map