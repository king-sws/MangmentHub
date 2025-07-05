'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from "next/navigation";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createBoard } from '@/actions/createBoard';
import { getWorkspaces } from '@/actions/getWorkspace';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  Layout, 
  Users, 
  Sparkles, 
  CheckCircle2,
  ArrowRight,
  Plus,
  Grid3X3,
  Briefcase
} from 'lucide-react';
import Link from 'next/link';

interface WorkspaceData {
  id: string;
  name: string;
  _count?: {
    boards?: number;
  };
}

// Loading component for Suspense fallback
function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 mx-auto border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
            <p className="text-muted-foreground">Loading create board page...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateBoardContent() {
  const [title, setTitle] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState<WorkspaceData[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  // Pre-select workspace from URL params if provided
  const preselectedWorkspaceId = searchParams?.get('workspaceId');

  useEffect(() => {
    const fetchWorkspaces = async () => {
      if (!session?.user?.id) return;
      
      try {
        const workspaceList = await getWorkspaces();
        setWorkspaces(workspaceList);
        
        // Auto-select workspace if provided in URL
        if (preselectedWorkspaceId && workspaceList.find(w => w.id === preselectedWorkspaceId)) {
          setSelectedWorkspaceId(preselectedWorkspaceId);
        }
      } catch (error) {
        console.error('Failed to fetch workspaces:', error);
        toast.error('Failed to load workspaces');
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchWorkspaces();
  }, [session?.user?.id, preselectedWorkspaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error('Board title is required');
      return;
    }
    
    if (!selectedWorkspaceId) {
      toast.error('Please select a workspace');
      return;
    }
    
    if (!session?.user?.id) {
      toast.error('You must be signed in to create a board');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const board = await createBoard({
        title: title.trim(),
        workspaceId: selectedWorkspaceId,
      });
      
      toast.success("Your board has been created successfully!");
      
      // Navigate to the new board
      router.push(`/board/${board.id}`);
    } catch (error) {
      console.error('Failed to create board:', error);
      toast.error("Failed to create board. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
        <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-center py-16">
            <div className="text-center space-y-4">
              <div className="w-12 h-12 mx-auto border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              <p className="text-muted-foreground">Loading workspaces...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 dark:from-background dark:via-background dark:to-muted/10">
      <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 md:p-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Button variant="ghost" size="sm" asChild className="group hover:bg-muted/80 transition-colors">
            <Link href="/dashboard" className="flex items-center text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Dashboard
            </Link>
          </Button>
          
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-3 rounded-xl">
                <Layout className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Create New Board</h1>
                <p className="text-muted-foreground text-lg">
                  Set up a new board to organize your tasks and projects
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Selection Info */}
        {selectedWorkspace && (
          <Card className="border-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-white dark:bg-gray-900 p-2 rounded-lg shadow-sm">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    Creating board in: {selectedWorkspace.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedWorkspace._count?.boards ? 
                      `${selectedWorkspace._count.boards} boards in this workspace` : 
                      'No boards yet in this workspace'
                    }
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Main Form */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
              <CardHeader className="space-y-1 pb-6">
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Grid3X3 className="h-6 w-6 text-blue-600" />
                  Board Details
                </CardTitle>
                <CardDescription className="text-base">
                  Provide information about your new board
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-4">
                    {/* Workspace Selection */}
                    <div className="space-y-2">
                      <label htmlFor="workspace" className="block text-sm font-semibold text-foreground">
                        Workspace *
                      </label>
                      <Select
                        value={selectedWorkspaceId}
                        onValueChange={setSelectedWorkspaceId}
                        disabled={isLoading}
                      >
                        <SelectTrigger className="h-12 text-base border-2 focus:border-blue-500 transition-colors">
                          <SelectValue placeholder="Select a workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          {workspaces.map((workspace) => (
                            <SelectItem key={workspace.id} value={workspace.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{workspace.name}</span>
                                {workspace._count?.boards && (
                                  <Badge variant="secondary" className="ml-2">
                                    {workspace._count.boards} boards
                                  </Badge>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Select the workspace where this board will be created
                      </p>
                    </div>

                    {/* Board Title */}
                    <div className="space-y-2">
                      <label htmlFor="title" className="block text-sm font-semibold text-foreground">
                        Board Title *
                      </label>
                      <Input
                        id="title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="My Project Board"
                        disabled={isLoading}
                        autoFocus
                        className="h-12 text-base border-2 focus:border-blue-500 transition-colors"
                        maxLength={100}
                      />
                      <div className="flex justify-between items-center">
                        <p className="text-xs text-muted-foreground">
                          Choose a descriptive name for your board
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {title.length}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      disabled={isLoading}
                      className="flex-1 sm:flex-none h-12 px-8"
                    >
                      Cancel
                    </Button>
                    
                    <Button 
                      type="submit" 
                      disabled={isLoading || !title.trim() || !selectedWorkspaceId}
                      className="flex-1 sm:flex-none h-12 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Creating...
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Create Board
                        </div>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            {/* Features */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Board Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  'Unlimited lists and cards',
                  'Drag and drop organization',
                  'Real-time collaboration',
                  'Activity tracking',
                  'Customizable workflows'
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                    <span className="text-sm text-emerald-800 dark:text-emerald-200">{feature}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Next Steps
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  After creating your board, you can:
                </p>
                <ul className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Add lists to organize tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Create cards for individual tasks
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Invite team members
                  </li>
                  <li className="flex items-center gap-2">
                    <ArrowRight className="h-3 w-3" />
                    Set up automations
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* No workspaces message */}
            {workspaces.length === 0 && (
              <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-amber-600" />
                    No Workspaces Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    You need to create a workspace first before creating boards.
                  </p>
                  <Button asChild className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white">
                    <Link href="/workspace/new">
                      Create Workspace
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CreateBoardPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <CreateBoardContent />
    </Suspense>
  );
}