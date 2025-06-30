// app/admin/AdminNavLink.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CreditCard, Users } from 'lucide-react';

interface AdminNavLinkProps {
  href: string;
  icon: 'subscription' | 'users' ;
  children: React.ReactNode;
}

const iconMap = {
  subscription: CreditCard,
  users: Users,
};

export default function AdminNavLink({ href, icon, children }: AdminNavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === href;
  const Icon = iconMap[icon];

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex items-center border-b-2 px-3 py-4 text-sm font-medium transition-all duration-200",
        "hover:bg-muted/50 rounded-t-md",
        isActive
          ? "border-primary text-primary bg-primary/5"
          : "border-transparent text-muted-foreground hover:border-primary/50 hover:text-foreground"
      )}
    >
      <Icon 
        className={cn(
          "mr-3 h-4 w-4 transition-opacity duration-200",
          isActive ? "opacity-100" : "opacity-70 group-hover:opacity-100"
        )} 
      />
      <span className="whitespace-nowrap">{children}</span>
      {isActive && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-sm" />
      )}
    </Link>
  );
}
