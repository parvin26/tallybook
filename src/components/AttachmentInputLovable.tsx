'use client'

import { useState, useRef } from 'react'
import { Camera, Image as ImageIcon, X, File } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface AttachmentInputLovableProps {
  onFilesChange?: (files: File[]) => void
  variant?: 'sale' | 'expense'
  initialFiles?: File[]
}

export function AttachmentInputLovable({ 
  onFilesChange, 
  variant = 'sale',
  initialFiles = []
}: AttachmentInputLovableProps) {
  const { t } = useTranslation()
  const [selectedFiles, setSelectedFiles] = useState<File[]>(initialFiles)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileAdd = (file: File) => {
    const newFiles = [...selectedFiles, file]
    setSelectedFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const handleFileRemove = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index)
    setSelectedFiles(newFiles)
    onFilesChange?.(newFiles)
  }

  const handleCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file) {
      handleFileAdd(file)
    }
    // Reset input to allow selecting same file again
    if (cameraInputRef.current) {
      cameraInputRef.current.value = ''
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    files.forEach(file => handleFileAdd(file))
    // Reset input to allow selecting same files again
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm text-[var(--tally-text-muted)] mb-2 font-medium">
        {t('transaction.attachment')} ({t('common.optional')})
      </label>
      
      <div className="flex gap-2">
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCameraChange}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="*"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 px-4 py-3 rounded-lg border border-[var(--tally-border)] bg-[var(--tally-surface)] text-[var(--tally-text)] flex items-center justify-center gap-2 hover:bg-[var(--tally-surface-2)] transition-colors active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span className="text-sm font-medium">{t('transaction.takePhoto')}</span>
        </button>
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-1 px-4 py-3 rounded-lg border border-[var(--tally-border)] bg-[var(--tally-surface)] text-[var(--tally-text)] flex items-center justify-center gap-2 hover:bg-[var(--tally-surface-2)] transition-colors active:scale-95"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm font-medium">{t('transaction.chooseFile')}</span>
        </button>
      </div>

      {/* Attached Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          {selectedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between p-2 bg-[var(--tally-surface-2)] rounded-lg border border-[var(--tally-border)]"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <File className="w-4 h-4 text-[var(--tally-text-muted)] flex-shrink-0" />
                <span className="text-xs text-[var(--tally-text)] truncate">{file.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleFileRemove(index)}
                className="p-1 hover:bg-[var(--tally-surface)] rounded transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4 text-[var(--tally-text-muted)]" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
