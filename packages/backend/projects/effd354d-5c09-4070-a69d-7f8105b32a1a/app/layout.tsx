import type { Metadata } from 'next'
  import { Inter } from 'next/font/google'
  import './globals.css'
  import Navbar from '@/components/Navbar'
  import { AuthProvider } from '@/lib/auth/AuthContext'

  const inter = Inter({ subsets: ['latin'] })

  export const metadata: Metadata = {
    title: 'EduLearn - Transform Your Career',
    description: 'Master in-demand skills with expert-led online courses.',
  }

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body className={inter.className}>
          <AuthProvider>
            <div className="min-h-screen bg-gray-50">
              <Navbar />
              <main>
                {children}
              </main>
            </div>
          </AuthProvider>
        </body>
      </html>
    )
  }