'use client'

import { useState, useRef } from 'react'
import { Camera, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from 'react-i18next'

interface ReceiptImageCaptureProps {
  onImageCapture: (file: File | null) => void
  existingImageUrl?: string | null
  variant?: 'sale' | 'expense'
}

export function ReceiptImageCapture({ onImageCapture, existingImageUrl, variant = 'sale' }: ReceiptImageCaptureProps) {
  const { t } = useTranslation()
  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl || null)
  const [isCapturing, setIsCapturing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const hasImage = !!imagePreview

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
        onImageCapture(file)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImagePreview(null)
    onImageCapture(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-text-primary mb-2">
        {t('transaction.receipt')} ({t('common.optional')})
      </label>
      
      {imagePreview ? (
        <div className="space-y-2">
          <div className="relative">
            <img
              src={imagePreview}
              alt="Receipt preview"
              className="w-full h-48 object-cover rounded-lg border border-[var(--tally-border)]"
            />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 p-2 bg-[#EA6C3C] text-white rounded-full hover:bg-[#E56E44] transition-all duration-150 active:scale-[0.95] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#EA6C3C]/25 focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span 
              className="px-3 py-1 rounded-full font-medium border"
              style={variant === 'sale' ? {
                backgroundColor: 'rgba(41,151,140,0.12)',
                color: '#29978C',
                borderColor: '#29978C',
              } : {
                backgroundColor: 'rgba(234,108,60,0.12)',
                color: '#EA6C3C',
                borderColor: '#EA6C3C',
              }}
            >
              ✓ {t('transaction.attached') || 'Attached'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
            id="camera-input"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-input"
          />
          
          <Button
            type="button"
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 transition-all duration-150 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:ring-offset-2"
          >
            <Camera className="w-4 h-4 mr-2" />
            {t('transaction.takePhoto')}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 transition-all duration-150 hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:ring-offset-2"
          >
            <ImageIcon className="w-4 h-4 mr-2" />
            {t('transaction.chooseFile')}
          </Button>
        </div>
      )}
    </div>
  )
}
