'use client'

import { useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import html2canvas from 'html2canvas'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { Edit3, Lightbulb, Share2, Trash2 } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { Button } from '@/components/ui/button'
import { EditTransactionModal } from '@/components/EditTransactionModal'
import { getExpenseCategoryLabel } from '@/lib/expense-categories'
import { getBusinessProfile } from '@/lib/businessProfile'
import { useTransactions } from '@/hooks/useTransactions'

function formatRM(amount: number): string {
  return `RM ${Math.abs(amount).toFixed(2)}`
}

function formatSignedRM(amount: number, isSale: boolean): string {
  return `${isSale ? '+' : '-'} ${formatRM(amount)}`
}

function toPaymentKey(method: string): string {
  if (method === 'card') return 'credit'
  if (method === 'e_wallet') return 'mobile_money'
  return method
}

export default function TransactionSlipPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const transactionId = params.id as string
  const exportRef = useRef<HTMLDivElement>(null)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [showAdvice, setShowAdvice] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const { data: transactions = [], isLoading, deleteTransaction } = useTransactions()

  const transaction = useMemo(
    () => transactions.find((tx) => tx.id === transactionId) ?? null,
    [transactions, transactionId]
  )

  const businessName = useMemo(() => {
    const profile = getBusinessProfile()
    return profile?.businessName?.trim() || 'My Business'
  }, [])

  if (isLoading) {
    return (
      <AppShell title={t('transaction.details')} showBack showLogo={false} hideBottomNav>
        <div className="flex min-h-[55vh] items-center justify-center">
          <p className="text-[var(--tally-text-muted)]">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  if (!transaction) {
    return (
      <AppShell title={t('transaction.details')} showBack showLogo={false} hideBottomNav>
        <div className="flex min-h-[55vh] items-center justify-center px-6">
          <div className="text-center">
            <p className="mb-4 text-[var(--tally-text-muted)]">{t('transaction.notFound')}</p>
            <Button onClick={() => router.push('/history')}>{t('common.back')}</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const isSale = transaction.transaction_type === 'sale'
  const typeLabel = isSale ? 'Sale' : 'Expense'
  const transactionDate = parseISO(transaction.transaction_date)
  const transactionTime = transaction.created_at ? parseISO(transaction.created_at) : transactionDate
  const displayDate = format(transactionDate, 'd MMM yyyy')
  const displayTime = format(transactionTime, 'h:mm a')
  const paymentLabel = t(`paymentTypes.${toPaymentKey(transaction.payment_method)}`) || transaction.payment_method
  const categoryLabel =
    transaction.transaction_type === 'expense'
      ? getExpenseCategoryLabel(transaction.expense_category ?? undefined, t)
      : ''
  const refLabel = `Ref #${transaction.id}`
  const accentClass = isSale ? 'bg-primary text-primary-foreground hover:bg-primary/90' : 'bg-secondary text-secondary-foreground hover:bg-secondary/90'
  const amountClass = isSale ? 'text-[var(--money-in)]' : 'text-[var(--money-out)]'

  const handleDelete = async () => {
    const shouldDelete = window.confirm(t('transaction.deleteConfirmMessage', { defaultValue: 'Are you sure you want to delete this transaction?' }))
    if (!shouldDelete) return
    setIsDeleting(true)
    try {
      await deleteTransaction(transaction.id)
      toast.success(t('transaction.deleted'))
      if (window.history.length > 1) {
        router.back()
      } else {
        router.push('/history')
      }
    } catch {
      toast.error(t('common.couldntDelete'))
    } finally {
      setIsDeleting(false)
    }
  }

  const handleShare = async () => {
    if (!exportRef.current) return
    setIsSharing(true)
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#fff',
        scale: 2,
      })
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
      if (!blob) throw new Error('Failed to create image')

      const fileName = `receipt-${transaction.id}.png`
      const file = new File([blob], fileName, { type: 'image/png' })
      const nativeNavigator = navigator as Navigator & { canShare?: (data?: ShareData) => boolean }

      if (nativeNavigator.share && nativeNavigator.canShare?.({ files: [file] })) {
        await nativeNavigator.share({
          title: `${typeLabel} receipt`,
          files: [file],
        })
      } else {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        link.click()
        URL.revokeObjectURL(url)
      }
      toast.success('Receipt ready')
    } catch (error) {
      const err = error as DOMException
      if (err?.name !== 'AbortError') {
        toast.error(t('common.couldntSave'))
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <AppShell title={typeLabel} showBack showLogo={false} hideBottomNav>
      <div className="mx-auto max-w-[560px] px-6 py-6">
        <section className="rounded-3xl border border-[var(--tally-border)] bg-[var(--tally-surface)] p-6 shadow-[var(--tally-shadow)]">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[var(--tally-text-muted)]">{businessName}</p>
            <span className={`rounded-full border border-[var(--tally-border)] px-3 py-1 text-xs font-semibold uppercase tracking-wide ${isSale ? 'text-[var(--money-in)]' : 'text-[var(--money-out)]'}`}>
              {typeLabel}
            </span>
          </div>

          <div className="mb-6 border-b border-[var(--tally-border)] pb-6 text-center">
            <p className={`text-5xl font-bold tabular-nums ${amountClass}`}>{formatSignedRM(transaction.amount, isSale)}</p>
          </div>

          <div className="grid grid-cols-2 gap-y-6 pb-6">
            <div>
              <p className="text-sm font-medium text-[var(--tally-text-muted)]">Date</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--tally-text)]">{displayDate}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-[var(--tally-text-muted)]">Time</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--tally-text)]">{displayTime}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--tally-text-muted)]">Payment</p>
              <p className="mt-1 text-3xl font-semibold text-[var(--tally-text)]">{paymentLabel}</p>
            </div>
            {!isSale && categoryLabel ? (
              <div className="text-right">
                <p className="text-sm font-medium text-[var(--tally-text-muted)]">Category</p>
                <p className="mt-1 text-3xl font-semibold text-[var(--tally-text)]">{categoryLabel}</p>
              </div>
            ) : (
              <div />
            )}
          </div>

          {transaction.notes ? (
            <div className="border-t border-[var(--tally-border)] pt-6">
              <p className="text-sm font-medium text-[var(--tally-text-muted)]">Notes</p>
              <p className="mt-1 text-3xl text-[var(--tally-text)]">{transaction.notes}</p>
            </div>
          ) : null}

          <div className="mt-6 border-t border-[var(--tally-border)] pt-6 text-center text-sm font-medium text-[var(--tally-text-muted)]">
            {refLabel}
          </div>
        </section>

        <section className="mt-4 rounded-2xl border border-[var(--tally-border)] bg-[var(--tally-surface)] p-4">
          <button
            type="button"
            className="flex w-full items-center justify-between text-left"
            onClick={() => setShowAdvice((prev) => !prev)}
          >
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">
              <Lightbulb className="h-4 w-4" />
              Advice
            </span>
            <span className="text-xs font-medium text-[var(--primary)]">{showAdvice ? 'Hide advice' : 'Show advice'}</span>
          </button>
          {showAdvice ? (
            <p className="mt-3 text-sm text-[var(--tally-text)]">
              This section is reserved for future smart suggestions and is never included in exported receipts.
            </p>
          ) : null}
        </section>

        <div className="mt-6 space-y-3">
          <Button onClick={handleShare} disabled={isSharing} className={`h-14 w-full text-lg font-semibold ${accentClass}`}>
            <Share2 className="mr-2 h-5 w-5" />
            {isSharing ? 'Preparing receipt...' : 'Share Receipt'}
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="h-12 border-[var(--tally-border)] bg-[var(--tally-surface)] text-[var(--tally-text)]"
            >
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-12 border-[var(--secondary)] bg-[var(--tally-surface)] text-[var(--secondary)] hover:bg-[color:hsla(var(--secondary),0.08)]"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? t('common.loading') : 'Delete'}
            </Button>
          </div>
        </div>
      </div>

      <div className="fixed left-[-9999px] top-[-9999px]">
        <div ref={exportRef} className="w-[820px] bg-white px-14 py-16 text-[var(--tally-text)]">
          <h1 className="mb-10 text-center text-5xl font-bold tracking-wide">TRANSACTION RECEIPT</h1>
          <div className="rounded-[28px] border border-[var(--tally-border)] bg-white p-10">
            <div className="mb-10 flex items-center justify-between">
              <p className="text-3xl font-semibold uppercase tracking-[0.15em] text-[var(--tally-text-muted)]">{businessName}</p>
              <span className="rounded-xl border border-[var(--tally-border)] px-4 py-2 text-2xl font-semibold uppercase text-[var(--tally-text)]">
                {typeLabel}
              </span>
            </div>
            <p className="mb-8 text-center text-7xl font-bold tabular-nums text-[var(--tally-text)]">{formatSignedRM(transaction.amount, isSale)}</p>
            <div className="mb-8 border-t border-[var(--tally-border)] pt-8 text-3xl">
              <div className="mb-6 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xl font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">Date</p>
                  <p className="mt-2 font-semibold">{displayDate}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">Time</p>
                  <p className="mt-2 font-semibold">{displayTime}</p>
                </div>
              </div>
              <div className="mb-6 grid grid-cols-2 gap-8">
                <div>
                  <p className="text-xl font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">Payment</p>
                  <p className="mt-2 font-semibold">{paymentLabel}</p>
                </div>
                {!isSale && categoryLabel ? (
                  <div className="text-right">
                    <p className="text-xl font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">Category</p>
                    <p className="mt-2 font-semibold">{categoryLabel}</p>
                  </div>
                ) : (
                  <div />
                )}
              </div>
              {transaction.notes ? (
                <div className="border-t border-[var(--tally-border)] pt-8">
                  <p className="text-xl font-semibold uppercase tracking-wide text-[var(--tally-text-muted)]">Notes</p>
                  <p className="mt-2 font-semibold">{transaction.notes}</p>
                </div>
              ) : null}
            </div>
            <div className="border-t border-[var(--tally-border)] pt-6 text-center text-2xl font-semibold text-[var(--tally-text-muted)]">
              {refLabel}
            </div>
          </div>
        </div>
      </div>

      <EditTransactionModal
        transaction={transaction}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        onDelete={() => {
          if (window.history.length > 1) {
            router.back()
          } else {
            router.push('/history')
          }
        }}
      />
    </AppShell>
  )
}
