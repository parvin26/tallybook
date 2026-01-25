'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { AppShell } from '@/components/AppShell'
import { EditTransactionModal } from '@/components/EditTransactionModal'
import { getTransactionAttachments, getAttachmentUrl } from '@/lib/attachments'
import { Download, File, Image as ImageIcon, Eye } from 'lucide-react'
import { AttachmentViewer } from '@/components/AttachmentViewer'

export default function TransactionDetailPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const params = useParams()
  const transactionId = params.id as string
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewIndex, setPreviewIndex] = useState(0)

  const { data: transaction, isLoading } = useQuery({
    queryKey: ['transaction', transactionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single()

      if (error) throw error
      return data
    },
    enabled: !!transactionId
  })

  const { data: attachments } = useQuery({
    queryKey: ['transactionAttachments', transactionId],
    queryFn: () => getTransactionAttachments(transactionId),
    enabled: !!transactionId
  })

  // Fetch signed URLs for all attachments when viewer opens
  const { data: attachmentsWithUrls } = useQuery({
    queryKey: ['transactionAttachmentsWithUrls', transactionId, attachments?.map(a => a.id).join(',')],
    queryFn: async () => {
      if (!attachments || attachments.length === 0) return []
      
      const withUrls = await Promise.all(
        attachments.map(async (attachment) => {
          const signedUrl = await getAttachmentUrl(attachment.storage_path)
          return {
            id: attachment.id,
            filename: attachment.filename,
            mime_type: attachment.mime_type,
            signedUrl: signedUrl || ''
          }
        })
      )
      return withUrls
    },
    enabled: !!attachments && attachments.length > 0
  })

  const handleDownloadAttachment = async (storagePath: string, filename: string) => {
    const url = await getAttachmentUrl(storagePath)
    if (url) {
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      link.click()
    }
  }

  const handlePreviewAttachment = (index: number) => {
    setPreviewIndex(index)
    setPreviewOpen(true)
  }


  if (isLoading) {
    return (
      <AppShell title={t('transaction.details')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <p className="text-text-muted">{t('common.loading')}</p>
        </div>
      </AppShell>
    )
  }

  if (!transaction) {
    return (
      <AppShell title={t('transaction.details')} showBack showLogo>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <p className="text-text-muted mb-4">{t('transaction.notFound')}</p>
            <Button onClick={() => router.push('/history')}>{t('common.back')}</Button>
          </div>
        </div>
      </AppShell>
    )
  }

  const isSale = transaction.transaction_type === 'sale' || transaction.transaction_type === 'payment_received'

  return (
    <AppShell title={t('transaction.details')} showBack showLogo>
      <div className="max-w-md mx-auto px-6 py-6">

        {/* Transaction Details */}
        <div className="bg-surface rounded-lg p-6 border border-divider mb-6">
          <div className="text-center mb-6">
            <p className="text-sm text-text-secondary mb-2">
              {formatDate(transaction.transaction_date)}
            </p>
            <p className={`text-5xl font-bold tabular-nums ${
              isSale ? 'text-money-in' : 'text-money-out'
            }`}>
              {isSale ? '+' : '–'}{formatCurrency(transaction.amount)}
            </p>
            <p className="text-sm text-text-muted mt-2">
              {isSale ? t('transaction.sale') : t('transaction.expense')}
            </p>
          </div>

          <div className="space-y-4 border-t border-divider pt-4">
            <div>
              <p className="text-xs text-text-muted mb-1">{t('transaction.paymentType')}</p>
              <p className="text-sm text-text-primary">
                {t(`paymentTypes.${transaction.payment_type}`) || transaction.payment_type}
              </p>
            </div>

            {transaction.expense_category && (
              <div>
                <p className="text-xs text-text-muted mb-1">{t('transaction.category')}</p>
                <p className="text-sm text-text-primary">{t(`expenseCategories.${transaction.expense_category}`) || transaction.expense_category}</p>
              </div>
            )}

            {transaction.notes && (
              <div>
                <p className="text-xs text-text-muted mb-1">{t('transaction.notes')}</p>
                <p className="text-sm text-text-primary">{transaction.notes}</p>
              </div>
            )}

            {/* Attachments */}
            {attachments && attachments.length > 0 && (
              <div>
                <p className="text-xs text-text-muted mb-2">{t('transaction.attachments')}</p>
                <div className="space-y-2">
                  {attachments.map((attachment, index) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 bg-[var(--tally-surface-2)] rounded-lg border border-[var(--tally-border)]"
                    >
                      <button
                        onClick={() => handlePreviewAttachment(index)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
                      >
                        {attachment.mime_type.startsWith('image/') ? (
                          <ImageIcon className="w-4 h-4 text-[var(--tally-text-muted)] flex-shrink-0" />
                        ) : (
                          <File className="w-4 h-4 text-[var(--tally-text-muted)] flex-shrink-0" />
                        )}
                        <span className="text-xs text-[var(--tally-text)] truncate">{attachment.filename}</span>
                      </button>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handlePreviewAttachment(index)}
                          className="p-1.5 hover:bg-[var(--tally-surface)] rounded transition-colors"
                          title={t('attachment.preview') || 'Preview'}
                        >
                          <Eye className="w-4 h-4 text-[#29978C]" />
                        </button>
                        <button
                          onClick={() => handleDownloadAttachment(attachment.storage_path, attachment.filename)}
                          className="p-1.5 hover:bg-[var(--tally-surface)] rounded transition-colors"
                          title={t('attachment.download') || 'Download'}
                        >
                          <Download className="w-4 h-4 text-[var(--tally-text-muted)]" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button - Edit only, no delete in header */}
        <div className="pt-4">
          <Button
            onClick={() => setIsEditOpen(true)}
            className="w-full h-12 bg-[#29978C] hover:bg-[#238579] text-white"
          >
            {t('transaction.edit')}
          </Button>
        </div>

        {/* Edit Modal */}
        {transaction && (
          <EditTransactionModal
            transaction={transaction}
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            onDelete={() => {
              router.push('/history')
            }}
          />
        )}

        {/* Attachment Viewer */}
        {attachmentsWithUrls && attachmentsWithUrls.length > 0 && (
          <AttachmentViewer
            attachments={attachmentsWithUrls}
            initialIndex={previewIndex}
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
          />
        )}
      </div>
    </AppShell>
  )
}
