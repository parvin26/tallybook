'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MALAYSIAN_STATES } from '@/lib/translations'

const BUSINESS_CATEGORIES = [
  { value: 'retail', label: 'Retail shop' },
  { value: 'stall', label: 'Stall or kiosk' },
  { value: 'service', label: 'Service' },
  { value: 'online', label: 'Online shop' },
  { value: 'home', label: 'Home business' },
  { value: 'other', label: 'Other' },
] as const

export default function SetupPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const { currentBusiness, refreshBusiness } = useBusiness()
  const [isLoading, setIsLoading] = useState(false)
  
  // Gate: Redirect if business already exists
  useEffect(() => {
    if (currentBusiness) {
      router.replace('/app')
    }
  }, [currentBusiness, router])
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    categoryOther: '',
    country: '',
    state: '',
    city: '',
    starting_cash: '',
    starting_bank: '',
    agreedToTerms: false,
  })

  // Load country from onboarding
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const country = localStorage.getItem('tally-country')
      if (country) {
        setFormData(prev => ({ ...prev, country }))
      }
    }
  }, [])

  const handleSubmit = async () => {
    // Check authentication first
    if (!user) {
      toast.error(t('auth.pleaseLogin') || 'Please sign in to continue.')
      const returnUrl = searchParams.get('returnUrl') || '/setup'
      router.push(`/app/login?returnUrl=${encodeURIComponent(returnUrl)}`)
      return
    }

    // Validate required fields
    if (!formData.name.trim()) {
      toast.error(t('setup.businessNameRequired') || 'Business name is required')
      return
    }

    if (!formData.category) {
      toast.error(t('setup.categoryRequired') || 'Business category is required')
      return
    }

    if (formData.category === 'other' && !formData.categoryOther.trim()) {
      toast.error(t('setup.categoryOtherRequired') || 'Please specify business category')
      return
    }

    if (!formData.agreedToTerms) {
      toast.error(t('setup.agreeTermsError') || 'Please agree to Terms & Privacy Policy')
      return
    }

    setIsLoading(true)

    try {
      // Map category to database format
      const businessType = formData.category === 'other' && formData.categoryOther
        ? `Other: ${formData.categoryOther.trim()}`
        : BUSINESS_CATEGORIES.find(c => c.value === formData.category)?.label || formData.category

      const { error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: formData.name.trim(),
          business_type: businessType,
          state: formData.state || null,
          city: formData.city || null,
          starting_cash: parseFloat(formData.starting_cash) || 0,
          starting_bank: parseFloat(formData.starting_bank) || 0,
          is_active: true,
        })

      if (error) {
        console.error('[Setup] Error creating business:', error)
        toast.error(t('common.couldntSave') || "Couldn't save. Try again.")
        setIsLoading(false)
        return
      }

      // Refresh business context to load the new business
      await refreshBusiness()
      toast.success(t('setup.success') || 'Business created successfully!')
      
      // Route to Stock page after setup
      router.push('/stock')
    } catch (err) {
      console.error('[Setup] Error:', err)
      toast.error(t('common.couldntSave') || "Couldn't save. Try again.")
      setIsLoading(false)
    }
  }

  const canSubmit = formData.name.trim() && 
                    formData.category && 
                    (formData.category !== 'other' || formData.categoryOther.trim()) &&
                    formData.agreedToTerms

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl p-8 shadow-[var(--shadow-soft)]">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {t('setup.title') || 'Set Up Your Business'}
            </h1>
            <p className="text-sm text-muted-foreground">
              {t('setup.subtitleSingle') || 'Add your business details to get started'}
            </p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('setup.businessName') || 'Business Name'} *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('setup.businessNamePlaceholder') || "e.g., Ali's Coffee Shop"}
                autoFocus
                className="tally-input"
              />
            </div>

            {/* Business Category - Dropdown */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('setup.businessCategory') || 'Business Category'} *
              </label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value, categoryOther: value === 'other' ? formData.categoryOther : '' })}
              >
                <SelectTrigger className="tally-input h-12">
                  <SelectValue placeholder={t('setup.selectCategory') || 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_CATEGORIES.map(({ value, label }) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.category === 'other' && (
                <div className="mt-3">
                  <Input
                    value={formData.categoryOther}
                    onChange={(e) => setFormData({ ...formData, categoryOther: e.target.value })}
                    placeholder={t('setup.categoryOtherPlaceholder') || 'Specify business type'}
                    className="tally-input"
                  />
                </div>
              )}
            </div>

            {/* Country - Prefilled, read-only */}
            {formData.country && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('setup.country') || 'Country'}
                </label>
                <Input
                  value={formData.country === 'malaysia' ? 'Malaysia' : formData.country === 'sierra-leone' ? 'Sierra Leone' : formData.country}
                  disabled
                  className="tally-input bg-muted"
                />
              </div>
            )}

            {/* State and City - Optional */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('setup.state') || 'State/Region'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'optional'})</span>
                </label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => setFormData({ ...formData, state: value })}
                >
                  <SelectTrigger className="tally-input h-12">
                    <SelectValue placeholder={t('setup.selectState') || 'Select state'} />
                  </SelectTrigger>
                  <SelectContent>
                    {MALAYSIAN_STATES.map((state) => (
                      <SelectItem key={state} value={state}>
                        {state}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t('setup.city') || 'City/Area'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'optional'})</span>
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('setup.cityPlaceholder') || 'City'}
                  className="tally-input"
                />
              </div>
            </div>

            {/* Starting Cash - Optional */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('setup.startingCash') || 'Starting Cash'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'optional'})</span>
              </label>
              <Input
                type="number"
                value={formData.starting_cash}
                onChange={(e) => setFormData({ ...formData, starting_cash: e.target.value })}
                placeholder="0.00"
                inputMode="decimal"
                className="tally-input"
              />
            </div>

            {/* Starting Bank - Optional */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {t('setup.startingBank') || 'Starting Bank Balance'} <span className="text-muted-foreground text-xs">({t('common.optional') || 'optional'})</span>
              </label>
              <Input
                type="number"
                value={formData.starting_bank}
                onChange={(e) => setFormData({ ...formData, starting_bank: e.target.value })}
                placeholder="0.00"
                inputMode="decimal"
                className="tally-input"
              />
            </div>

            {/* Terms Checkbox */}
            <div className="pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.agreedToTerms}
                  onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <span className="text-sm text-foreground">
                  {t('setup.agreeToTerms') || 'I agree to'}{' '}
                  <a href="/terms" target="_blank" className="text-primary hover:underline">
                    {t('setup.terms') || 'Terms'}
                  </a>{' '}
                  &{' '}
                  <a href="/privacy" target="_blank" className="text-primary hover:underline">
                    {t('setup.privacy') || 'Privacy Policy'}
                  </a>
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={!canSubmit || isLoading}
              className="tally-button-primary w-full"
            >
              {isLoading ? (t('common.saving') || 'Saving...') : (t('setup.completeSetup') || 'Complete setup')}
            </Button>
          </form>
        </div>
      </div>
    </main>
  )
}
