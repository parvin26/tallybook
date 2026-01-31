'use client'

import { useState, useCallback } from 'react'
import { Transaction } from '@/types'
import type { TransactionAttachmentRow } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { getAttachmentUrl } from '@/lib/attachments'
import { AttachmentViewer, type AttachmentItem } from '@/components/AttachmentViewer'
import { Wallet, Building2, Smartphone, CreditCard, Package, Car, Zap, Home, Users, Utensils, Wrench, MoreHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { parseISO, isToday, isYesterday, format } from 'date-fns'
import { useTranslation } from 'react-i18next'

const paymentIcons: Record<string, typeof Wallet> = {
  cash: Wallet,
  bank_transfer: Building2,
  duitnow: Smartphone,
  mobile_money: Smartphone,
  e_wallet: Smartphone,
  tng: Smartphone,
  boost: Smartphone,
  grabpay: Smartphone,
  shopeepay: Smartphone,
  credit: CreditCard,
  card: CreditCard,
  other: Wallet,
}

const categoryIcons: Record<string, typeof Package> = {
  stock_purchase: Package,
  transport: Car,
  utilities: Zap,
  rent: Home,
  salaries: Users,
  food: Utensils,
  maintenance: Wrench,
  other: MoreHorizontal,
}

interface TransactionListLovableProps {
  transactions: Transaction[]
  limit?: number
  /** When provided, clicking a row opens the edit modal instead of navigating to detail page. */
  onTransactionClick?: (transaction: Transaction) => void
}

export function TransactionListLovable({ transactions, limit, onTransactionClick }: TransactionListLovableProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerAttachments, setViewerAttachments] = useState<AttachmentItem[]>([])
  const [viewerIndex, setViewerIndex] = useState(0)

  const openAttachmentViewer = useCallback(async (transaction: Transaction, index: number) => {
    const list = transaction.transaction_attachments
    if (!list?.length) return
    if (list[index].data_url) {
      setViewerAttachments(
        list.map((a: TransactionAttachmentRow & { data_url?: string }) => ({
          id: a.id,
          filename: a.filename,
          mime_type: a.mime_type ?? 'application/octet-stream',
          dataUrl: a.data_url,
        }))
      )
      setViewerIndex(index)
      setViewerOpen(true)
    } else {
      const withUrls = await Promise.all(
        list.map(async (a: TransactionAttachmentRow) => {
          const url = await getAttachmentUrl(a.storage_path)
          return {
            id: a.id,
            filename: a.filename,
            mime_type: a.mime_type ?? 'application/octet-stream',
            signedUrl: url ?? '',
          }
        })
      )
      setViewerAttachments(withUrls)
      setViewerIndex(index)
      setViewerOpen(true)
    }
  }, [])

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--tally-text-muted)]">
        <p>{t('home.noTransactions')}</p>
      </div>
    )
  }

  // Filter out soft-deleted transactions
  const activeTransactions = transactions
  const displayTransactions = limit ? activeTransactions.slice(0, limit) : activeTransactions

  // Group transactions by day
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todayTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return isToday(txDate)
  })

  const yesterdayTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return isYesterday(txDate)
  })

  const otherTransactions = displayTransactions.filter(t => {
    const txDate = parseISO(t.transaction_date)
    return !isToday(txDate) && !isYesterday(txDate)
  })

  const renderTransaction = (transaction: Transaction) => {
    const isSale = transaction.transaction_type === 'sale'
    
    // Determine icon
    const paymentDisplayKey = transaction.payment_method === 'card' ? 'credit' : transaction.payment_method === 'e_wallet' ? 'mobile_money' : transaction.payment_method
    let Icon = Wallet
    if (transaction.expense_category) {
      Icon = categoryIcons[transaction.expense_category] || MoreHorizontal
    } else {
      Icon = paymentIcons[paymentDisplayKey] || Wallet
    }

    // Determine label
    let label = transaction.expense_category || transaction.payment_method || 'Transaction'
    if (transaction.expense_category) {
      label = t(`expenseCategories.${transaction.expense_category}`) || label
    } else {
      label = t(`paymentTypes.${paymentDisplayKey}`) || label
    }

    // Secondary label (note or time)
    const txDate = parseISO(transaction.transaction_date)
    const timeStr = format(txDate, 'h:mm a')
    
    // Strip attachment metadata from notes if present
    let cleanNotes = transaction.notes || ''
    if (cleanNotes) {
      // Remove pattern: [Attachment: ...] or Attachment: ... at start
      cleanNotes = cleanNotes.replace(/^\[?Attachment:\s*[^\]]*\]?\s*/i, '').trim()
    }
    
    const secondaryLabel = cleanNotes || timeStr

    return (
      <div
        key={transaction.id}
        onClick={() => (onTransactionClick ? onTransactionClick(transaction) : router.push(`/transaction/${transaction.id}`))}
        className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors cursor-pointer"
      >
        <div className="w-10 h-10 rounded-lg bg-[var(--tally-surface)] border border-[var(--tally-border)] flex items-center justify-center flex-shrink-0">
          <Icon className="w-5 h-5 text-[var(--tally-text-muted)]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-[var(--tally-text)] truncate">{label}</p>
          <p className="text-xs text-[var(--tally-text-muted)] truncate">{secondaryLabel}</p>
          <p className="text-xs text-[var(--tally-text-muted)] mt-0.5">
            Ref: #{transaction.id.slice(0, 8).toUpperCase()}
          </p>
          {transaction.transaction_attachments && transaction.transaction_attachments.length > 0 && (
            <div className="mt-1.5 text-xs">
              <span className="font-medium text-[var(--tally-text-muted)]">{t('transaction.attachments')}:</span>
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                {transaction.transaction_attachments.map((attachment: TransactionAttachmentRow, attIndex: number) => {
                  const isGuest = !!attachment.data_url
                  const openUrl = isGuest
                    ? () => openAttachmentViewer(transaction, attIndex)
                    : async () => {
                        const url = await getAttachmentUrl(attachment.storage_path)
                        if (url) window.open(url, '_blank', 'noopener,noreferrer')
                      }
                  return (
                    <button
                      key={attachment.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (isGuest) openAttachmentViewer(transaction, attIndex)
                        else openUrl()
                      }}
                      className="text-[#29978C] hover:underline truncate max-w-[180px] text-left"
                    >
                      {attachment.filename}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>
        <div className={`text-base font-bold tabular-nums ${
          isSale ? 'text-[#2E7D5B]' : 'text-[#B94A3A]'
        }`}>
          {isSale ? '+' : '–'}{formatCurrency(transaction.amount)}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {todayTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">{t('history.today')}</h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{todayTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {todayTransactions.map(renderTransaction)}
          </div>
        </div>
      )}

      {yesterdayTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">{t('history.yesterday')}</h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{yesterdayTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {yesterdayTransactions.map(renderTransaction)}
          </div>
        </div>
      )}

      {otherTransactions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-[var(--tally-text)]">
              {format(parseISO(otherTransactions[0].transaction_date), 'MMMM d, yyyy')}
            </h3>
            <span className="text-xs text-[var(--tally-text-muted)]">{otherTransactions.length}</span>
          </div>
          <div className="space-y-1">
            {otherTransactions.map(renderTransaction)}
          </div>
        </div>
      )}

      <AttachmentViewer
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
        attachments={viewerAttachments}
        initialIndex={viewerIndex}
      />
    </div>
  )
}
