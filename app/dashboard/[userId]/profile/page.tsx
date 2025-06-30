import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileContent } from "./_components/ProfileContent";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Profile",
  description: "Manage your profile and account settings",
};

// Professional loading skeleton
function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {/* Profile Header Skeleton */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar skeleton */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-xl animate-pulse" />
            
            {/* User info skeleton */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="h-8 w-48 bg-muted rounded animate-pulse" />
                <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              </div>
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-muted rounded animate-pulse" />
                <div className="h-6 w-16 bg-muted rounded animate-pulse" />
              </div>
            </div>
            
            {/* Button skeleton */}
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
          </div>
        </CardContent>
      </Card>

      {/* Stats skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                <div className="flex-1 space-y-2">
                  <div className="h-8 w-12 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-0 shadow-sm bg-card">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-48 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {[1, 2, 3, 4].map((j) => (
                        <div key={j} className="space-y-2">
                          <div className="h-4 w-20 bg-muted rounded animate-pulse" />
                          <div className="h-5 w-full bg-muted rounded animate-pulse" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="space-y-6">
          <Card className="border-0 shadow-sm bg-card">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-muted rounded-lg animate-pulse" />
                  <div className="space-y-2">
                    <div className="h-6 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="border-t border-border pt-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      plan: true,
      planExpires: true,
      planStarted: true,
      createdAt: true,
      lastLogin: true,
      accounts: {
        select: {
          provider: true
        }
      },
      workspaces: {
        select: {
          id: true,
          name: true,
          createdAt: true,
          _count: {
            select: { 
              boards: true,
              members: true 
            }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 6
      },
      _count: {
        select: {
          workspaces: true,
          assignedCards: true,
          chatMessages: true
        }
      }
    }
  });

  if (!user) {
    notFound();
  }

  const canViewFullProfile = 
    session.user.id === params.userId || 
    session.user.role === "ADMIN";

  const provider = user.accounts.length > 0 
    ? user.accounts[0].provider 
    : "credentials";

  const profileData = {
    ...user,
    provider
  };

  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 md:px-6">
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {canViewFullProfile ? "Profile" : "User Profile"}
          </h1>
          <p className="text-muted-foreground">
            {canViewFullProfile 
              ? "Manage your account settings and view your activity" 
              : `Viewing ${user.name || "User"}'s profile`}
          </p>
        </div>
        
        <Separator />

        {/* Profile Content */}
        <Suspense fallback={<ProfileSkeleton />}>
          <ProfileContent 
            user={profileData} 
            canViewFullProfile={canViewFullProfile} 
          />
        </Suspense>
      </div>
    </div>
  );
}