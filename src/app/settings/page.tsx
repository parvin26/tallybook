'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useBusiness } from '@/contexts/BusinessContext'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { useTransactions } from '@/hooks/useTransactions'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AppShell } from '@/components/AppShell'
import { LogOut, Upload, Camera, X, Building2, Check, Plus, Trash2, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getBusinessProfile, saveBusinessProfile, BusinessProfile } from '@/lib/businessProfile'
import { canInstall, isIOS, isStandalone, promptInstall } from '@/lib/pwa'
import { isGuestMode, getGuestBusiness, saveGuestBusiness } from '@/lib/guest-storage'
import { useIntroContext } from '@/contexts/IntroContext'
import { STORAGE_KEYS } from '@/lib/storage-keys'
import { useQuickAmounts } from '@/hooks/useQuickAmounts'
import { useCurrency } from '@/hooks/useCurrency'
import { COUNTRIES } from '@/lib/countries'
import { getCurrencyFromCountry, normalizeCountryCode } from '@/lib/currency'
import { getWhatsAppSupportUrl } from '@/lib/constants'

export default function AccountPage() {
  const router = useRouter()
  const { currentBusiness, refreshBusiness } = useBusiness()
  const { signOut, user } = useAuth()
  const { data: transactions } = useTransactions()
  const queryClient = useQueryClient()
  const { t, i18n } = useTranslation()
  const guestMode = typeof window !== 'undefined' ? isGuestMode() : false
  const [isProfileEditOpen, setIsProfileEditOpen] = useState(false)
  const [isIOSModalOpen, setIsIOSModalOpen] = useState(false)
  const [isLanguageModalOpen, setIsLanguageModalOpen] = useState(false)
  const [isCountryModalOpen, setIsCountryModalOpen] = useState(false)
  const { openIntro } = useIntroContext()
  const [profile, setProfile] = useState<BusinessProfile | null>(null)
  const [profileEditData, setProfileEditData] = useState<BusinessProfile>({
    ownerName: '',
    businessName: '',
    businessCategory: '',
    country: 'Malaysia',
    stateOrRegion: '',
    area: '',
    logoDataUrl: '',
  })
  // Category dropdown state
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [customCategory, setCustomCategory] = useState<string>('')
  
  // Predefined business categories
  const businessCategories = [
    'Retail',
    'Food and Beverage',
    'Home Based Business',
    'Fashion and Apparel',
    'Beauty and Personal Care',
    'Agriculture and Farming',
    'Food Processing',
    'Wholesale and Trading',
    'Services General',
    'Transportation and Delivery',
    'Repair and Maintenance',
    'Construction and Trades',
    'Education and Training',
    'Health and Wellness',
    'Digital and Online Business',
    'Manufacturing Small Scale',
    'Hospitality and Lodging',
    'Arts and Crafts',
    'Other',
  ]
  
  const [pwaState, setPwaState] = useState({
    canInstall: false,
    isIOS: false,
    isStandalone: false,
  })

  const {
    salePresets,
    expensePresets,
    inventoryPresets,
    saveSalePresets,
    saveExpensePresets,
    saveInventoryPresets,
  } = useQuickAmounts()
  const [saleNewValue, setSaleNewValue] = useState('')
  const [expenseNewValue, setExpenseNewValue] = useState('')
  const [inventoryNewValue, setInventoryNewValue] = useState('')
  const [showAddSale, setShowAddSale] = useState(false)
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showAddInventory, setShowAddInventory] = useState(false)
  const [openingCash, setOpeningCash] = useState('')
  const [openingBank, setOpeningBank] = useState('')

  // Check PWA state on mount and when component updates
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPwaState({
        canInstall: canInstall(),
        isIOS: isIOS(),
        isStandalone: isStandalone(),
      })
    }
  }, [])

  // Load profile on mount
  useEffect(() => {
    const loadedProfile = getBusinessProfile()
    setProfile(loadedProfile)
    if (loadedProfile) {
      setProfileEditData(loadedProfile)
      // Initialize category dropdown state
      const savedCategory = loadedProfile.businessCategory || ''
      if (savedCategory && businessCategories.includes(savedCategory)) {
        setSelectedCategory(savedCategory)
        setCustomCategory('')
      } else if (savedCategory) {
        // Saved category doesn't match predefined options, use "Other"
        setSelectedCategory('Other')
        setCustomCategory(savedCategory)
      } else {
        setSelectedCategory('')
        setCustomCategory('')
      }
    } else if (currentBusiness) {
      // Initialize from current business if profile doesn't exist
      setProfileEditData({
        ownerName: '',
        businessName: currentBusiness.name || '',
        businessCategory: '',
        country: 'Malaysia',
        stateOrRegion: currentBusiness.state || '',
        area: currentBusiness.city || '',
        logoDataUrl: '',
      })
      setSelectedCategory('')
      setCustomCategory('')
    }
  }, [currentBusiness])

  // Load opening balance (auth: from currentBusiness; guest: from guest-storage)
  useEffect(() => {
    if (guestMode) {
      const g = getGuestBusiness()
      setOpeningCash((g?.starting_cash ?? 0) === 0 ? '' : String(g!.starting_cash))
      setOpeningBank((g?.starting_bank ?? 0) === 0 ? '' : String(g!.starting_bank))
    } else if (currentBusiness) {
      setOpeningCash((currentBusiness.starting_cash ?? 0) === 0 ? '' : String(currentBusiness.starting_cash))
      setOpeningBank((currentBusiness.starting_bank ?? 0) === 0 ? '' : String(currentBusiness.starting_bank))
    } else {
      setOpeningCash('')
      setOpeningBank('')
    }
  }, [guestMode, currentBusiness?.id, currentBusiness?.starting_cash, currentBusiness?.starting_bank])

  const handleLanguageChange = (lang: 'bm' | 'en' | 'krio') => {
    setIsLanguageModalOpen(false) // Close modal first
    try {
      i18n.changeLanguage(lang).then(() => {
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang)
        let message = t('settings.languageChangedEn')
        if (lang === 'bm') {
          message = t('settings.languageChanged')
        } else if (lang === 'krio') {
          message = t('settings.languageChangedKrio', { defaultValue: 'Language changed to Krio' })
        }
        toast.success(message)
        setTimeout(() => {
          window.location.reload()
        }, 500)
      }).catch((err) => {
        console.error('Error changing language:', err)
        toast.error(t('settings.languageError'))
      })
    } catch (err) {
      console.error('Error changing language:', err)
      toast.error(t('settings.languageError'))
    }
  }

  const handleCountryChange = (country: string) => {
    setIsCountryModalOpen(false)
    localStorage.setItem(STORAGE_KEYS.COUNTRY, country)
    window.dispatchEvent(new Event('tally-country-change'))
    toast.success(t('settings.countryChanged', { defaultValue: 'Country updated' }))
  }

  const saveOpeningBalance = async () => {
    const cash = parseFloat(openingCash)
    const bank = parseFloat(openingBank)
    const cashNum = Number.isFinite(cash) ? cash : 0
    const bankNum = Number.isFinite(bank) ? bank : 0
    try {
      if (guestMode) {
        const existing = getGuestBusiness()
        saveGuestBusiness({
          ...existing,
          name: existing?.name ?? '',
          starting_cash: cashNum,
          starting_bank: bankNum,
        })
        toast.success(t('common.saved') || 'Saved')
      } else if (currentBusiness?.id) {
        const { error } = await supabase
          .from('businesses')
          .update({ starting_cash: cashNum, starting_bank: bankNum })
          .eq('id', currentBusiness.id)
        if (error) throw error
        await refreshBusiness()
        toast.success(t('common.saved') || 'Saved')
      }
    } catch {
      toast.error(t('common.couldntSave') || "Couldn't save")
    }
  }

  const getCurrentLanguageName = (): string => {
    const current = i18n.language
    if (current === 'bm') return t('settings.bahasaMalaysia')
    if (current === 'krio') return t('settings.krio')
    return t('settings.english')
  }

  const handleExportCSV = () => {
    if (!transactions || transactions.length === 0) {
      toast.error(t('csv.noTransactions'))
      return
    }

    const activeTransactions = transactions ?? []
    
    if (!activeTransactions || activeTransactions.length === 0) {
      toast.error(t('csv.noTransactions'))
      return
    }

    const headers = [
      t('csv.headers.date'),
      t('csv.headers.type'),
      t('csv.headers.amount'),
      t('csv.headers.payment'),
      t('csv.headers.category'),
      t('csv.headers.notes')
    ]
    const rows = activeTransactions.map(transaction => [
      transaction.transaction_date,
      transaction.transaction_type === 'sale' ? t('csv.sale') : t('csv.expense'),
      transaction.amount,
      t(`paymentTypes.${transaction.payment_method === 'card' ? 'credit' : transaction.payment_method === 'e_wallet' ? 'mobile_money' : transaction.payment_method}`) || transaction.payment_method,
      transaction.expense_category ? (t(`expenseCategories.${transaction.expense_category}`) || transaction.expense_category) : '',
      transaction.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `tally-transactions-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    toast.success(t('csv.exportSuccess'))
  }

  const handleLogout = async () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Settings] Logout initiated from:', window.location.pathname)
    }
    
    try {
      // Clear React Query cache to prevent stale data after logout
      queryClient.clear()
      
      // Sign out and clear auth state
      await signOut()
      
      if (process.env.NODE_ENV === 'development') {
        console.log('[Settings] Sign out completed, redirecting to /login')
      }
      
      // Use replace to prevent redirect loops and avoid adding to history
      router.replace('/login')
      
      // Force a refresh to ensure all state is cleared
      router.refresh()
    } catch (error) {
      console.error('[Settings] Logout error:', error)
      // Even on error, redirect to login
      router.replace('/login')
    }
  }

  const handleSaveProfile = async () => {
    // Validate required fields
    if (!profileEditData.ownerName.trim()) {
      toast.error(t('account.ownerNameRequired'))
      return
    }
    if (!profileEditData.businessName.trim()) {
      toast.error(t('account.businessNameRequired'))
      return
    }
    if (!profileEditData.country.trim()) {
      toast.error(t('account.countryRequired'))
      return
    }

    try {
      // Determine final category value
      let finalCategory = ''
      if (selectedCategory === 'Other') {
        finalCategory = customCategory.trim()
      } else if (selectedCategory) {
        finalCategory = selectedCategory
      }
      
      // Update profile data with category
      const updatedProfile = {
        ...profileEditData,
        businessCategory: finalCategory,
      }
      
      // Save to localStorage (single source of truth)
      saveBusinessProfile(updatedProfile)
      setProfile(updatedProfile)
      setProfileEditData(updatedProfile)

      // Also update business name in Supabase if business exists (for backward compatibility)
      // Note: Business Profile is the primary source, Supabase is secondary
      if (currentBusiness?.id && updatedProfile.businessName !== currentBusiness.name) {
        const { error } = await supabase
          .from('businesses')
          .update({ name: updatedProfile.businessName })
          .eq('id', currentBusiness.id)

        if (error) {
          console.error('[Account] Error updating business name:', error)
          // Don't fail the whole operation, just log
        } else {
          await refreshBusiness()
        }
      }

      setIsProfileEditOpen(false)
      toast.success(t('account.profileSaved'))
      
      // Force a re-render of components that depend on Business Profile
      // HomeHeader reads from localStorage on every render, so it will update automatically
      // Summary page will read from Business Profile on next PDF generation
    } catch (error) {
      toast.error(t('common.couldntSave'))
    }
  }

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileEditData({
          ...profileEditData,
          logoDataUrl: reader.result as string,
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveLogo = () => {
    setProfileEditData({
      ...profileEditData,
      logoDataUrl: '',
    })
  }

  const currentCountryCode =
    typeof window !== 'undefined'
      ? normalizeCountryCode(localStorage.getItem(STORAGE_KEYS.COUNTRY))
      : null
  const currentCountryName = currentCountryCode
    ? COUNTRIES.find((c) => c.code === currentCountryCode)?.name ?? null
    : null
  const { symbol: currencySymbol, code: currencyCode } = useCurrency()

  return (
    <>
    <AppShell title={t('account.title')} showBack showLogo>
      <div className="min-h-screen bg-gray-50 pb-32 pt-4 px-4 space-y-3 sm:space-y-4 max-w-[480px] mx-auto">

        {/* Card 1: Profile — Avatar left, Name/Business middle, Edit right */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              {profile?.logoDataUrl ? (
                <img
                  src={profile.logoDataUrl}
                  alt=""
                  className="w-14 h-14 rounded-full object-cover border border-gray-200"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center">
                  <Building2 className="w-7 h-7 text-gray-500" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-base font-medium text-gray-900 truncate">
                {profile?.businessName || <span className="text-gray-400 italic">{t('account.addBusinessName')}</span>}
              </p>
              <p className="text-sm text-gray-500 truncate">
                {profile?.ownerName || <span className="italic">{t('account.addYourName')}</span>}
              </p>
              {guestMode && (
                <p className="text-xs text-amber-600 font-medium mt-0.5">{t('guest.mode')}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const loadedProfile = getBusinessProfile()
                if (loadedProfile) {
                  setProfileEditData(loadedProfile)
                  const savedCategory = loadedProfile.businessCategory || ''
                  if (savedCategory && businessCategories.includes(savedCategory)) {
                    setSelectedCategory(savedCategory)
                    setCustomCategory('')
                  } else if (savedCategory) {
                    setSelectedCategory('Other')
                    setCustomCategory(savedCategory)
                  } else {
                    setSelectedCategory('')
                    setCustomCategory('')
                  }
                } else if (currentBusiness) {
                  setProfileEditData({
                    ownerName: '',
                    businessName: currentBusiness.name || '',
                    businessCategory: '',
                    country: 'Malaysia',
                    stateOrRegion: currentBusiness.state || '',
                    area: currentBusiness.city || '',
                    logoDataUrl: '',
                  })
                  setSelectedCategory('')
                  setCustomCategory('')
                }
                setIsProfileEditOpen(true)
              }}
              className="flex-shrink-0 text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)]"
            >
              {t('account.editProfile')}
            </Button>
          </div>
        </div>

        {/* Card: Opening balance — compact, 2-col grid on >=360px, stacked on smaller */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
          <h2 className="text-tally-section-title font-semibold text-gray-900 mb-1.5">{t('settings.openingBalance') || 'Opening balance'}</h2>
          <p className="text-tally-caption text-gray-500 mb-3">{t('settings.openingBalanceHint') || 'Used for Balance Sheet. Set your starting cash and bank balance.'}</p>
          <div className="grid grid-cols-1 min-[360px]:grid-cols-2 gap-3">
            <div>
              <label className="block text-tally-caption text-gray-600 mb-1">{t('setup.startingCash') || 'Starting Cash'}</label>
              <Input
                type="number"
                inputMode="decimal"
                value={openingCash}
                onChange={(e) => setOpeningCash(e.target.value)}
                onBlur={saveOpeningBalance}
                placeholder="0"
                className="tally-input min-h-[44px] h-11 sm:h-12"
              />
            </div>
            <div>
              <label className="block text-tally-caption text-gray-600 mb-1">{t('setup.startingBank') || 'Starting Bank Balance'}</label>
              <Input
                type="number"
                inputMode="decimal"
                value={openingBank}
                onChange={(e) => setOpeningBank(e.target.value)}
                onBlur={saveOpeningBalance}
                placeholder="0"
                className="tally-input min-h-[44px] h-11 sm:h-12"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Preferences — Country, Language, Currency in one row */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 sm:p-4">
          <h2 className="text-tally-section-title font-semibold text-gray-900 mb-2.5">{t('account.preferences')}</h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="relative min-h-[44px] flex flex-col items-stretch justify-center rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-2 pr-8 text-left active:bg-gray-100 transition-colors"
            >
              <span className="text-tally-caption text-gray-500">{t('account.country')}</span>
              <span className="text-sm font-medium text-gray-900 truncate mt-0.5">{currentCountryName ?? t('account.notSet')}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIsLanguageModalOpen(true)}
              className="relative min-h-[44px] flex flex-col items-stretch justify-center rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-2 pr-8 text-left active:bg-gray-100 transition-colors"
            >
              <span className="text-tally-caption text-gray-500">{t('settings.language')}</span>
              <span className="text-sm font-medium text-gray-900 truncate mt-0.5">{getCurrentLanguageName()}</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => setIsCountryModalOpen(true)}
              className="relative min-h-[44px] flex flex-col items-stretch justify-center rounded-lg border border-gray-200 bg-gray-50/50 px-2.5 py-2 pr-8 text-left active:bg-gray-100 transition-colors"
            >
              <span className="text-tally-caption text-gray-500">{t('account.currency')}</span>
              <span className="text-sm font-medium text-gray-900 tabular-nums truncate mt-0.5">{currencyCode} ({currencySymbol})</span>
              <ChevronRight className="w-3.5 h-3.5 text-gray-400 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" aria-hidden />
            </button>
          </div>
        </div>

        {/* Card 3: Quick Amounts — chips/pills, horizontal scroll if needed */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('settings.quickAmounts')}</h2>
            <div className="space-y-3">
              {/* Sale row: chips + [+] */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-gray-500 flex-shrink-0 mr-1">{t('settings.saleButtons')}</span>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {salePresets.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-0.5 pl-2 pr-1 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-900"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => saveSalePresets(salePresets.filter((x) => x !== val))}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showAddSale ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={saleNewValue}
                      onChange={(e) => setSaleNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseFloat(saleNewValue.replace(/,/g, ''))
                          if (Number.isFinite(num) && num >= 0 && !salePresets.includes(num)) {
                            saveSalePresets([...salePresets, num])
                            setSaleNewValue('')
                            setShowAddSale(false)
                          } else if (Number.isFinite(num) && num >= 0) setShowAddSale(false)
                        }
                        if (e.key === 'Escape') setShowAddSale(false)
                      }}
                      className="w-14 h-7 text-xs py-0 px-1.5 rounded-full border-gray-200"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => {
                        const num = parseFloat(saleNewValue.replace(/,/g, ''))
                        if (!Number.isFinite(num) || num < 0) {
                          toast.error(t('settings.invalidPreset'))
                          return
                        }
                        if (salePresets.includes(num)) {
                          setSaleNewValue('')
                          setShowAddSale(false)
                          return
                        }
                        saveSalePresets([...salePresets, num])
                        setSaleNewValue('')
                        setShowAddSale(false)
                      }}
                    >
                      +
                    </Button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSale(true)}
                    className="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm flex-shrink-0"
                    aria-label="Add"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                </div>
              </div>
              {/* Expense row: chips + [+] */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-gray-500 flex-shrink-0 mr-1">{t('settings.expenseButtons')}</span>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {expensePresets.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-0.5 pl-2 pr-1 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-900"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => saveExpensePresets(expensePresets.filter((x) => x !== val))}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showAddExpense ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step="any"
                      placeholder="0"
                      value={expenseNewValue}
                      onChange={(e) => setExpenseNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseFloat(expenseNewValue.replace(/,/g, ''))
                          if (Number.isFinite(num) && num >= 0 && !expensePresets.includes(num)) {
                            saveExpensePresets([...expensePresets, num])
                            setExpenseNewValue('')
                            setShowAddExpense(false)
                          } else if (Number.isFinite(num) && num >= 0) setShowAddExpense(false)
                        }
                        if (e.key === 'Escape') setShowAddExpense(false)
                      }}
                      className="w-14 h-7 text-xs py-0 px-1.5 rounded-full border-gray-200"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => {
                        const num = parseFloat(expenseNewValue.replace(/,/g, ''))
                        if (!Number.isFinite(num) || num < 0) {
                          toast.error(t('settings.invalidPreset'))
                          return
                        }
                        if (expensePresets.includes(num)) {
                          setExpenseNewValue('')
                          setShowAddExpense(false)
                          return
                        }
                        saveExpensePresets([...expensePresets, num])
                        setExpenseNewValue('')
                        setShowAddExpense(false)
                      }}
                    >
                      +
                    </Button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddExpense(true)}
                    className="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm flex-shrink-0"
                    aria-label="Add"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                </div>
              </div>

              {/* Inventory row: chips + [+] */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-gray-500 flex-shrink-0 mr-1">{t('settings.inventoryButtons')}</span>
                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                {inventoryPresets.map((val) => (
                  <span
                    key={val}
                    className="inline-flex items-center gap-0.5 pl-2 pr-1 py-1 rounded-full bg-gray-100 border border-gray-200 text-xs text-gray-900"
                  >
                    {val}
                    <button
                      type="button"
                      onClick={() => saveInventoryPresets(inventoryPresets.filter((x) => x !== val))}
                      className="p-0.5 rounded-full hover:bg-gray-200 text-gray-500"
                      aria-label="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {showAddInventory ? (
                  <span className="inline-flex items-center gap-1">
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step="1"
                      placeholder="0"
                      value={inventoryNewValue}
                      onChange={(e) => setInventoryNewValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const num = parseFloat(inventoryNewValue.replace(/,/g, ''))
                          if (Number.isFinite(num) && num >= 0 && !inventoryPresets.includes(num)) {
                            saveInventoryPresets([...inventoryPresets, num])
                            setInventoryNewValue('')
                            setShowAddInventory(false)
                          } else if (Number.isFinite(num) && num >= 0) setShowAddInventory(false)
                        }
                        if (e.key === 'Escape') setShowAddInventory(false)
                      }}
                      className="w-14 h-7 text-xs py-0 px-1.5 rounded-full border-gray-200"
                      autoFocus
                    />
                    <Button
                      type="button"
                      size="sm"
                      className="h-7 w-7 p-0 rounded-full"
                      onClick={() => {
                        const num = parseFloat(inventoryNewValue.replace(/,/g, ''))
                        if (!Number.isFinite(num) || num < 0) {
                          toast.error(t('settings.invalidPreset'))
                          return
                        }
                        if (inventoryPresets.includes(num)) {
                          setInventoryNewValue('')
                          setShowAddInventory(false)
                          return
                        }
                        saveInventoryPresets([...inventoryPresets, num])
                        setInventoryNewValue('')
                        setShowAddInventory(false)
                      }}
                    >
                      +
                    </Button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddInventory(true)}
                    className="w-7 h-7 rounded-full border border-dashed border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm flex-shrink-0"
                    aria-label="Add"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
                </div>
              </div>
            </div>
        </div>

        {/* Card 4: Support — About, Privacy, Contact, Show Intro (side by side) */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h2 className="text-base font-semibold text-gray-900 mb-3">{t('account.support')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Link href="/help" className="flex items-center justify-center py-3 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-center">
              {t('account.about')}
            </Link>
            <Link href={i18n.language ? `/privacy?lang=${i18n.language}` : '/privacy'} className="flex items-center justify-center py-3 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-center">
              {t('account.privacy')}
            </Link>
            <a
              href={getWhatsAppSupportUrl('Halo, saya perlu bantuan dengan TALLY')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center py-3 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-center"
            >
              {t('account.contact')}
            </a>
            <button type="button" onClick={openIntro} className="flex items-center justify-center py-3 rounded-lg border border-gray-200 bg-gray-50/50 text-sm text-gray-700 hover:bg-gray-100 transition-colors text-center w-full">
              {t('account.showIntro')}
            </button>
          </div>
        </div>

        {/* Install PWA — white card (only if not installed) */}
        {!pwaState.isStandalone && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">{t('pwa.install.title')}</p>
                <p className="text-xs text-gray-500">
                  {pwaState.canInstall ? t('pwa.install.subtitle.canInstall') : pwaState.isIOS ? t('pwa.install.subtitle.ios') : 'Not available yet'}
                </p>
              </div>
              {pwaState.canInstall && (
                <Button variant="outline" size="sm" onClick={async () => {
                  const installed = await promptInstall()
                  if (installed) {
                    toast.success(t('pwa.install.success'))
                    setPwaState({ canInstall: false, isIOS: pwaState.isIOS, isStandalone: true })
                  } else toast.error(t('pwa.install.cancelled'))
                }} className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)] flex-shrink-0">
                  {t('pwa.install.button')}
                </Button>
              )}
              {pwaState.isIOS && !pwaState.canInstall && (
                <Button variant="outline" size="sm" onClick={() => setIsIOSModalOpen(true)} className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)] flex-shrink-0">
                  {t('pwa.install.how')}
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Export CSV — white card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.exportCSV')}</p>
              <p className="text-xs text-gray-500">{t('settings.exportCSVDesc')}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)]">
              {t('account.export')}
            </Button>
          </div>
        </div>

        {/* Footer: Red Log Out button */}
        <Button
          variant="outline"
          className="w-full bg-white border-red-600 text-red-600 hover:bg-red-50"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('settings.logout')}
        </Button>

        {/* Version — small gray text at the very bottom */}
        <div className="text-center text-xs text-gray-500 pb-2">
          {t('settings.version')} 0.1.0
        </div>

        {/* Edit Business Profile Modal */}
        <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
          <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {t('account.editProfile')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium mb-3 text-[var(--tally-text)]">
                  {t('account.logo')} ({t('common.optional')})
                </label>
                {profileEditData.logoDataUrl ? (
                  <div className="space-y-3">
                    <div className="flex justify-center">
                      <div className="relative">
                        <img
                          src={profileEditData.logoDataUrl}
                          alt="Logo preview"
                          className="w-24 h-24 rounded-full object-cover border-2 border-[var(--tally-border)]"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-[#EA6C3C] text-white rounded-full flex items-center justify-center hover:bg-[#E56E44] transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        className="hidden"
                        id="logo-upload-replace"
                      />
                      <label
                        htmlFor="logo-upload-replace"
                        className="flex items-center justify-center gap-2 w-full p-3 border border-[var(--tally-border)] rounded-lg cursor-pointer hover:bg-[var(--tally-surface-2)] transition-colors"
                      >
                        <Upload className="w-4 h-4 text-[var(--tally-text-muted)]" />
                        <span className="text-sm text-[var(--tally-text)]">{t('account.replaceLogo')}</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center gap-3 w-full p-8 border-2 border-dashed border-[var(--tally-border)] rounded-lg cursor-pointer hover:bg-[var(--tally-surface-2)] transition-colors"
                    >
                      <div className="w-16 h-16 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                        <Camera className="w-8 h-8 text-[#29978C]" />
                      </div>
                      <span className="text-sm font-medium text-[var(--tally-text)]">{t('account.uploadLogo')}</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Owner Name - Required */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.ownerName')} <span className="text-[#B94A3A]">*</span>
                </label>
                <Input
                  value={profileEditData.ownerName}
                  onChange={(e) => setProfileEditData({ ...profileEditData, ownerName: e.target.value })}
                  placeholder={t('account.ownerNamePlaceholder')}
                />
              </div>

              {/* Business Name - Required */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.businessName')} <span className="text-[#B94A3A]">*</span>
                </label>
                <Input
                  value={profileEditData.businessName}
                  onChange={(e) => setProfileEditData({ ...profileEditData, businessName: e.target.value })}
                  placeholder={t('account.businessNamePlaceholder')}
                />
              </div>

              {/* Category - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.category')} ({t('common.optional')})
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    const newValue = e.target.value
                    setSelectedCategory(newValue)
                    if (newValue !== 'Other') {
                      setCustomCategory('')
                    }
                  }}
                  className="w-full h-10 rounded-[var(--tally-radius)] border border-[var(--tally-border)] bg-[var(--tally-surface)] px-3 py-2 text-sm text-[var(--tally-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(41,151,140,0.25)] focus-visible:border-[#29978C] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-150"
                >
                  <option value="">{t('account.selectCategory') || 'Select category'}</option>
                  {businessCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
                {selectedCategory === 'Other' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                      {t('account.specifyCategory') || 'Specify category'} ({t('common.optional')})
                    </label>
                    <Input
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder={t('account.categoryPlaceholder')}
                    />
                  </div>
                )}
              </div>

              {/* Country - Required */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.country')} <span className="text-[#B94A3A]">*</span>
                </label>
                <Input
                  value={profileEditData.country}
                  onChange={(e) => setProfileEditData({ ...profileEditData, country: e.target.value })}
                  placeholder={t('account.countryPlaceholder')}
                />
              </div>

              {/* State/Region - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.state')} ({t('common.optional')})
                </label>
                <Input
                  value={profileEditData.stateOrRegion || ''}
                  onChange={(e) => setProfileEditData({ ...profileEditData, stateOrRegion: e.target.value })}
                  placeholder={t('account.statePlaceholder')}
                />
              </div>

              {/* Area/City - Optional */}
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--tally-text)]">
                  {t('account.area')} ({t('common.optional')})
                </label>
                <Input
                  value={profileEditData.area || ''}
                  onChange={(e) => setProfileEditData({ ...profileEditData, area: e.target.value })}
                  placeholder={t('account.areaPlaceholder')}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => {
                    // Revert changes
                    const loadedProfile = getBusinessProfile()
                    if (loadedProfile) {
                      setProfileEditData(loadedProfile)
                    }
                    setIsProfileEditOpen(false)
                  }}
                  className="flex-1"
                >
                  {t('account.cancel') || t('common.cancel')}
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 tally-button-primary"
                >
                  {t('account.saveProfile') || t('common.save')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* iOS Install Instructions Modal */}
        <Dialog open={isIOSModalOpen} onOpenChange={setIsIOSModalOpen}>
          <DialogContent className="max-w-[480px] bg-[var(--tally-bg)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
                {t('pwa.iosModal.title')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 pt-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#29978C] text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)] mb-1">
                      {t('pwa.iosModal.step1.title')}
                    </p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {t('pwa.iosModal.step1.description')}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#29978C] text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)] mb-1">
                      {t('pwa.iosModal.step2.title')}
                    </p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {t('pwa.iosModal.step2.description')}
                    </p>
                  </div>
                </div>
              </div>
              <Button
                onClick={() => setIsIOSModalOpen(false)}
                className="w-full bg-[#29978C] hover:bg-[#238579] text-white"
              >
                {t('common.close')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Country Selection Modal */}
        <Dialog open={isCountryModalOpen} onOpenChange={setIsCountryModalOpen}>
          <DialogContent className="max-w-[480px] bg-background">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-foreground">
                {t('account.country')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-4">
              {COUNTRIES.map((c) => {
                const isSelected = currentCountryCode === c.code
                return (
                  <button
                    key={c.code}
                    onClick={() => handleCountryChange(c.code)}
                    className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? 'bg-accent border-primary text-foreground'
                        : 'bg-card border-border text-foreground hover:border-muted-foreground/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base font-medium">{c.name}</span>
                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </DialogContent>
        </Dialog>

        {/* Language Selection Modal - solid background and high z-index to avoid transparency/overlap */}
        <Dialog open={isLanguageModalOpen} onOpenChange={setIsLanguageModalOpen}>
          <DialogContent className="max-w-[480px] z-[60] !bg-white shadow-xl border border-gray-200 rounded-2xl p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
                {t('settings.language')}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-2 pt-4">
              <button
                onClick={() => handleLanguageChange('en')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  i18n.language === 'en'
                    ? 'border-[#29978C] bg-[rgba(41,151,140,0.1)]'
                    : 'border-[var(--tally-border)] hover:bg-[var(--tally-surface-2)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-[var(--tally-text)]">
                    {t('settings.english')}
                  </span>
                  {i18n.language === 'en' && (
                    <span className="text-[#29978C] text-sm font-semibold">✓</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleLanguageChange('bm')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  i18n.language === 'bm'
                    ? 'border-[#29978C] bg-[rgba(41,151,140,0.1)]'
                    : 'border-[var(--tally-border)] hover:bg-[var(--tally-surface-2)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-[var(--tally-text)]">
                    {t('settings.bahasaMalaysia')}
                  </span>
                  {i18n.language === 'bm' && (
                    <span className="text-[#29978C] text-sm font-semibold">✓</span>
                  )}
                </div>
              </button>
              <button
                onClick={() => handleLanguageChange('krio')}
                className={`w-full p-4 rounded-lg border-2 text-left transition-colors ${
                  i18n.language === 'krio'
                    ? 'border-[#29978C] bg-[rgba(41,151,140,0.1)]'
                    : 'border-[var(--tally-border)] hover:bg-[var(--tally-surface-2)]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium text-[var(--tally-text)]">
                    {t('settings.krio')}
                  </span>
                  {i18n.language === 'krio' && (
                    <span className="text-[#29978C] text-sm font-semibold">✓</span>
                  )}
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </AppShell>
  </>
  )
}
