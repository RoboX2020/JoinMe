import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import Header from './components/Header'
import BottomNav from './components/BottomNav'
import NotificationManager from './components/NotificationManager'
import InstallPrompt from './components/InstallPrompt'
import PWARegister from './components/PWARegister'
import PostComposer from './components/PostComposer' // We'll update this to be FAB

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'JoinMe',
  description: 'The cool way to connect.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'JoinMe',
  },
  applicationName: 'JoinMe',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="flex justify-center min-h-screen relative bg-background text-foreground">
            <main className="w-full max-w-md lg:max-w-5xl xl:max-w-6xl min-h-screen pb-32 relative shadow-2xl bg-background overflow-hidden">
              <Header />
              <NotificationManager />
              <InstallPrompt />
              <PWARegister />
              <div className="p-4 pt-20">
                {children}
              </div>

              {/* Floating Elements */}
              <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md lg:max-w-5xl xl:max-w-6xl px-6 z-50 flex items-end justify-between pointer-events-none">
                <BottomNav />
                {/* Composer FAB will be injected here or inside BottomNav? Let's keep it separate for now or part of nav */}
              </div>
            </main>
          </div>
        </Providers>
      </body>
    </html>
  )
}
