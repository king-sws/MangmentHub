// app/(marketing)/layout.tsx
import React from 'react'
import { Metadata } from 'next'
import Navbar from './_components/Navbar'
import Footer from './_components/Footer'
import { MarketingThemeProvider } from '@/components/marketing-theme-provider'

export const metadata: Metadata = {
  title: {
    default: 'Blutto - Advanced Project Management & Team Collaboration',
    template: '%s | Blutto'
  },
  description: 'Transform your team productivity with Blutto - the all-in-one project management platform. Kanban boards, real-time collaboration, advanced analytics, and seamless integrations. Start free today.',
  keywords: [
    'project management',
    'team collaboration',
    'kanban boards',
    'task management',
    'productivity tools',
    'workflow automation',
    'team workspace',
    'project tracking',
    'agile management',
    'remote collaboration'
  ],
  authors: [{ name: 'Blutto Team' }],
  creator: 'Blutto',
  publisher: 'Blutto',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://blutto.vercel.app'), // Replace with your actual domain
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://blutto.vercel.app', // Replace with your actual domain or URL
    title: 'Blutto - Advanced Project Management & Team Collaboration',
    description: 'Transform your team productivity with Blutto - the all-in-one project management platform. Kanban boards, real-time collaboration, advanced analytics, and seamless integrations.',
    siteName: 'Blutto',
    images: [
      {
        url: '/og-image.png', // Add your Open Graph image
        width: 1200,
        height: 630,
        alt: 'Blutto - Project Management Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Blutto - Advanced Project Management & Team Collaboration',
    description: 'Transform your team productivity with Blutto - the all-in-one project management platform. Start free today.',
    images: ['/twitter-image.png'], // Add your Twitter card image
    creator: '@blutto', // Replace with your Twitter handle
    site: '@blutto', // Replace with your Twitter handle
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'technology',
  classification: 'Business Software',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'Blutto',
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#000000',
    'theme-color': '#000000',
  },
}

const MarketingLayout = ({children}: {children: React.ReactNode}) => {
  return (
    <MarketingThemeProvider>
      <div className="min-h-screen flex flex-col bg-slate-100"> 
        <Navbar />
        <main className="">
          {children}
        </main>
        <Footer />
      </div>
    </MarketingThemeProvider>
  )
}

export default MarketingLayout