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
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { AppShell } from '@/components/AppShell'
import { Globe, Download, MessageCircle, FileText, LogOut, Upload, Camera, X, Building2, User as UserIcon, MapPin, Tag, HelpCircle, Shield, Mail, Play, Smartphone } from 'lucide-react'
import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import { getBusinessProfile, saveBusinessProfile, BusinessProfile } from '@/lib/businessProfile'
import { canInstall, isIOS, isStandalone, promptInstall } from '@/lib/pwa'
import { isGuestMode } from '@/lib/guest-storage'
import { useIntroContext } from '@/contexts/IntroContext'

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

  const handleLanguageChange = (lang: 'bm' | 'en' | 'krio') => {
    setIsLanguageModalOpen(false) // Close modal first
    try {
      i18n.changeLanguage(lang).then(() => {
        localStorage.setItem('tally-language', lang)
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

    const activeTransactions = transactions?.filter(t => !t.deleted_at) || transactions || []
    
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
      t(`paymentTypes.${transaction.payment_type}`) || transaction.payment_type,
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

  const getCurrencyFromCountry = (country: string) => {
    if (country.toLowerCase().includes('malaysia')) return 'MYR (RM)'
    return 'MYR (RM)' // Default
  }

  return (
    <>
    <AppShell title={t('account.title')} showBack showLogo>
      <div className="max-w-[480px] mx-auto px-6 py-6 space-y-6">

        {/* Business Profile Card - Top Section */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--tally-text)]">{t('account.businessProfile')}</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const loadedProfile = getBusinessProfile()
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
                className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)]"
              >
                {t('account.editProfile')}
              </Button>
            </div>
            
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                {profile?.logoDataUrl ? (
                  <div className="relative">
                    <img
                      src={profile.logoDataUrl}
                      alt="Business logo"
                      className="w-20 h-20 rounded-full object-cover border-2 border-[var(--tally-border)]"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-full bg-[rgba(41,151,140,0.12)] border-2 border-[var(--tally-border)] flex items-center justify-center">
                    <Building2 className="w-10 h-10 text-[#29978C]" />
                  </div>
                )}
              </div>

              {/* Business Name and Owner Name */}
              <div className="text-center">
                <p className="text-base font-medium text-[var(--tally-text)] mb-1">
                  {profile?.businessName || (
                    <span className="text-[var(--tally-text-muted)] italic">{t('account.addBusinessName')}</span>
                  )}
                </p>
                <p className="text-sm text-[var(--tally-text-muted)]">
                  {profile?.ownerName || (
                    <span className="italic">{t('account.addYourName')}</span>
                  )}
                </p>
                {guestMode && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    {t('guest.mode')}
                  </p>
                )}
              </div>

              {/* Category */}
              {profile?.businessCategory && (
                <div className="flex items-center justify-center gap-2">
                  <Tag className="w-4 h-4 text-[var(--tally-text-muted)]" />
                  <p className="text-sm text-[var(--tally-text-muted)]">{profile.businessCategory}</p>
                </div>
              )}

              {/* Location */}
              {(profile?.country || profile?.stateOrRegion || profile?.area) && (
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="w-4 h-4 text-[var(--tally-text-muted)]" />
                  <p className="text-sm text-[var(--tally-text-muted)]">
                    {[profile.area, profile.stateOrRegion, profile.country].filter(Boolean).join(', ')}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--tally-text)] mb-4">{t('account.preferences')}</h2>
            
            <div className="space-y-4">
              {/* Country */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <Globe className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.country')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {profile?.country || t('account.notSet')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('settings.language')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {getCurrentLanguageName()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsLanguageModalOpen(true)}
                  className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)]"
                >
                  {t('account.change')}
                </Button>
              </div>

              {/* Currency */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <span className="text-xs font-semibold text-[#29978C]">RM</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.currency')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {getCurrencyFromCountry(profile?.country || 'Malaysia')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Install Tally Section - Only show if not already installed */}
        {!pwaState.isStandalone && (
          <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('pwa.install.title')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">
                      {pwaState.canInstall
                        ? t('pwa.install.subtitle.canInstall')
                        : pwaState.isIOS
                        ? t('pwa.install.subtitle.ios')
                        : 'Not available yet'}
                    </p>
                  </div>
                </div>
                {pwaState.canInstall && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      const installed = await promptInstall()
                      if (installed) {
                        toast.success(t('pwa.install.success'))
                        setPwaState({
                          canInstall: false,
                          isIOS: pwaState.isIOS,
                          isStandalone: true,
                        })
                      } else {
                        toast.error(t('pwa.install.cancelled'))
                      }
                    }}
                    className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)] flex-shrink-0 ml-3"
                  >
                    {t('pwa.install.button')}
                  </Button>
                )}
                {pwaState.isIOS && !pwaState.canInstall && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsIOSModalOpen(true)}
                    className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)] flex-shrink-0 ml-3"
                  >
                    {t('pwa.install.how')}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Data and Export Section */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                  <Download className="w-5 h-5 text-[#29978C]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--tally-text)]">{t('settings.exportCSV')}</p>
                  <p className="text-xs text-[var(--tally-text-muted)]">{t('settings.exportCSVDesc')}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportCSV}
                className="text-[#29978C] border-[#29978C] hover:bg-[rgba(41,151,140,0.1)]"
              >
                {t('account.export')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support Section */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--tally-text)] mb-4">{t('account.support')}</h2>
            <div className="space-y-3">
              <Link href="/help" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <HelpCircle className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.about')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">{t('account.aboutDesc')}</p>
                  </div>
                </div>
              </Link>
              <Link href="/privacy" className="block">
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.privacy')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">{t('account.privacyDesc')}</p>
                  </div>
                </div>
              </Link>
              <a
                href="https://wa.me/60123456789?text=Halo%2C%20saya%20perlu%20bantuan%20dengan%20TALLY"
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <Mail className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.contact')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">{t('account.contactDesc')}</p>
                  </div>
                </div>
              </a>
              <button
                onClick={openIntro}
                className="block w-full"
              >
                <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-[var(--tally-surface-2)] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-[rgba(41,151,140,0.12)] flex items-center justify-center">
                    <Play className="w-5 h-5 text-[#29978C]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--tally-text)]">{t('account.showIntro')}</p>
                    <p className="text-xs text-[var(--tally-text-muted)]">{t('account.showIntroDesc')}</p>
                  </div>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>

        {/* Legal Section */}
        <Card className="bg-[var(--tally-surface)] border border-[var(--tally-border)] shadow-sm">
          <CardContent className="p-6">
            <h2 className="text-lg font-semibold text-[var(--tally-text)] mb-4">{t('settings.legal')}</h2>
            <div className="space-y-2">
              <Link href="/privacy">
                <Button variant="outline" className="w-full justify-start">
                  {t('settings.privacy')}
                </Button>
              </Link>
              <Link href="/terms">
                <Button variant="outline" className="w-full justify-start">
                  {t('settings.terms')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Version */}
        <div className="text-center text-xs text-[var(--tally-text-muted)]">
          {t('settings.version')} 0.1.0
        </div>

        {/* Logout */}
        <Button
          variant="outline"
          className="w-full border-[#B94A3A] text-[#B94A3A] hover:bg-[rgba(185,74,58,0.1)]"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {t('settings.logout')}
        </Button>

        {/* Edit Business Profile Modal */}
        <Dialog open={isProfileEditOpen} onOpenChange={setIsProfileEditOpen}>
          <DialogContent className="max-w-[480px] max-h-[90vh] overflow-y-auto bg-[var(--tally-bg)]">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-[var(--tally-text)]">
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
              <div className="flex gap-3 pt-4 border-t border-[var(--tally-border)]">
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
                  {t('account.cancel')}
                </Button>
                <Button
                  onClick={handleSaveProfile}
                  className="flex-1 bg-[#29978C] hover:bg-[#238579] text-white"
                >
                  {t('account.saveProfile')}
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

        {/* Language Selection Modal */}
        <Dialog open={isLanguageModalOpen} onOpenChange={setIsLanguageModalOpen}>
          <DialogContent className="max-w-[480px] bg-[var(--tally-bg)]">
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
