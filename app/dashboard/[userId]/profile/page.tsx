import { Metadata } from "next";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ProfileContent } from "./_components/ProfileContent";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "User Profile",
  description: "View your profile information",
};

// Loading skeleton for the profile page
function ProfileSkeleton() {
  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-8">
        <div className="flex flex-col items-center sm:flex-row sm:items-start">
          <Skeleton className="h-28 w-28 rounded-full" />
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left">
            <Skeleton className="h-8 w-40 bg-blue-400" />
            <Skeleton className="h-4 w-24 mt-2 bg-blue-400" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-4">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}

export default async function ProfilePage({ params }: { params: { userId: string } }) {
  // Check authentication
  const session = await auth();
 
  if (!session?.user) {
    redirect("/sign-in");
  }
 
  // Fetch the user data to display on profile
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      emailVerified: true,
      accounts: {
        select: {
          provider: true
        }
      },
      workspaces: {
        select: {
          id: true,
          name: true,
          _count: {
            select: { boards: true }
          }
        },
        orderBy: {
          updatedAt: 'desc'
        },
        take: 5 // Limit to 5 most recent workspaces
      }
    }
  });
 
  if (!user) {
    notFound();
  }
 
  // Determine if the current user can view this profile (themselves or admin)
  const canViewFullProfile =
    session.user.id === params.userId ||
    session.user.role === "ADMIN";
 
  // Get provider information
  const provider = user.accounts.length > 0
    ? user.accounts[0].provider
    : "credentials";
 
  // Format the user data for the profile component
  const profileData = {
    ...user,
    provider
  };
 
  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">User Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          {canViewFullProfile
            ? "Your personal profile information"
            : `Viewing profile for ${user.name || "User"}`}
        </p>
      </div>
     
      <Suspense fallback={<ProfileSkeleton />}>
        <ProfileContent
          user={profileData}
          canViewFullProfile={canViewFullProfile}
        />
      </Suspense>

      {canViewFullProfile && (
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Need to update your profile information?{' '}
            <a 
              href={`/dashboard/${user.id}/settings`} 
              className="text-indigo-600 hover:text-indigo-500"
            >
              Go to settings
            </a>
          </p>
        </div>
      )}
    </div>
  );
}