import { type Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from '@/components/theme-provider'
// import { SocketProvider } from '@/components/providers/SocketProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})


export const metadata: Metadata = {
  title: 'Blutto – Enterprise Workspace Management Platform',
  description:
    'Blutto is a modern SaaS platform for teams. Manage tasks with Kanban boards and calendar views, collaborate via team chat, track analytics, and control access with role-based permissions — all in one unified workspace.',
  keywords: [
    'Blutto',
    'workspace management',
    'SaaS platform',
    'Kanban boards',
    'task management',
    'team collaboration',
    'calendar integration',
    'enterprise tools',
    'project tracking',
    'team productivity'
  ],
  openGraph: {
    title: 'Blutto – Enterprise Workspace Management Platform',
    description:
      'All-in-one platform for collaborative task management, team chat, and enterprise-grade project tracking. Built for performance, security, and scale.',
    url: 'https://blutto.vercel.app',
    siteName: 'Blutto',

    type: 'website',
  },
};


function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-background text-foreground`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {/* <SocketProvider> */}
              {children}
            {/* </SocketProvider> */}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}