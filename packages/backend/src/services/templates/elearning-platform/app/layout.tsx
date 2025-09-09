import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EduPlatform - Learn Anything, Anytime',
  description: 'A comprehensive online learning platform with courses, quizzes, and progress tracking',
  keywords: 'education, online learning, courses, e-learning, LMS',
  authors: [{ name: 'EduPlatform Team' }],
  creator: 'SwiStack',
  publisher: 'EduPlatform',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'http://localhost:{{PORT}}',
    title: 'EduPlatform - Learn Anything, Anytime',
    description: 'A comprehensive online learning platform with courses, quizzes, and progress tracking',
    siteName: 'EduPlatform',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduPlatform - Learn Anything, Anytime',
    description: 'A comprehensive online learning platform with courses, quizzes, and progress tracking',
    creator: '@eduplatform',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}