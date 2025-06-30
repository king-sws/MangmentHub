// app/(marketing)/layout.tsx
import React from 'react'
import Navbar from './_components/Navbar'
import Footer from './_components/Footer'
import { MarketingThemeProvider } from '@/components/marketing-theme-provider'

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