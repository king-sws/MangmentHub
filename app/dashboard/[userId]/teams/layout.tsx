// app/dashboard/[userId]/chat/layout.tsx
import type { Metadata } from 'next';
import { auth } from '@/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Team Chat | Blutto',
  description: 'Collaborate with your team in real-time using Blutto Chat.',
    keywords: [
        'Blutto',
        'Team Chat',
        'Real-time collaboration',
        'Messaging',
        'Productivity',
        'Team communication',
    ],
};

export default async function ChatLayout({
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

  return <>{children}</>;
}
