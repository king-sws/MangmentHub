// app/dashboard/[userId]/calendar/layout.tsx
import type { Metadata } from 'next';


export const metadata: Metadata = {
  title: 'Calendar | Blutto',
  description: 'Plan, schedule, and stay organized with Blutto’s smart calendar view.',
};

export default async function CalendarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  

  return (
    <>
      {children}
    </>
  );
}
