// app/settings/[userId]/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { getWorkspaces } from "@/actions/workspace";
import { MembersList } from "@/components/MembersList";
import { SettingsForm } from "./_components/SettingsForm";
import { NotificationSettings } from "./_components/NotificationSettings";
import { WorkspaceSettings } from "./_components/WorkspaceSettings";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings and workspace preferences",
};

// Loading skeleton for async components
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

export default async function SettingsPage({ params }: { params: { userId: string } }) {
  const session = await auth();
  
  // Authentication check
  if (!session?.user || session.user.id !== params.userId) {
    redirect("/sign-in");
  }
  
  // Get user's workspaces
  const workspaces = await getWorkspaces();
  const mainWorkspace = workspaces.find(w => w.name === "Main Workspace") || workspaces[0];
  
  return (
    <div className="container max-w-6xl mx-auto py-6 px-4 md:px-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and workspace preferences.
          </p>
        </div>
        
        <Separator />
        
        <Tabs defaultValue="account" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-0 h-auto">
            <TabsTrigger value="account" className="px-2 sm:px-4 py-2 text-sm">Account</TabsTrigger>
            <TabsTrigger value="workspace" className="px-2 sm:px-4 py-2 text-sm">Workspace</TabsTrigger>
            <TabsTrigger value="members" className="px-2 sm:px-4 py-2 text-sm">Members</TabsTrigger>
            <TabsTrigger value="notifications" className="px-2 sm:px-4 py-2 text-sm">Notifications</TabsTrigger>
          </TabsList>
          
          {/* TabsContent Component with Dark Mode Support */}
          <TabsContent value="account" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Suspense fallback={<SettingsSkeleton />}>
                <SettingsForm />
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="workspace" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-3 sm:p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
              <Suspense fallback={<SettingsSkeleton />}>
                {mainWorkspace ? (
                  <WorkspaceSettings workspaceId={mainWorkspace.id} />
                ) : (
                  <div className="text-center py-6 sm:py-8 text-muted-foreground">
                    No workspace found. Create a workspace to manage its settings.
                  </div>
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent 
            value="members" 
            className="mt-6 space-y-6"
            aria-label="Workspace members tab"
          >
            <div className="
              bg-white 
              dark:bg-gray-800 
              p-4 sm:p-6 
              rounded-lg 
              border 
              border-gray-200 
              dark:border-gray-700 
              shadow-sm 
              transition-all 
              duration-200 
              hover:shadow-md
            ">
              <Suspense fallback={(
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <Skeleton className="h-8 w-48 rounded-lg bg-gray-200 dark:bg-gray-700" />
                    <Skeleton className="h-9 w-32 rounded-lg bg-gray-200 dark:bg-gray-700" />
                  </div>
                  <Skeleton className="h-10 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-lg bg-gray-200 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              )}>
                {mainWorkspace ? (
                  <MembersList workspaceId={mainWorkspace.id} />
                ) : (
                  <div className="
                    text-center 
                    py-12 
                    text-gray-500 
                    dark:text-gray-400 
                    flex 
                    flex-col 
                    items-center 
                    gap-4
                    animate-in 
                    fade-in 
                    duration-300
                  ">
                    <svg
                      className="h-12 w-12 text-gray-400 dark:text-gray-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h-2m-6 0H7m2-2h6"
                      />
                    </svg>
                    <p className="text-base font-medium">
                      No workspace found
                    </p>
                    <p className="text-sm max-w-md">
                      Create a workspace to start managing members and collaborating with your team.
                    </p>
                  </div>
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="notifications" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border dark:bg-gray-800">
              <Suspense fallback={<SettingsSkeleton />}>
                <NotificationSettings userId={params.userId} />
              </Suspense>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}