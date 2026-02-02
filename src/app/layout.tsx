import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { IntroOrApp } from '@/components/IntroOrApp';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tally - Simple Business Tracker',
  description: 'Buku akaun digital untuk perniagaan kecil',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico.png?v=3',
    shortcut: '/favicon.ico.png?v=3',
    apple: '/icon-192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Tally - Simple Business Tracker',
  },
};

export const viewport: Viewport = {
  themeColor: '#10B981',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zooming on inputs for mobile feel
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${inter.className} antialiased`}>
        <Providers>
          <IntroOrApp>
            {children}
          </IntroOrApp>
        </Providers>
      </body>
    </html>
  );
}

