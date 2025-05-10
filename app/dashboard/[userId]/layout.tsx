// app/dashboard/[userId]/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { DashboardSidebar } from './_components/sidebar';
import Navbar from './_components/Navbar';

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
  
  return (
      <div className="min-h-screen bg-gray-50">
        <DashboardSidebar user={session.user} />
        <main className="lg:pl-64 pb-16">
            <Navbar user={session.user} />
          <div className="max-w-7xl mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
  );
}