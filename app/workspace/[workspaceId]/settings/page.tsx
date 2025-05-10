// app/workspace/[workspaceId]/settings/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ChevronLeft, 
  Settings, 
  Briefcase, 
  AlertTriangle, 
  Shield,
  Upload,
  Users,
  Bell
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { RenameWorkspaceForm } from "../_components/RenameWorkspaceForm";
import { DeleteWorkspaceButton } from "../_components/DeleteWorkspaceButton";
import { WorkspaceAvatar } from "@/components/WorkspaceAvatar";

interface WorkspaceSettingsPageProps {
  params: {
    workspaceId: string;
  };
}

export default async function WorkspaceSettingsPage({ params }: WorkspaceSettingsPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  // Check if the workspace exists
  const workspace = await prisma.workspace.findUnique({
    where: { id: params.workspaceId },
    include: {
      _count: {
        select: {
          members: true,
          boards: true,
        }
      }
    }
  });

  if (!workspace) {
    return notFound();
  }

  // Check if user is the owner
  const isOwner = workspace.userId === userId;
 
  // If not owner, check if user is an admin member
  if (!isOwner) {
    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: userId,
        workspaceId: params.workspaceId,
        role: "OWNER", // Only owners can view settings
      },
    });
   
    // If not an owner, return not found
    if (!membership) {
      return notFound();
    }
  }

  // Get creation date formatted
  const createdAt = new Date(workspace.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb and Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button variant="ghost" size="sm" asChild className="mr-2">
              <Link href={`/workspace/${params.workspaceId}`}>
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Link>
            </Button>
            <Separator orientation="vertical" className="h-6 mx-2" />
            <div className="flex items-center">
              <WorkspaceAvatar name={workspace.name} className="h-8 w-8 mr-3" />
              <div>
                <h1 className="text-2xl font-bold flex items-center">
                  {workspace.name}
                  <Separator orientation="vertical" className="h-5 mx-3" />
                  <span className="text-lg font-medium text-muted-foreground">Settings</span>
                </h1>
                <p className="text-sm text-muted-foreground">
                  Created {createdAt} • {workspace._count.members} member{workspace._count.members !== 1 ? 's' : ''} • {workspace._count.boards} board{workspace._count.boards !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="space-y-6">
          <div className="bg-background sticky top-0 z-10 pb-4">
            <TabsList className="grid grid-cols-4 w-full max-w-2xl">
              <TabsTrigger value="general" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger value="members" className="flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center">
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger value="danger" className="flex items-center text-destructive">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Danger Zone
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Briefcase className="h-5 w-5 mr-2 text-primary" />
                  Workspace Information
                </CardTitle>
                <CardDescription>
                  Update your workspace details and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RenameWorkspaceForm
                  workspaceId={params.workspaceId}
                  initialName={workspace.name}
                />

                <Separator />

                <div>
                  <h3 className="text-md font-medium mb-2">Workspace Avatar</h3>
                  <div className="flex items-center">
                    <WorkspaceAvatar name={workspace.name} className="h-16 w-16 mr-4" />
                    <Button variant="outline" size="sm" className="flex items-center">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Recommended: Square image, at least 256x256px
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-primary" />
                  Workspace Visibility & Security
                </CardTitle>
                <CardDescription>
                  Manage who can access this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Workspace ID</h3>
                      <div className="flex items-center bg-muted p-2 rounded-md">
                        <code className="text-xs text-muted-foreground flex-1 break-all">
                          {params.workspaceId}
                        </code>
                        <Button variant="ghost" size="sm">
                          Copy
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-sm font-medium">Created</h3>
                      <p className="text-sm text-muted-foreground">{createdAt}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab (Placeholder) */}
          <TabsContent value="members">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-primary" />
                  Workspace Members
                </CardTitle>
                <CardDescription>
                  Manage members and permissions in this workspace
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Current members: <span className="font-medium">{workspace._count.members}</span>
                  </p>
                  <Button size="sm" asChild>
                    <Link href={`/workspace/${params.workspaceId}/members`}>
                      Manage Members
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab (Placeholder) */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2 text-primary" />
                  Notification Settings
                </CardTitle>
                <CardDescription>
                  Configure how and when you receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Notification settings will be available in a future update.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card className="border-destructive/20">
              <CardHeader className="text-destructive">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2" />
                  Danger Zone
                </CardTitle>
                <CardDescription className="text-destructive/80">
                  Destructive actions that cannot be undone
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="p-4 border border-destructive/20 rounded-md bg-destructive/5">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-destructive mb-1">Delete Workspace</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                          Permanently delete this workspace and all its data. This action cannot be undone.
                          All boards, members, and associated data will be permanently removed.
                        </p>
                      </div>
                      <DeleteWorkspaceButton workspaceId={params.workspaceId} />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}