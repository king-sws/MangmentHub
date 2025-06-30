
// app/admin/layout.tsx
import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';
import AdminNavLink from '@/components/admin/AdminNavLink';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Check if user is authenticated
  if (!session?.user) {
    redirect('/sign-in');
  }

  // Get user details including role/admin status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      plan: true,
      planExpires: true,
      planStarted: true,
      planUpdated: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
    },
  });

  // If user not found or not admin, redirect to their dashboard
  if (!user || user.role !== 'ADMIN') {
    redirect(`/dashboard/${session.user.id}`);
  }

  const userInitials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : 'AD';

  return (
    <div className="min-h-screen bg-background">
      {/* Admin Header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Left side - Title and user info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    System Administration
                  </p>
                </div>
              </div>
            </div>

            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.image || undefined} alt={user.name || 'Admin'} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                  <span className="text-sm font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
              </div>
              
              <Badge variant="destructive" className="hidden sm:inline-flex">
                <Shield className="mr-1 h-3 w-3" />
                Admin
              </Badge>
              
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <Link href={`/dashboard/${user.id}`}>
                  <ArrowLeft className="mr-2 h-3 w-3" />
                  Dashboard
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Admin Navigation */}
      <nav className="border-b bg-card">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex overflow-x-auto">
            <div className="flex space-x-1 min-w-max">
              <AdminNavLink href="/admin/subscription" icon="subscription">
                Subscription Management
              </AdminNavLink>
              <AdminNavLink href="/admin/users" icon="users">
                User Management
              </AdminNavLink>
              <AdminNavLink href="/admin/audit-logs" icon="users">
                Audit Logs
              </AdminNavLink>
              <AdminNavLink href="/admin/transactions" icon="subscription">
                Transaction Management
              </AdminNavLink>
              {/* Add more navigation items as needed */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="min-h-[calc(100vh-12rem)]">
          <div className="p-6">
            {children}
          </div>
        </Card>
      </main>
    </div>
  );
}