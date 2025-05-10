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
          <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 md:grid-cols-4 h-auto">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="workspace">Workspace</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
          </TabsList>
          
          <TabsContent value="account" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border dark:bg-gray-800">
              <Suspense fallback={<SettingsSkeleton />}>
                <SettingsForm />
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="workspace" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border dark:bg-gray-800">
              <Suspense fallback={<SettingsSkeleton />}>
                {mainWorkspace ? (
                  <WorkspaceSettings workspaceId={mainWorkspace.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No workspace found. Create a workspace to manage its settings.
                  </div>
                )}
              </Suspense>
            </div>
          </TabsContent>
          
          <TabsContent value="members" className="space-y-6">
            <div className="bg-white p-6 rounded-lg shadow-sm border dark:bg-gray-800">
              <Suspense fallback={<SettingsSkeleton />}>
                {mainWorkspace ? (
                  <MembersList workspaceId={mainWorkspace.id} />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No workspace found. Create a workspace to manage members.
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