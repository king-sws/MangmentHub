// app/settings/[userId]/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { getWorkspaces } from "@/actions/workspace";
import { MembersList } from "@/components/MembersList";
import { SettingsForm } from "./_components/SettingsForm";
import { NotificationSettings } from "./_components/NotificationSettings";
import { WorkspaceSettings } from "./_components/WorkspaceSettings";
import { Building2, User, Users, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import WorkspaceSelector from "./_components/WorkspaceSelector";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Manage your account settings and workspace preferences",
};

// Loading skeleton for async components
function SettingsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-4 bg-muted animate-pulse rounded w-32" />
        <div className="h-12 bg-muted animate-pulse rounded" />
      </div>
      <div className="h-48 bg-muted animate-pulse rounded" />
    </div>
  );
}

export default async function SettingsPage({ 
  params,
  searchParams 
}: { 
  params: { userId: string };
  searchParams: { workspace?: string };
}) {
  const session = await auth();
  
  // Authentication check
  if (!session?.user || session.user.id !== params.userId) {
    redirect("/sign-in");
  }
  
  // Get user's workspaces
  const workspaces = await getWorkspaces();
  
  // Determine selected workspace
  const selectedWorkspaceId = searchParams.workspace;
  const selectedWorkspace = selectedWorkspaceId 
    ? workspaces.find(w => w.id === selectedWorkspaceId)
    : workspaces[0]; // Default to first workspace if none specified
  
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
          
          {/* Account Tab */}
          <TabsContent value="account" className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Account Settings</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Manage your personal account information and preferences
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Suspense fallback={<SettingsSkeleton />}>
                  <SettingsForm />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Workspace Tab */}
          <TabsContent value="workspace" className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Workspace Management</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Select and configure your workspace settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Suspense fallback={<SettingsSkeleton />}>
                  {workspaces.length > 0 ? (
                    <div className="space-y-8">
                      {/* Enhanced Workspace Selector */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">
                            Active Workspace
                          </Label>
                          {workspaces.length > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {workspaces.length} workspaces available
                            </Badge>
                          )}
                        </div>
                        <WorkspaceSelector
                          workspaces={workspaces}
                          selectedWorkspaceId={selectedWorkspace?.id}
                          userId={params.userId}
                        />
                      </div>

                      {/* Workspace Settings */}
                      {selectedWorkspace ? (
                        <div className="border-t border-border pt-8">
                          <WorkspaceSettings workspaceId={selectedWorkspace.id} />
                        </div>
                      ) : (
                        <Card className="border-dashed border-2 border-muted-foreground/25">
                          <CardContent className="pt-6">
                            <div className="text-center py-8">
                              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                              <h3 className="font-medium text-lg mb-2">Select a Workspace</h3>
                              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                                Choose a workspace from the dropdown above to view and manage its settings.
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  ) : (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                            <Building2 className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-lg mb-2">No Workspaces Found</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                            You don&lsquo;t have any workspaces yet. Create your first workspace to get started with team collaboration.
                          </p>
                          <Button className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Create Workspace
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Members Tab */}
          <TabsContent value="members" className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Team Members</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Manage workspace members and their permissions
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Suspense fallback={<SettingsSkeleton />}>
                  {workspaces.length > 0 && selectedWorkspace ? (
                    <MembersList workspaceId={selectedWorkspace.id} />
                  ) : workspaces.length > 0 ? (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                      <CardContent className="pt-6">
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <h3 className="font-medium text-lg mb-2">No Active Workspace</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto">
                            Switch to the Workspace tab to select an active workspace first.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-dashed border-2 border-muted-foreground/25">
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <div className="p-4 rounded-full bg-muted mx-auto w-fit mb-4">
                            <Users className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <h3 className="font-medium text-lg mb-2">No Workspaces Found</h3>
                          <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
                            Create a workspace to start managing members and collaborating with your team.
                          </p>
                          <Button className="gap-2">
                            <Building2 className="h-4 w-4" />
                            Create Workspace
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notification Settings</CardTitle>
                    <CardDescription className="text-sm text-muted-foreground mt-1">
                      Configure how and when you receive notifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <Suspense fallback={<SettingsSkeleton />}>
                  <NotificationSettings userId={params.userId} />
                </Suspense>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}