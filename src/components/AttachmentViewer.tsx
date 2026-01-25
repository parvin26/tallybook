'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowLeft, Download, X, FileText, File } from 'lucide-react'

interface AttachmentItem {
  id: string
  filename: string
  mime_type: string
  signedUrl: string
}

interface AttachmentViewerProps {
  open: boolean
  onClose: () => void
  attachments: AttachmentItem[]
  initialIndex: number
}

export function AttachmentViewer({
  open,
  onClose,
  attachments,
  initialIndex
}: AttachmentViewerProps) {
  const { t } = useTranslation()
  const [activeIndex, setActiveIndex] = useState(initialIndex)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  
  // Swipe tracking
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Reset state when opening or changing initial index
  useEffect(() => {
    if (open) {
      setActiveIndex(initialIndex)
      setIsLoading(true)
      setLoadError(false)
    }
  }, [open, initialIndex])

  // Handle escape key
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  // Prevent body scroll when viewer is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  const currentAttachment = attachments[activeIndex]
  const isImage = currentAttachment?.mime_type?.startsWith('image/')
  const isPdf = currentAttachment?.mime_type === 'application/pdf'

  // Get only image attachments for swipe navigation
  const imageAttachments = attachments.filter(a => a.mime_type?.startsWith('image/'))
  const currentImageIndex = isImage 
    ? imageAttachments.findIndex(a => a.id === currentAttachment?.id)
    : -1
  const totalImages = imageAttachments.length
  const canSwipe = isImage && totalImages > 1

  const goToImage = useCallback((direction: 'next' | 'prev') => {
    if (!canSwipe) return
    
    const newImageIndex = direction === 'next'
      ? Math.min(currentImageIndex + 1, totalImages - 1)
      : Math.max(currentImageIndex - 1, 0)
    
    if (newImageIndex !== currentImageIndex) {
      const targetAttachment = imageAttachments[newImageIndex]
      const newActiveIndex = attachments.findIndex(a => a.id === targetAttachment.id)
      if (newActiveIndex !== -1) {
        setActiveIndex(newActiveIndex)
        setIsLoading(true)
        setLoadError(false)
      }
    }
  }, [canSwipe, currentImageIndex, totalImages, imageAttachments, attachments])

  // Pointer/touch swipe handlers
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!canSwipe) return
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }, [canSwipe])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!canSwipe || !pointerStartRef.current) return

    const dx = e.clientX - pointerStartRef.current.x
    const dy = e.clientY - pointerStartRef.current.y

    // Check if horizontal swipe is dominant and exceeds threshold
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        goToImage('next')
      } else {
        goToImage('prev')
      }
    }

    pointerStartRef.current = null
  }, [canSwipe, goToImage])

  const handlePointerCancel = useCallback(() => {
    pointerStartRef.current = null
  }, [])

  // Download handler
  const downloadCurrent = useCallback(() => {
    if (!currentAttachment) return

    try {
      const a = document.createElement('a')
      a.href = currentAttachment.signedUrl
      a.download = currentAttachment.filename
      a.rel = 'noopener'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      // Fallback: open in new tab
      window.open(currentAttachment.signedUrl, '_blank')
    }
  }, [currentAttachment])

  if (!open || !currentAttachment) return null

  return (
    <div 
      className="fixed inset-0 z-50 bg-white md:bg-black/80 md:flex md:items-center md:justify-center"
      onClick={(e) => {
        // Close on backdrop click (desktop only)
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      {/* Modal container - full screen on mobile, centered on desktop */}
      <div 
        ref={containerRef}
        className="h-full w-full md:max-w-[720px] md:max-h-[90vh] md:rounded-[var(--tally-radius-lg,12px)] md:overflow-hidden bg-white flex flex-col"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onPointerLeave={handlePointerCancel}
      >
        {/* Header - 56px sticky */}
        <header className="h-14 min-h-[56px] flex items-center justify-between px-4 border-b border-[var(--tally-border,#E5E5E5)] bg-white sticky top-0 z-10">
          {/* Left: Back button */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 text-[var(--tally-text,#1F2933)] hover:opacity-70 transition-opacity"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>

          {/* Center: Filename + indicators */}
          <div className="flex-1 mx-4 text-center overflow-hidden">
            <p className="text-sm font-medium text-[var(--tally-text,#1F2933)] truncate">
              {currentAttachment.filename}
            </p>
            {canSwipe && (
              <p className="text-xs text-[var(--tally-text-muted,#6B7280)]">
                {currentImageIndex + 1} / {totalImages}
              </p>
            )}
          </div>

          {/* Right: Download + Close buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCurrent}
              className="p-2 rounded-lg hover:bg-[var(--tally-surface,#F5F5F5)] transition-colors"
              title={t('attachment.download')}
            >
              <Download className="w-5 h-5 text-[var(--tally-text,#1F2933)]" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[var(--tally-surface,#F5F5F5)] transition-colors"
              title={t('common.close')}
            >
              <X className="w-5 h-5 text-[var(--tally-text,#1F2933)]" />
            </button>
          </div>
        </header>

        {/* Content area */}
        <div className="flex-1 overflow-auto flex items-center justify-center p-4 touch-pan-y">
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center">
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-[var(--tally-border,#E5E5E5)] border-t-[#29978C] rounded-full animate-spin" />
                </div>
              )}
              {loadError ? (
                <div className="text-center p-6">
                  <File className="w-12 h-12 mx-auto mb-4 text-[var(--tally-text-muted,#6B7280)]" />
                  <p className="text-sm text-[var(--tally-text-muted,#6B7280)] mb-4">
                    {t('attachment.loadError')}
                  </p>
                  <button
                    onClick={downloadCurrent}
                    className="text-sm font-medium text-[#29978C] hover:underline"
                  >
                    {t('attachment.downloadInstead')}
                  </button>
                </div>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentAttachment.signedUrl}
                  alt={currentAttachment.filename}
                  className={`max-w-full max-h-full object-contain select-none ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                  onLoad={() => setIsLoading(false)}
                  onError={() => {
                    setIsLoading(false)
                    setLoadError(true)
                  }}
                  draggable={false}
                />
              )}
            </div>
          ) : isPdf ? (
            <iframe
              src={currentAttachment.signedUrl}
              className="w-full h-full border-none rounded-lg"
              title={currentAttachment.filename}
            />
          ) : (
            // Other file types - show file card
            <div className="bg-[var(--tally-surface,#F5F5F5)] rounded-xl p-8 text-center max-w-sm">
              <FileText className="w-16 h-16 mx-auto mb-4 text-[var(--tally-text-muted,#6B7280)]" />
              <p className="text-base font-medium text-[var(--tally-text,#1F2933)] mb-2 break-all">
                {currentAttachment.filename}
              </p>
              <p className="text-sm text-[var(--tally-text-muted,#6B7280)] mb-6">
                {t('attachment.cannotPreview')}
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.open(currentAttachment.signedUrl, '_blank')}
                  className="w-full py-3 px-4 bg-[#29978C] text-white rounded-lg font-medium hover:bg-[#238579] transition-colors"
                >
                  {t('common.open')}
                </button>
                <button
                  onClick={downloadCurrent}
                  className="w-full py-3 px-4 border border-[var(--tally-border,#E5E5E5)] rounded-lg font-medium text-[var(--tally-text,#1F2933)] hover:bg-[var(--tally-surface,#F5F5F5)] transition-colors"
                >
                  {t('attachment.download')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
