'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useAuth } from '@/contexts/AuthContext'
import { useBusiness } from '@/contexts/BusinessContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, Check } from 'lucide-react'
import { getBusinessTypes, BUSINESS_TYPE_VALUES, MALAYSIAN_STATES } from '@/lib/translations'

export default function SetupPage() {
  const { t } = useTranslation()
  const router = useRouter()
  const { user } = useAuth()
  const { refreshBusiness } = useBusiness()
  const [step, setStep] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    typeOther: '',
    state: '',
    city: '',
    starting_cash: '',
    starting_bank: '',
    agreedToTerms: false,
  })

  const handleSubmit = async () => {
    if (!user) {
      toast.error(t('auth.pleaseLogin'))
      return
    }

    if (!formData.name || !formData.type || !formData.state) {
      toast.error(t('setup.completeAllFields'))
      return
    }

    if (!formData.agreedToTerms) {
      toast.error(t('setup.agreeTermsError'))
      return
    }

    setIsLoading(true)

    try {
      const businessType = formData.type === 'Lain-lain' && formData.typeOther
        ? `Lain-lain: ${formData.typeOther}`
        : formData.type

      const { error } = await supabase
        .from('businesses')
        .insert({
          user_id: user.id,
          name: formData.name,
          business_type: businessType,
          state: formData.state,
          city: formData.city || null,
          starting_cash: parseFloat(formData.starting_cash) || 0,
          starting_bank: parseFloat(formData.starting_bank) || 0,
          is_active: true,
        })

      if (error) {
        toast.error(t('common.couldntSave'))
        setIsLoading(false)
        return
      }

      await refreshBusiness()
      toast.success(t('setup.success'))
      router.push('/')
    } catch (err) {
      toast.error(t('common.couldntSave'))
      setIsLoading(false)
    }
  }

  const canProceedStep1 = formData.name && formData.type && (formData.type !== 'Lain-lain' || formData.typeOther.trim())
  const canProceedStep2 = formData.state
  const canFinish = canProceedStep1 && canProceedStep2 && formData.agreedToTerms

  const businessTypes = getBusinessTypes(t)

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-lg p-8 border border-divider shadow-sm">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-text-primary mb-2">
              {t('setup.title')}
            </h1>
            <p className="text-sm text-text-secondary">
              {t('setup.subtitle', { step, total: 3 })}
            </p>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('setup.businessName')} *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('setup.businessNamePlaceholder')}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('setup.businessType')} *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {businessTypes.map(({ value, label }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, type: value, typeOther: value === 'Lain-lain' ? formData.typeOther : '' })}
                      className={`p-3 rounded-lg border-2 text-sm text-left transition-colors ${
                        formData.type === value
                          ? 'border-cta-primary bg-cta-primary/10 text-cta-primary'
                          : 'border-divider bg-surface text-text-primary hover:border-icon-default'
                      }`}
                    >
                      {formData.type === value && (
                        <Check className="w-4 h-4 inline mr-1" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
                {formData.type === 'Lain-lain' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      {t('setup.typeOther')} *
                    </label>
                    <Input
                      value={formData.typeOther}
                      onChange={(e) => setFormData({ ...formData, typeOther: e.target.value })}
                      placeholder={t('setup.typeOtherPlaceholder')}
                      autoFocus
                    />
                  </div>
                )}
              </div>

              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-text-secondary hover:text-text-primary mb-4"
              >
                ← {t('common.back')}
              </button>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('setup.state')} *
                </label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full h-10 px-3 rounded-lg border border-divider bg-surface text-text-primary focus:outline-none focus:ring-2 focus:ring-cta-primary"
                >
                  <option value="">{t('setup.selectState')}</option>
                  {MALAYSIAN_STATES.map((state) => (
                    <option key={state} value={state}>
                      {state}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('setup.city')} ({t('common.optional')})
                </label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder={t('setup.cityPlaceholder')}
                />
              </div>

              <Button
                onClick={() => setStep(3)}
                disabled={!canProceedStep2}
                className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text"
              >
                {t('common.next')}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-text-secondary hover:text-text-primary mb-4"
              >
                ← {t('common.back')}
              </button>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('setup.startingCash')} ({t('common.optional')})
                  </label>
                  <Input
                    type="number"
                    value={formData.starting_cash}
                    onChange={(e) => setFormData({ ...formData, starting_cash: e.target.value })}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-2">
                    {t('setup.startingBank')} ({t('common.optional')})
                  </label>
                  <Input
                    type="number"
                    value={formData.starting_bank}
                    onChange={(e) => setFormData({ ...formData, starting_bank: e.target.value })}
                    placeholder="0.00"
                    inputMode="decimal"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-divider">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreedToTerms}
                    onChange={(e) => setFormData({ ...formData, agreedToTerms: e.target.checked })}
                    className="mt-1"
                  />
                  <span className="text-sm text-text-primary">
                    {t('setup.agreeToTerms')}{' '}
                    <a href="/terms" target="_blank" className="text-cta-primary hover:underline">
                      {t('setup.terms')}
                    </a>{' '}
                    &{' '}
                    <a href="/privacy" target="_blank" className="text-cta-primary hover:underline">
                      {t('setup.privacy')}
                    </a>
                  </span>
                </label>
              </div>

              <Button
                onClick={handleSubmit}
                disabled={!canFinish || isLoading}
                className="w-full h-12 bg-cta-primary hover:bg-cta-hover text-cta-text"
              >
                {isLoading ? t('common.saving') : t('setup.finish')}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
