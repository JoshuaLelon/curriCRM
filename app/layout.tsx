import type { Metadata } from 'next'
import { SupabaseProvider } from '@/components/providers/supabase-provider'
import AuthHeader from '@/components/auth-header'
import './globals.css'

export const metadata: Metadata = {
  title: 'v0 App',
  description: 'Created with v0',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <AuthHeader />
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}
