import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';
import { AuthProvider } from '@/contexts/AuthContext';
import { BusinessProvider } from '@/contexts/BusinessContext';
import { AuthGuard } from '@/components/AuthGuard';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'TALLY',
  description: 'Buku akaun digital untuk perniagaan kecil',
  manifest: '/manifest.json',
  themeColor: '#10b981',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TALLY',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <AuthProvider>
            <BusinessProvider>
              <AuthGuard>
                {children}
                <Toaster position="top-center" />
              </AuthGuard>
            </BusinessProvider>
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

