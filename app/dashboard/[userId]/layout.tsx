// app/dashboard/[userId]/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from './_components/sidebar';
import Navbar from './_components/Navbar';
import { prisma } from '@/lib/prisma';
import { DashboardThemeProvider } from '@/components/dashboard-theme-provider';

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
      plan: true, 
      planExpires: true, 
      planStarted: true, 
      planUpdated: true, 
      stripeCustomerId: true, 
      stripeSubscriptionId: true 
    },
  });

  return (
    <DashboardThemeProvider>
      <div className="flex min-h-screen">
        <DashboardSidebar user={session.user} />
        
        <div className="flex-1 flex flex-col">
          <Navbar user={user} />
          
          <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </DashboardThemeProvider>
  );
}