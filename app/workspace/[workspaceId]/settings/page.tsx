// app/workspace/[workspaceId]/settings/page.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound, redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Settings, 
  Briefcase, 
  AlertTriangle, 
  Shield,
  Upload,
  Users,
  Bell,
  Copy
  
} from "lucide-react";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Professional Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-start space-x-4">
              <WorkspaceAvatar name={workspace.name} className="h-12 w-12 flex-shrink-0" />
              <div className="space-y-1">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold tracking-tight">{workspace.name}</h1>
                  <Badge variant="secondary" className="text-xs font-medium">
                    Workspace Settings
                  </Badge>
                </div>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <span>Created {createdAt}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{workspace._count.members} member{workspace._count.members !== 1 ? 's' : ''}</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span>{workspace._count.boards} board{workspace._count.boards !== 1 ? 's' : ''}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Settings Interface */}
        <Tabs defaultValue="general" className="space-y-8">
          <div className="border-b border-border">
            <TabsList className="h-12 p-1 bg-transparent">
              <TabsTrigger 
                value="general" 
                className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Settings className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger 
                value="members" 
                className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Members
              </TabsTrigger>
              <TabsTrigger 
                value="notifications" 
                className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                <Bell className="h-4 w-4 mr-2" />
                Notifications
              </TabsTrigger>
              <TabsTrigger 
                value="danger" 
                className="h-10 px-6 data-[state=active]:bg-background data-[state=active]:shadow-sm text-destructive data-[state=active]:text-destructive"
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Advanced
              </TabsTrigger>
            </TabsList>
          </div>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-8 mt-8">
            {/* Workspace Information Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Workspace Information</CardTitle>
                    <CardDescription className="text-sm">
                      Manage your workspace identity and basic settings
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8">
                <RenameWorkspaceForm
                  workspaceId={params.workspaceId}
                  initialName={workspace.name}
                />

                <Separator />

                <div className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold mb-1">Workspace Avatar</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Upload a custom image to represent your workspace
                    </p>
                  </div>
                  <div className="flex items-center space-x-6">
                    <WorkspaceAvatar name={workspace.name} className="h-20 w-20 border-2 border-border" />
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="h-9">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload New Image
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG up to 2MB. Recommended size: 256×256px
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Workspace Details Card */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Workspace Details</CardTitle>
                    <CardDescription className="text-sm">
                      View workspace metadata and system information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Workspace ID</label>
                      <div className="mt-1 flex items-center space-x-2">
                        <div className="flex-1 p-3 bg-muted/50 rounded-lg border">
                          <code className="text-sm font-mono break-all">
                            {params.workspaceId}
                          </code>
                        </div>
                        <Button variant="outline" size="sm" className="px-3">
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Creation Date</label>
                      <div className="mt-1 p-3 bg-muted/50 rounded-lg border">
                        <span className="text-sm">{createdAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Members Tab */}
          <TabsContent value="members" className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Team Members</CardTitle>
                      <CardDescription className="text-sm">
                        Manage workspace members, roles, and permissions
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-sm">
                    {workspace._count.members} member{workspace._count.members !== 1 ? 's' : ''}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-6 bg-muted/30 rounded-lg border border-dashed">
                  <div className="space-y-1">
                    <p className="font-medium">Member Management</p>
                    <p className="text-sm text-muted-foreground">
                      Add, remove, and manage member permissions
                    </p>
                  </div>
                  <Button asChild>
                    <Link href={`/workspace/${params.workspaceId}/members`}>
                      Manage Members
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Notification Preferences</CardTitle>
                    <CardDescription className="text-sm">
                      Configure how and when you receive workspace notifications
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center p-12 bg-muted/30 rounded-lg border border-dashed">
                  <div className="text-center space-y-3">
                    <div className="p-3 rounded-full bg-muted inline-flex">
                      <Bell className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium">Coming Soon</p>
                      <p className="text-sm text-muted-foreground max-w-sm">
                        Notification settings and preferences will be available in an upcoming update
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced/Danger Zone Tab */}
          <TabsContent value="danger" className="mt-8">
            <Card className="border-destructive/20 shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-2">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <CardTitle className="text-xl text-destructive">Advanced Settings</CardTitle>
                    <CardDescription className="text-destructive/80">
                      Irreversible actions that require careful consideration
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="p-6 border border-destructive/20 rounded-lg bg-destructive/5">
                  <div className="flex items-start justify-between space-x-4">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-destructive">Delete Workspace</h3>
                      <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">
                          Permanently delete this workspace and all associated data.
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This will remove all boards, members, chat history, and files. This action cannot be undone.
                        </p>
                      </div>
                    </div>
                    <DeleteWorkspaceButton workspaceId={params.workspaceId} />
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