'use client'

import { AppShell } from '@/components/AppShell'

export default function PrivacyPage() {

  return (
    <AppShell title="Privacy Policy" showBack showLogo>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="bg-tally-surface rounded-[var(--tally-radius)] p-8 shadow-[var(--tally-shadow)]">
          <h1 className="text-2xl font-semibold text-tally-text mb-6">Polisi Privasi</h1>
          
          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold mb-2">1. Maklumat yang Kami Kumpulkan</h2>
              <p>
                TALLY mengumpulkan maklumat yang anda berikan secara langsung, termasuk:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nombor telefon untuk log masuk</li>
                <li>Maklumat perniagaan (nama, jenis, lokasi)</li>
                <li>Transaksi kewangan yang anda rekod</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">2. Cara Kami Menggunakan Maklumat</h2>
              <p>
                Kami menggunakan maklumat anda untuk:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Menyediakan perkhidmatan TALLY</li>
                <li>Menyimpan dan memaparkan rekod transaksi anda</li>
                <li>Menghasilkan laporan kewangan</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">3. Keselamatan Data</h2>
              <p>
                Kami menggunakan Supabase untuk menyimpan data anda dengan selamat. 
                Data anda dienkripsi dan hanya boleh diakses oleh anda melalui log masuk.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">4. Perkongsian Data</h2>
              <p>
                Kami tidak berkongsi data anda dengan pihak ketiga tanpa kebenaran anda.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">5. Hak Anda</h2>
              <p>
                Anda boleh:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Mengakses data anda pada bila-bila masa</li>
                <li>Mengemaskini atau memadam data anda</li>
                <li>Mengeksport data anda dalam format CSV</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">6. Hubungi Kami</h2>
              <p>
                Jika anda mempunyai soalan tentang polisi privasi ini, sila hubungi kami melalui WhatsApp 
                atau email yang disediakan dalam Tetapan.
              </p>
            </section>

            <section className="text-sm text-gray-500 pt-4 border-t">
              <p>Dikemaskini: {new Date().toLocaleDateString('ms-MY', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </section>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
