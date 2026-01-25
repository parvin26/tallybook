'use client'

import { Transaction } from '@/types'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Wallet, Building2, Smartphone, CreditCard, Edit, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { toast } from 'sonner'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AmountInput } from '@/components/AmountInput'
import { PaymentTypeSelector } from '@/components/PaymentTypeSelector'

const paymentIcons: Record<string, typeof Wallet> = {
  cash: Wallet,
  bank_transfer: Building2,
  duitnow: Smartphone,
  tng: Smartphone,
  boost: Smartphone,
  grabpay: Smartphone,
  shopeepay: Smartphone,
  credit: CreditCard,
}

// paymentLabels removed - will use translations

interface TransactionListProps {
  transactions: Transaction[]
  limit?: number
}

export function TransactionList({ transactions, limit }: TransactionListProps) {
  const { t } = useTranslation()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editPaymentType, setEditPaymentType] = useState<string>('cash')
  const [editNotes, setEditNotes] = useState('')
  const [deletingTransaction, setDeletingTransaction] = useState<Transaction | null>(null)
  const [deletedTransaction, setDeletedTransaction] = useState<Transaction | null>(null)

  // Hooks must be called before any early returns
  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!editingTransaction) return
      
      const amountNum = parseFloat(editAmount)
      if (isNaN(amountNum) || amountNum <= 0) {
        throw new Error(t('transaction.invalidAmount'))
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          amount: amountNum,
          payment_type: editPaymentType,
          notes: editNotes || null,
        })
        .eq('id', editingTransaction.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      toast.success(t('transaction.updated'))
      setEditingTransaction(null)
    },
    onError: () => {
      toast.error(t('common.couldntSave'))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deletingTransaction) return
      
      setDeletedTransaction(deletingTransaction)

      // Soft delete: add deleted_at timestamp
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', deletingTransaction.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      toast.success(t('transaction.deleted'), {
        action: {
          label: t('transaction.undo'),
          onClick: handleUndo,
        },
        duration: 30000,
      })
      setDeletingTransaction(null)
    },
    onError: () => {
      toast.error(t('common.couldntDelete'))
    },
  })

  const handleUndo = async () => {
    if (!deletedTransaction) return

    try {
      const { error } = await supabase
        .from('transactions')
        .update({ deleted_at: null })
        .eq('id', deletedTransaction.id)

      if (error) throw error

      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      queryClient.invalidateQueries({ queryKey: ['todayProfit'] })
      toast.success(t('transaction.updated'))
      setDeletedTransaction(null)
    } catch (err) {
      toast.error(t('common.couldntSave'))
    }
  }

  const handleEditClick = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingTransaction(transaction)
    setEditAmount(transaction.amount.toString())
    setEditPaymentType(transaction.payment_type)
    setEditNotes(transaction.notes || '')
  }

  const handleDeleteClick = (transaction: Transaction, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingTransaction(transaction)
  }

  // Debug logging
  console.log('[TransactionList] Received transactions:', {
    count: transactions?.length || 0,
    limit,
    transactions: transactions?.slice(0, 3).map(t => ({
      id: t.id,
      type: t.transaction_type,
      amount: t.amount,
      date: t.transaction_date,
    })),
  })

  // Early returns for empty states
  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t('home.noTransactions')}</p>
      </div>
    )
  }

  // Filter out soft-deleted transactions (if deleted_at column exists)
  const activeTransactions = transactions.filter(t => !t.deleted_at || t.deleted_at === null)
  const displayTransactions = limit ? activeTransactions.slice(0, limit) : activeTransactions

  if (displayTransactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>{t('home.noTransactions')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {displayTransactions.map((transaction) => {
          const isSale = transaction.transaction_type === 'sale' || transaction.transaction_type === 'payment_received'
          const Icon = paymentIcons[transaction.payment_type] || Wallet
          const paymentLabel = t(`paymentTypes.${transaction.payment_type}`) || transaction.payment_type

          return (
            <div
              key={transaction.id}
              className="w-full bg-surface rounded-lg p-4 border border-divider hover:border-icon-default transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  onClick={() => router.push(`/transaction/${transaction.id}`)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="w-4 h-4 text-icon-default" />
                    <span className="text-sm text-text-secondary">{paymentLabel}</span>
                    {transaction.expense_category && (
                      <span className="text-xs text-text-muted bg-surface-secondary px-2 py-0.5 rounded">
                        {transaction.expense_category}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-1">
                    {formatDate(transaction.transaction_date)}
                  </p>
                  {transaction.notes && (
                    <p className="text-sm text-text-primary mt-1">{transaction.notes}</p>
                  )}
                </button>
                <div className="flex items-center gap-2">
                  <div className={`text-lg font-bold tabular-nums ${
                    isSale ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {isSale ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleEditClick(transaction, e)}
                      className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4 text-icon-default" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteClick(transaction, e)}
                      className="p-1.5 hover:bg-surface-secondary rounded transition-colors"
                      title="Padam"
                    >
                      <Trash2 className="w-4 h-4 text-icon-default" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingTransaction} onOpenChange={(open) => !open && setEditingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('transaction.edit')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            <div>
              <label className="block text-sm font-medium mb-2">{t('transaction.amount')}</label>
              <AmountInput
                value={editAmount}
                onChange={setEditAmount}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('transaction.paymentType')}</label>
              <PaymentTypeSelector
                value={editPaymentType}
                onChange={(value) => setEditPaymentType(value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">{t('transaction.notes')} ({t('common.optional')})</label>
              <textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full p-3 border border-divider rounded-lg bg-surface"
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setEditingTransaction(null)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={updateMutation.isPending || !editAmount}
                className="flex-1 bg-cta-primary hover:bg-cta-hover text-cta-text"
              >
                {updateMutation.isPending ? t('transaction.saving') : t('common.save')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingTransaction} onOpenChange={(open) => !open && setDeletingTransaction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('transaction.delete')}</DialogTitle>
          </DialogHeader>
          <div className="pt-4 space-y-4">
            <p className="text-text-primary">
              {t('transaction.deleteConfirm')} {t('transaction.deleteConfirmDesc')}
            </p>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingTransaction(null)}
                className="flex-1"
              >
                {t('common.cancel')}
              </Button>
              <Button
                onClick={() => {
                  setDeletingTransaction(null)
                  deleteMutation.mutate()
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-money-out hover:bg-money-out/90 text-white"
              >
                {deleteMutation.isPending ? t('common.loading') : t('common.delete')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
