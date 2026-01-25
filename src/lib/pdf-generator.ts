import jsPDF from 'jspdf'
import { format } from 'date-fns'
import { formatCurrency } from './utils'

export interface PDFData {
  business: {
    name: string
    type: string
    state: string
    city?: string
  }
  period: {
    startDate: Date
    endDate: Date
  }
  profitLoss: {
    revenue: { cash: number; credit: number; total: number }
    expenses: Record<string, number>
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
  transactions: Array<{
    id: string
    transaction_type: string
    amount: number
    payment_type: string
    expense_category?: string
    notes?: string
    transaction_date: string
  }>
}

export function generateBusinessReportPDF(data: PDFData) {
  const doc = new jsPDF()
  
  // PAGE 1: COVER
  // Top line
  doc.setDrawColor(230, 228, 225) // #E6E4E1
  doc.line(20, 20, 190, 20)
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFIT & LOSS STATEMENT', 105, 50, { align: 'center' })
  
  // Business name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.business.name, 105, 65, { align: 'center' })
  
  // Period
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const periodEndDate = format(data.period.endDate, 'dd/MM/yyyy')
  doc.text(
    `Period: ${format(data.period.startDate, 'dd/MM/yyyy')} - ${periodEndDate}`,
    105,
    80,
    { align: 'center' }
  )
  
  // Bottom lines
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 100, 130, 100)
  doc.line(20, 110, 130, 110)
  
  // Date on right
  doc.text(periodEndDate, 190, 105, { align: 'right' })
  
  // Bottom line
  doc.line(20, 280, 190, 280)
  
  // PAGE 2: BUSINESS INFO
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BUSINESS INFORMATION', 20, 35)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  let yPos = 50
  doc.text(`Name: ${data.business.name}`, 20, yPos)
  yPos += 10
  doc.text(`Type: ${data.business.type}`, 20, yPos)
  yPos += 10
  doc.text(`Location: ${data.business.city || ''}, ${data.business.state}`, 20, yPos)
  
  // Bottom line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 280, 190, 280)
  
  // PAGE 3: P&L STATEMENT
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFIT & LOSS STATEMENT', 105, 35, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.business.name, 105, 45, { align: 'center' })
  doc.text(`As of ${periodEndDate}`, 105, 55, { align: 'center' })
  
  // Bottom lines (partial width on left)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 65, 130, 65)
  doc.line(20, 75, 130, 75)
  
  // Date on right (aligned with lines)
  doc.text(periodEndDate, 190, 70, { align: 'right' })
  
  doc.setFontSize(11)
  yPos = 90
  
  // Revenue
  doc.setFont('helvetica', 'bold')
  doc.text('REVENUE', 20, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10
  
  doc.text(`Cash Sales: ${formatCurrency(data.profitLoss.revenue.cash)}`, 30, yPos)
  yPos += 8
  doc.text(`Credit Sales: ${formatCurrency(data.profitLoss.revenue.credit)}`, 30, yPos)
  yPos += 10
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL REVENUE: ${formatCurrency(data.profitLoss.revenue.total)}`, 30, yPos)
  yPos += 15
  
  // Expenses
  doc.text('EXPENSES', 20, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10
  
  const categoryLabels: Record<string, string> = {
    stock_purchase: 'Stock Purchase',
    rent: 'Rent',
    utilities: 'Utilities',
    transport: 'Transport',
    salaries: 'Salaries',
    other: 'Other'
  }
  
  Object.entries(data.profitLoss.expenses).forEach(([category, amount]) => {
    if (amount > 0) {
      doc.text(`${categoryLabels[category] || category}: ${formatCurrency(amount)}`, 30, yPos)
      yPos += 8
    }
  })
  
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL EXPENSES: ${formatCurrency(data.profitLoss.totalExpenses)}`, 30, yPos)
  yPos += 15
  
  // Net Profit
  doc.setFontSize(14)
  doc.text(`NET PROFIT: ${formatCurrency(data.profitLoss.netProfit)}`, 20, yPos)
  doc.setFontSize(11)
  yPos += 8
  doc.text(`Profit Margin: ${data.profitLoss.profitMargin.toFixed(1)}%`, 20, yPos)
  
  // Save
  doc.save(`${data.business.name}-Profit-Loss-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export interface BalanceSheetPDFData {
  business: {
    name: string
    type: string
    state: string
    city?: string
  }
  asAtDate?: Date
  balanceSheet: {
    assets: {
      cash: number
      bank: number
      receivables: number
      inventory: number
      total: number
    }
    liabilities: {
      payables: number
      loans: number
      total: number
    }
    equity: {
      startingCapital: number
      retainedEarnings: number
      total: number
    }
    balanceCheck: number
    isBalanced: boolean
  }
}

export function generateBalanceSheetPDF(data: BalanceSheetPDFData) {
  const doc = new jsPDF()
  const reportDate = format(new Date(), 'dd/MM/yyyy')
  
  // Single page layout - compact
  // Top line (full width)
  doc.setDrawColor(230, 228, 225) // #E6E4E1
  doc.line(20, 20, 190, 20)
  
  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text('BALANCE SHEET', 105, 35, { align: 'center' })
  
  // Business name
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(data.business.name, 105, 45, { align: 'center' })
  
  // Date - use the as at date from balance sheet data if available
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  const asAtDate = data.asAtDate ? format(data.asAtDate, 'dd/MM/yyyy') : reportDate
  doc.text(`As of ${asAtDate}`, 105, 55, { align: 'center' })
  
  // Bottom lines (partial width on left)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 65, 130, 65)
  doc.line(20, 75, 130, 75)
  
  // Date on right (aligned with lines)
  doc.text(reportDate, 190, 70, { align: 'right' })
  
  doc.setFontSize(10)
  let yPos = 85
  
  // Two-column layout for compact display
  const leftCol = 20
  const rightCol = 110
  const colWidth = 80
  
  // Assets (Left Column)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('ASSETS', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  yPos += 8
  
  doc.text(`Cash`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.cash), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Bank`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.bank), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Receivables`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.receivables), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Inventory`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.inventory), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL ASSETS`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.total), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 12
  
  // Liabilities & Equity (Right Column)
  let rightYPos = 85
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('LIABILITIES', rightCol, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  rightYPos += 8
  
  doc.text(`Payables`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.payables), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 7
  
  doc.text(`Loans`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.loans), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL LIABILITIES`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.total), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 12
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('EQUITY', rightCol, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  rightYPos += 8
  
  doc.text(`Starting Capital`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.startingCapital), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 7
  
  doc.text(`Retained Earnings`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.retainedEarnings), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL EQUITY`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.total), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 15
  
  // Balance Check
  const checkYPos = Math.max(yPos, rightYPos) + 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Check: ${data.balanceSheet.isBalanced ? 'Balanced ✓' : 'Not Balanced'}`,
    105,
    checkYPos,
    { align: 'center' }
  )
  
  // Bottom line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 280, 190, 280)
  
  // Save
  doc.save(`${data.business.name}-Balance-Sheet-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}

export interface ComprehensiveLoanPackagePDFData {
  business: {
    name: string
    type: string
    state: string
    city?: string
  }
  period: {
    startDate: Date
    endDate: Date
  }
  profitLoss: {
    revenue: { cash: number; credit: number; total: number }
    expenses: Record<string, number>
    totalExpenses: number
    netProfit: number
    profitMargin: number
  }
  balanceSheet: {
    assets: {
      cash: number
      bank: number
      receivables: number
      inventory: number
      total: number
    }
    liabilities: {
      payables: number
      loans: number
      total: number
    }
    equity: {
      startingCapital: number
      retainedEarnings: number
      total: number
    }
    balanceCheck: number
    isBalanced: boolean
  }
  transactions: Array<{
    id: string
    transaction_type: string
    amount: number
    payment_type: string
    expense_category?: string
    notes?: string
    transaction_date: string
  }>
}

export function generateComprehensiveLoanPackagePDF(data: ComprehensiveLoanPackagePDFData) {
  const doc = new jsPDF()
  
  // PAGE 1: COVER
  // Top line
  doc.setDrawColor(230, 228, 225) // #E6E4E1
  doc.line(20, 20, 190, 20)
  
  // Title
  doc.setFontSize(20)
  doc.setFont('helvetica', 'bold')
  doc.text('LOAN APPLICATION PACKAGE', 105, 50, { align: 'center' })
  
  // Business name
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text(data.business.name, 105, 65, { align: 'center' })
  
  // Period
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  const periodEndDate = format(data.period.endDate, 'dd/MM/yyyy')
  doc.text(
    `As of ${periodEndDate}`,
    105,
    80,
    { align: 'center' }
  )
  
  // Bottom lines
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 100, 130, 100)
  doc.line(20, 110, 130, 110)
  
  // Date on right
  doc.setFontSize(11)
  doc.text(periodEndDate, 190, 105, { align: 'right' })
  
  // Bottom line
  doc.line(20, 280, 190, 280)
  
  // PAGE 2: BUSINESS INFO
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BUSINESS INFORMATION', 20, 35)
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  let yPos = 50
  doc.text(`Name: ${data.business.name}`, 20, yPos)
  yPos += 10
  doc.text(`Type: ${data.business.type}`, 20, yPos)
  yPos += 10
  doc.text(`Location: ${data.business.city || ''}, ${data.business.state}`, 20, yPos)
  
  // Bottom line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 280, 190, 280)
  
  // PAGE 3: P&L STATEMENT
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PROFIT & LOSS STATEMENT', 105, 35, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.business.name, 105, 45, { align: 'center' })
  doc.text(`As of ${periodEndDate}`, 105, 55, { align: 'center' })
  
  // Bottom lines (partial width on left)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 65, 130, 65)
  doc.line(20, 75, 130, 75)
  
  // Date on right (aligned with lines)
  doc.text(periodEndDate, 190, 70, { align: 'right' })
  
  doc.setFontSize(11)
  yPos = 90
  
  // Revenue
  doc.setFont('helvetica', 'bold')
  doc.text('REVENUE', 20, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10
  
  doc.text(`Cash Sales: ${formatCurrency(data.profitLoss.revenue.cash)}`, 30, yPos)
  yPos += 8
  doc.text(`Credit Sales: ${formatCurrency(data.profitLoss.revenue.credit)}`, 30, yPos)
  yPos += 10
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL REVENUE: ${formatCurrency(data.profitLoss.revenue.total)}`, 30, yPos)
  yPos += 15
  
  // Expenses
  doc.text('EXPENSES', 20, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 10
  
  const categoryLabels: Record<string, string> = {
    stock_purchase: 'Stock Purchase',
    rent: 'Rent',
    utilities: 'Utilities',
    transport: 'Transport',
    salaries: 'Salaries',
    other: 'Other'
  }
  
  Object.entries(data.profitLoss.expenses).forEach(([category, amount]) => {
    if (amount > 0) {
      doc.text(`${categoryLabels[category] || category}: ${formatCurrency(amount)}`, 30, yPos)
      yPos += 8
    }
  })
  
  yPos += 5
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL EXPENSES: ${formatCurrency(data.profitLoss.totalExpenses)}`, 30, yPos)
  yPos += 15
  
  // Net Profit
  doc.setFontSize(14)
  doc.text(`NET PROFIT: ${formatCurrency(data.profitLoss.netProfit)}`, 20, yPos)
  doc.setFontSize(11)
  yPos += 8
  doc.text(`Profit Margin: ${data.profitLoss.profitMargin.toFixed(1)}%`, 20, yPos)
  
  // PAGE 4: BALANCE SHEET
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  // Header
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('BALANCE SHEET', 105, 35, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.business.name, 105, 45, { align: 'center' })
  doc.text(`As of ${periodEndDate}`, 105, 55, { align: 'center' })
  
  // Bottom lines (partial width on left)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 65, 130, 65)
  doc.line(20, 75, 130, 75)
  
  // Date on right (aligned with lines)
  doc.text(periodEndDate, 190, 70, { align: 'right' })
  
  doc.setFontSize(10)
  yPos = 90
  
  // Two-column layout for compact display
  const leftCol = 20
  const rightCol = 110
  const colWidth = 80
  
  // Assets (Left Column)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('ASSETS', leftCol, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  yPos += 8
  
  doc.text(`Cash`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.cash), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Bank`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.bank), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Receivables`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.receivables), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 7
  
  doc.text(`Inventory`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.inventory), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL ASSETS`, leftCol + 5, yPos)
  doc.text(formatCurrency(data.balanceSheet.assets.total), leftCol + colWidth, yPos, { align: 'right' })
  yPos += 12
  
  // Liabilities & Equity (Right Column)
  let rightYPos = 90
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('LIABILITIES', rightCol, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  rightYPos += 8
  
  doc.text(`Payables`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.payables), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 7
  
  doc.text(`Loans`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.loans), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL LIABILITIES`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.liabilities.total), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 12
  
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('EQUITY', rightCol, rightYPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  rightYPos += 8
  
  doc.text(`Starting Capital`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.startingCapital), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 7
  
  doc.text(`Retained Earnings`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.retainedEarnings), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 8
  
  doc.setFont('helvetica', 'bold')
  doc.text(`TOTAL EQUITY`, rightCol + 5, rightYPos)
  doc.text(formatCurrency(data.balanceSheet.equity.total), rightCol + colWidth, rightYPos, { align: 'right' })
  rightYPos += 15
  
  // Balance Check
  const checkYPos = Math.max(yPos, rightYPos) + 5
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(
    `Check: ${data.balanceSheet.isBalanced ? 'Balanced ✓' : 'Not Balanced'}`,
    105,
    checkYPos,
    { align: 'center' }
  )
  
  // PAGE 5: TRANSACTION HISTORY
  doc.addPage()
  
  // Top line (full width)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 20, 190, 20)
  
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('TRANSACTION HISTORY', 105, 35, { align: 'center' })
  
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(data.business.name, 105, 45, { align: 'center' })
  doc.text(`Period: ${format(data.period.startDate, 'dd/MM/yyyy')} - ${periodEndDate}`, 105, 55, { align: 'center' })
  
  // Bottom lines (partial width on left)
  doc.setDrawColor(230, 228, 225)
  doc.line(20, 65, 130, 65)
  doc.line(20, 75, 130, 75)
  
  // Date on right (aligned with lines)
  doc.text(periodEndDate, 190, 70, { align: 'right' })
  
  doc.setFontSize(9)
  yPos = 90
  
  // Table header
  doc.setFont('helvetica', 'bold')
  doc.text('Date', 20, yPos)
  doc.text('Type', 60, yPos)
  doc.text('Amount', 150, yPos, { align: 'right' })
  doc.setFont('helvetica', 'normal')
  yPos += 5
  
  // Draw line
  doc.line(20, yPos, 190, yPos)
  yPos += 5
  
  // Recent transactions (max 30)
  const recentTransactions = data.transactions.slice(0, 30)
  recentTransactions.forEach(t => {
    if (yPos > 270) {
      doc.addPage()
      yPos = 20
    }
    
    doc.text(format(new Date(t.transaction_date), 'dd/MM/yyyy'), 20, yPos)
    doc.text(t.transaction_type === 'sale' ? 'Sale' : 'Expense', 60, yPos)
    doc.text(formatCurrency(t.amount), 150, yPos, { align: 'right' })
    yPos += 6
  })
  
  // Save
  doc.save(`${data.business.name}-Loan-Package-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
}
