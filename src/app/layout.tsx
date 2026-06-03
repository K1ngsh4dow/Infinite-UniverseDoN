
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { CreationsProvider } from '@/context/CreationsContext';
import { PwaUpdater } from '@/components/pwa-updater';
import { ChatWidgetProvider } from '@/context/ChatWidgetContext';
import { WalletProvider } from '@/context/WalletContext';
import { FamilyProvider } from '@/context/FamilyContext';
import { SparkProvider } from '@/context/SparkContext';

export const metadata: Metadata = {
  title: 'Infinite Universe',
  description: 'A secure, AI-powered "Generative Desktop Environment"',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Infinite Universe',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#F5F5DC' },
    { media: '(prefers-color-scheme: dark)', color: '#09090b' },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <CreationsProvider>
          <WalletProvider>
            <SparkProvider>
              <FamilyProvider>
                <ChatWidgetProvider>
                  {children}
                </ChatWidgetProvider>
              </FamilyProvider>
            </SparkProvider>
          </WalletProvider>
        </CreationsProvider>
        <Toaster />
        <PwaUpdater />
      </body>
    </html>
  );
}
