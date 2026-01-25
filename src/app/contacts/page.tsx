'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useBusiness } from '@/contexts/BusinessContext'
import { supabase } from '@/lib/supabase/supabaseClient'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { PlusCircle, User, Phone } from 'lucide-react'
import { AppShell } from '@/components/AppShell'
import { toast } from 'sonner'

export default function ContactsPage() {
  const { currentBusiness } = useBusiness()
  const queryClient = useQueryClient()
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [newContact, setNewContact] = useState({ name: '', phone: '' })
  
  const { data: contacts, isLoading } = useQuery({
    queryKey: ['contacts', currentBusiness?.id],
    queryFn: async () => {
      if (!currentBusiness?.id) return []
      
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('business_id', currentBusiness.id)
        .order('name')
      
      if (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
          console.log('Contacts table does not exist yet')
          return []
        }
        throw error
      }
      return data || []
    },
    enabled: !!currentBusiness?.id
  })
  
  const addContactMutation = useMutation({
    mutationFn: async (contact: { name: string; phone: string }) => {
      if (!currentBusiness?.id) {
        throw new Error('Tiada perniagaan dipilih')
      }
      
      const { error } = await supabase
        .from('contacts')
        .insert({
          business_id: currentBusiness.id,
          name: contact.name,
          phone: contact.phone,
          contact_type: 'customer',
          balance: 0
        })
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] })
      toast.success('Kenalan ditambah')
      setNewContact({ name: '', phone: '' })
      setIsAddOpen(false)
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambah kenalan')
    }
  })
  
  return (
    <AppShell title="Contacts" showBack showLogo>
      <div className="max-w-md mx-auto px-6 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Kenalan</h1>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-cta-primary hover:bg-cta-hover text-cta-text">
                <PlusCircle className="w-4 h-4 mr-2" />
                Tambah
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tambah Kenalan Baru</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">Nama</label>
                  <Input
                    value={newContact.name}
                    onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                    placeholder="Nama pelanggan"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block text-gray-700">No. Telefon</label>
                  <Input
                    value={newContact.phone}
                    onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                    placeholder="019-1234567"
                  />
                </div>
                <Button
                  className="w-full bg-cta-primary hover:bg-cta-hover text-cta-text"
                  onClick={() => addContactMutation.mutate(newContact)}
                  disabled={!newContact.name || addContactMutation.isPending}
                >
                  {addContactMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {isLoading && <p className="text-center text-gray-500">Memuatkan...</p>}
        
        {contacts && contacts.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <User className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p>Belum ada kenalan</p>
            <p className="text-sm mt-2">Jadual &quot;contacts&quot; perlu dicipta dalam Supabase terlebih dahulu</p>
          </div>
        )}
        
        <div className="space-y-3">
          {contacts?.map((contact: { id: string; name: string; phone?: string; balance?: number }) => (
            <Card key={contact.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-money-in-bg rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-money-in" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{contact.name}</p>
                      {contact.phone && (
                        <p className="text-sm text-gray-600 flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contact.phone}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    {contact.balance !== undefined && contact.balance !== null && (
                      <>
                        <p className={`font-semibold ${
                          contact.balance > 0 ? 'text-money-out' : contact.balance < 0 ? 'text-money-in' : 'text-text-muted'
                        }`}>
                          {formatCurrency(Math.abs(contact.balance))}
                        </p>
                        {contact.balance > 0 && (
                          <p className="text-xs text-money-out">Berhutang</p>
                        )}
                        {contact.balance < 0 && (
                          <p className="text-xs text-money-in">Kredit</p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
