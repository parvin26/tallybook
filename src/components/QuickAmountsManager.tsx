'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, ChevronRight } from 'lucide-react'
import { useQuickAmounts } from '@/hooks/useQuickAmounts'

const MAX_PRESETS = 5
type PresetType = 'sale' | 'expense' | 'inventory'

interface QuickAmountsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickAmountsManager({ open, onOpenChange }: QuickAmountsManagerProps) {
  const { t } = useTranslation()
  const {
    salePresets,
    expensePresets,
    inventoryPresets,
    saveSalePresets,
    saveExpensePresets,
    saveInventoryPresets,
  } = useQuickAmounts()

  const [activeTab, setActiveTab] = useState<PresetType>('sale')
  const [editValue, setEditValue] = useState<number | null>(null)
  const [editIndex, setEditIndex] = useState<number>(-1)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addInput, setAddInput] = useState('')
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editInput, setEditInput] = useState('')

  const presets = activeTab === 'sale' ? salePresets : activeTab === 'expense' ? expensePresets : inventoryPresets
  const save = activeTab === 'sale' ? saveSalePresets : activeTab === 'expense' ? saveExpensePresets : saveInventoryPresets
  const typeLabel =
    activeTab === 'sale'
      ? t('settings.saleButtons')
      : activeTab === 'expense'
        ? t('settings.expenseButtons')
        : t('settings.inventoryButtons')

  const openEdit = (value: number, index: number) => {
    setEditValue(value)
    setEditIndex(index)
    setEditInput(String(value))
    setEditDialogOpen(true)
  }

  const handleEditSave = () => {
    const num = parseFloat(editInput.replace(/,/g, ''))
    if (!Number.isFinite(num) || num < 0) return
    const next = [...presets]
    if (editIndex >= 0 && editIndex < next.length) {
      next[editIndex] = num
      save(next.sort((a, b) => a - b))
    }
    setEditDialogOpen(false)
    setEditValue(null)
    setEditIndex(-1)
  }

  const handleEditDelete = () => {
    const next = presets.filter((_, i) => i !== editIndex)
    save(next)
    setEditDialogOpen(false)
    setEditValue(null)
    setEditIndex(-1)
  }

  const openAdd = () => {
    setAddInput('')
    setAddDialogOpen(true)
  }

  const handleAddSave = () => {
    const num = parseFloat(addInput.replace(/,/g, ''))
    if (!Number.isFinite(num) || num < 0) return
    if (presets.length >= MAX_PRESETS) return
    if (presets.includes(num)) {
      setAddDialogOpen(false)
      return
    }
    save([...presets, num].sort((a, b) => a - b))
    setAddDialogOpen(false)
  }

  const tabs: { key: PresetType; label: string }[] = [
    { key: 'sale', label: t('report.snapshot.sales') || 'Sales' },
    { key: 'expense', label: t('report.snapshot.expenses') || 'Expenses' },
    { key: 'inventory', label: t('settings.inventoryButtons') || 'Inventory' },
  ]

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[420px] max-h-[90vh] overflow-hidden flex flex-col bg-background">
          <DialogHeader>
            <DialogTitle>{t('settings.quickAmounts')}</DialogTitle>
          </DialogHeader>
          {/* Segmented control */}
          <div className="flex rounded-lg border border-gray-200 p-0.5 bg-gray-50">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`flex-1 py-2 px-3 text-sm font-medium rounded-md transition-colors ${
                  activeTab === key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">{typeLabel}</p>
          <div className="flex-1 min-h-0 overflow-y-auto">
            {presets.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-medium text-foreground">{t('settings.quickAmountsEmpty', { defaultValue: 'No quick amounts yet.' })}</p>
                <p className="text-sm text-muted-foreground mt-1">{t('settings.quickAmountsEmptyHelper', { defaultValue: 'Add up to 5 shortcuts you use most often.' })}</p>
                <Button type="button" variant="outline" className="mt-4" onClick={openAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t('settings.addPreset')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {presets.map((val, idx) => (
                  <button
                    key={`${val}-${idx}`}
                    type="button"
                    onClick={() => openEdit(val, idx)}
                    className="inline-flex items-center justify-center min-w-[56px] px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-sm font-medium text-gray-900"
                  >
                    {val}
                  </button>
                ))}
                {presets.length < MAX_PRESETS && (
                  <button
                    type="button"
                    onClick={openAdd}
                    className="inline-flex items-center justify-center min-w-[56px] px-3 py-2 rounded-lg border border-dashed border-gray-300 text-gray-500 hover:bg-gray-50 text-sm font-medium"
                    aria-label={t('settings.addPreset', { defaultValue: 'Add' })}
                  >
                    <Plus className="w-4 h-4" />
                    <span className="ml-1">{t('settings.addPreset', { defaultValue: '+ Add' })}</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add quick amount dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle>{t('settings.addQuickAmountTitle', { defaultValue: 'Add quick amount' })}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            placeholder="0"
            className="mb-4"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleAddSave} disabled={!addInput.trim() || !Number.isFinite(parseFloat(addInput.replace(/,/g, ''))) || parseFloat(addInput.replace(/,/g, '')) < 0}>
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit quick amount dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-[360px]">
          <DialogHeader>
            <DialogTitle>{t('settings.editQuickAmountTitle', { defaultValue: 'Edit quick amount' })}</DialogTitle>
          </DialogHeader>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            value={editInput}
            onChange={(e) => setEditInput(e.target.value)}
            placeholder="0"
            className="mb-4"
          />
          <div className="flex gap-2 justify-end">
            <Button variant="outline" className="border-red-600 text-red-600 hover:bg-red-50" onClick={handleEditDelete}>
              {t('common.delete')}
            </Button>
            <Button onClick={handleEditSave} disabled={!editInput.trim() || !Number.isFinite(parseFloat(editInput.replace(/,/g, ''))) || parseFloat(editInput.replace(/,/g, '')) < 0}>
              {t('common.save')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
