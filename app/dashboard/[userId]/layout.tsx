// app/dashboard/[userId]/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardThemeProvider } from '@/components/dashboard-theme-provider';
import ClientWrapper from './_components/client-wrapper';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blutto Dashboard',
  description: 'Manage your projects, tasks, and teams in one powerful dashboard. Powered by Blutto.',
  keywords: ['Blutto', 'dashboard', 'task management', 'project collaboration', 'productivity tool'],
  openGraph: {
    title: 'Blutto Dashboard',
    description: 'The all-in-one dashboard to manage your productivity and collaboration with ease.',
    url: 'https://blutto.verecel.app/',
    siteName: 'Blutto',
    type: 'website',
  },

  icons: {
    icon: '/favicon.ico',
  },
};

export default async function DashboardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { userId: string };
}) {
  const session = await auth();
  
  if (!session?.user || session.user.id !== params.userId) {
    redirect('/sign-in');
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { 
      image: true, 
      name: true, 
      id: true, 
      email: true, // Add email if needed
      plan: true, 
      planExpires: true, 
      planStarted: true, 
      planUpdated: true, 
      stripeCustomerId: true, 
      stripeSubscriptionId: true 
    },
  });

  if (!user) {
    redirect('/sign-in');
  }

  return (
    <DashboardThemeProvider>
      <ClientWrapper user={user}>
        {children}
      </ClientWrapper>
    </DashboardThemeProvider>
  );
}