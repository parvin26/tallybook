'use client'

import { AppShell } from '@/components/AppShell'

export default function TermsPage() {

  return (
    <AppShell title="Terms" showBack showLogo>
      <div className="max-w-2xl mx-auto px-6 py-6">
        <div className="bg-tally-surface rounded-[var(--tally-radius)] p-8 shadow-[var(--tally-shadow)]">
          <h1 className="text-2xl font-semibold text-tally-text mb-6">Terma & Syarat</h1>
          
          <div className="prose prose-sm max-w-none space-y-4 text-gray-700">
            <section>
              <h2 className="text-lg font-semibold mb-2">1. Penerimaan Terma</h2>
              <p>
                Dengan menggunakan TALLY, anda bersetuju untuk mematuhi terma dan syarat ini.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">2. Penggunaan Perkhidmatan</h2>
              <p>
                TALLY adalah alat rekod kewangan untuk perniagaan kecil. Anda bertanggungjawab untuk:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Menyediakan maklumat yang tepat dan terkini</li>
                <li>Menyimpan kata laluan dan akses anda dengan selamat</li>
                <li>Menggunakan perkhidmatan mengikut undang-undang yang berkuat kuasa</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">3. Data dan Privasi</h2>
              <p>
                Data anda adalah milik anda. Kami tidak akan mengakses atau menggunakan data anda 
                tanpa kebenaran anda, kecuali seperti yang dinyatakan dalam Polisi Privasi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">4. Batasan Tanggungjawab</h2>
              <p>
                TALLY disediakan &quot;sebagaimana adanya&quot;. Kami tidak menjamin ketepatan mutlak data 
                atau ketersediaan perkhidmatan tanpa gangguan. Anda bertanggungjawab untuk 
                menyimpan salinan data anda sendiri.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">5. Perubahan Terma</h2>
              <p>
                Kami berhak untuk mengubah terma ini pada bila-bila masa. Perubahan akan 
                dimaklumkan melalui aplikasi.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold mb-2">6. Penamatan</h2>
              <p>
                Anda boleh berhenti menggunakan TALLY pada bila-bila masa. Anda boleh memadam 
                akaun dan data anda melalui Tetapan.
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
