// app/dashboard/[userId]/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { DashboardThemeProvider } from '@/components/dashboard-theme-provider';
import ClientWrapper from './_components/client-wrapper';

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