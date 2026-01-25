'use client'

import { useState, useEffect } from 'react'
import { X, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { TransactionAttachment, getAttachmentUrl } from '@/lib/attachments'

interface AttachmentPreviewModalProps {
  attachments: TransactionAttachment[]
  initialIndex: number
  open: boolean
  onClose: () => void
}

export function AttachmentPreviewModal({
  attachments,
  initialIndex,
  open,
  onClose,
}: AttachmentPreviewModalProps) {
  const { t } = useTranslation()
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const currentAttachment = attachments[currentIndex]
  const isImage = currentAttachment?.mime_type?.startsWith('image/')
  const isPdf = currentAttachment?.mime_type === 'application/pdf'
  const hasMultiple = attachments.length > 1

  // Reset index when modal opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  // Fetch signed URL when attachment changes
  useEffect(() => {
    if (!open || !currentAttachment) return

    setIsLoading(true)
    setError(null)
    setPreviewUrl(null)

    getAttachmentUrl(currentAttachment.storage_path)
      .then((url) => {
        if (url) {
          setPreviewUrl(url)
        } else {
          setError(t('attachment.loadError') || 'Could not load attachment')
        }
      })
      .catch(() => {
        setError(t('attachment.loadError') || 'Could not load attachment')
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [open, currentAttachment, t])

  // Handle keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft' && hasMultiple) {
        goToPrevious()
      } else if (e.key === 'ArrowRight' && hasMultiple) {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, hasMultiple, currentIndex])

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : attachments.length - 1))
  }

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < attachments.length - 1 ? prev + 1 : 0))
  }

  const handleDownload = () => {
    if (previewUrl && currentAttachment) {
      const link = document.createElement('a')
      link.href = previewUrl
      link.download = currentAttachment.filename
      link.click()
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80"
      onClick={handleBackdropClick}
    >
      {/* Modal Container */}
      <div className="relative w-full h-full flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-white hover:text-white/80 transition-colors"
          >
            <X className="w-6 h-6" />
            <span className="text-sm font-medium">{t('common.close') || 'Close'}</span>
          </button>

          <div className="flex items-center gap-2">
            {hasMultiple && (
              <span className="text-white/70 text-sm">
                {currentIndex + 1} / {attachments.length}
              </span>
            )}
            <button
              onClick={handleDownload}
              disabled={!previewUrl}
              className="p-2 text-white hover:text-white/80 transition-colors disabled:opacity-50"
              title={t('attachment.download') || 'Download'}
            >
              <Download className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filename */}
        <div className="px-4 py-2 bg-black/30 text-center">
          <p className="text-white/90 text-sm truncate">{currentAttachment?.filename}</p>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex items-center justify-center overflow-hidden relative">
          {/* Previous Button */}
          {hasMultiple && (
            <button
              onClick={goToPrevious}
              className="absolute left-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Preview Content */}
          <div className="w-full h-full flex items-center justify-center p-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
                <p className="text-white/70 text-sm">{t('common.loading') || 'Loading...'}</p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center gap-3 text-center">
                <p className="text-white/70 text-sm">{error}</p>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-[#29978C] hover:bg-[#238579] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {t('attachment.downloadInstead') || 'Download instead'}
                </button>
              </div>
            ) : previewUrl ? (
              <>
                {isImage && (
                  <img
                    src={previewUrl}
                    alt={currentAttachment?.filename || 'Attachment'}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    onError={() => setError(t('attachment.loadError') || 'Could not load image')}
                  />
                )}
                {isPdf && (
                  <iframe
                    src={previewUrl}
                    title={currentAttachment?.filename || 'PDF'}
                    className="w-full h-full bg-white rounded-lg"
                    style={{ minHeight: '400px' }}
                  />
                )}
                {!isImage && !isPdf && (
                  <div className="flex flex-col items-center gap-3 text-center">
                    <p className="text-white/70 text-sm">
                      {t('attachment.cannotPreview') || 'Preview not available for this file type'}
                    </p>
                    <button
                      onClick={handleDownload}
                      className="px-4 py-2 bg-[#29978C] hover:bg-[#238579] text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      {t('attachment.download') || 'Download'}
                    </button>
                  </div>
                )}
              </>
            ) : null}
          </div>

          {/* Next Button */}
          {hasMultiple && (
            <button
              onClick={goToNext}
              className="absolute right-2 z-10 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>

        {/* Footer with thumbnail navigation for multiple attachments */}
        {hasMultiple && (
          <div className="px-4 py-3 bg-black/50 backdrop-blur-sm">
            <div className="flex items-center justify-center gap-2 overflow-x-auto">
              {attachments.map((attachment, index) => (
                <button
                  key={attachment.id}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 transition-colors flex items-center justify-center ${
                    index === currentIndex
                      ? 'border-[#29978C] bg-[#29978C]/20'
                      : 'border-white/30 bg-white/10 hover:border-white/50'
                  }`}
                >
                  {attachment.mime_type.startsWith('image/') ? (
                    <span className="text-white/70 text-xs">IMG</span>
                  ) : attachment.mime_type === 'application/pdf' ? (
                    <span className="text-white/70 text-xs">PDF</span>
                  ) : (
                    <span className="text-white/70 text-xs">FILE</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
