// app/dashboard/[userId]/client-wrapper.tsx
'use client';

import { useState } from 'react';

import { User } from '@prisma/client';
import { DashboardSidebar } from './sidebar';
import Navbar from './Navbar';

export default function ClientWrapper({
  user,
  children,
}: {
  user: User;
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <DashboardSidebar
        user={user} 
        isMobileOpen={isMobileOpen} 
        setIsMobileOpen={setIsMobileOpen} 
      />
      
      <div className="flex-1 flex flex-col">
        <Navbar
          user={user} 
          onToggleSidebar={() => setIsMobileOpen(!isMobileOpen)} 
        />
        
        <main className="flex-1 bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
          <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}