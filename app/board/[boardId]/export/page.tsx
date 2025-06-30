// app/board/[boardId]/export/page.tsx
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ArrowLeft, Download, FileText, Calendar, Users, BarChart3, CheckCircle, Database, Clock, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ExportClient } from "@/components/ExportClient";

interface ExportPageProps {
  params: { boardId: string };
}

export default async function ExportPage({ params }: ExportPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  const boardId = params.boardId;

  try {
    const board = await prisma.board.findUnique({
      where: { id: boardId },
      include: {
        workspace: {
          select: { id: true, name: true },
        },
        lists: {
          include: {
            cards: {
              include: {
                assignees: {
                  select: { id: true, name: true, email: true },
                },
              },
              orderBy: { order: "asc" },
            },
          },
          orderBy: { order: "asc" },
        },
      },
    });

    if (!board) {
      return notFound();
    }

    // Check if user is authorized to view this board
    const workspace = await prisma.workspace.findUnique({
      where: { id: board.workspaceId },
    });

    const isOwner = workspace?.userId === userId;

    // If not owner, check if user is a workspace member
    if (!isOwner) {
      const membership = await prisma.workspaceMember.findFirst({
        where: {
          userId: userId,
          workspaceId: board.workspaceId,
        },
      });

      if (!membership) {
        return notFound();
      }
    }

    // Calculate statistics
    const totalCards = board.lists.reduce((acc, list) => acc + list.cards.length, 0);
    const completedCards = board.lists.reduce(
      (acc, list) => acc + list.cards.filter(card => card.completed).length,
      0
    );
    const totalLists = board.lists.length;
    const completionRate = totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80">
        {/* Header */}
        <header className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-950/90 sticky top-0 z-50 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Left section - Navigation */}
              <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                <Link 
                  href={`/board/${board.id}`}
                  className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-medium text-sm hidden xs:inline">Back to Board</span>
                  <span className="font-medium text-sm xs:hidden">Back</span>
                </Link>
                
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 hidden sm:block" />
                
                <div className="flex items-center space-x-1.5 text-sm text-slate-500 dark:text-slate-400 min-w-0">
                  <span className="truncate max-w-[100px] sm:max-w-none">{workspace?.name}</span>
                  <span className="shrink-0">/</span>
                  <span className="truncate max-w-[120px] sm:max-w-none">{board.title}</span>
                </div>
              </div>

              {/* Right section - Title */}
              <div className="flex items-center space-x-2">
                <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100">
                  Export Board
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
          <div className="space-y-6 lg:space-y-8">
            {/* Board overview */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  <span>Board Overview</span>
                </CardTitle>
                <CardDescription>
                  Review your board data before exporting
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  <div className="flex items-center space-x-3 p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                    <div className="p-2 sm:p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0">
                      <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Total Lists</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{totalLists}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200/50 dark:border-green-800/30">
                    <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/40 rounded-lg shrink-0">
                      <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Total Cards</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCards}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl border border-purple-200/50 dark:border-purple-800/30 sm:col-span-2 lg:col-span-1">
                    <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg shrink-0">
                      <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                      <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">{completedCards}</p>
                    </div>
                  </div>
                </div>

                <Separator className="bg-slate-200 dark:bg-slate-700 my-6" />

                {/* Progress and Details */}
                <div className="space-y-4">
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-medium text-slate-700 dark:text-slate-300">Completion Progress</span>
                      <span className="text-slate-600 dark:text-slate-400">{completionRate}%</span>
                    </div>
                    <Progress value={completionRate} className="h-2" />
                  </div>

                  {/* Board Details */}
                  <div className="grid gap-3 sm:gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Created</span>
                      </div>
                      <span className="text-sm text-slate-700 dark:text-slate-300">
                        {new Date(board.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Workspace</span>
                      </div>
                      <Badge variant="secondary" className="self-start sm:self-center">
                        {workspace?.name}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export options */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span>Export Options</span>
                </CardTitle>
                <CardDescription>
                  Choose how you want to export your board data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 sm:p-6 border border-slate-200 dark:border-slate-700 rounded-xl bg-gradient-to-br from-slate-50/50 to-white dark:from-slate-800/20 dark:to-slate-900/50 hover:shadow-sm transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-4">
                      <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg shrink-0 self-start">
                        <Database className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      
                      <div className="flex-1 space-y-4">
                        <div>
                          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">
                            JSON Export
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                            Export your board as a structured JSON file containing all lists, cards, and metadata. 
                            Perfect for backup, data analysis, or importing into other systems.
                          </p>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-xs bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800">
                            <Tag className="w-3 h-3 mr-1" />
                            All Lists
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-green-50 dark:bg-green-950/50 border-green-200 dark:border-green-800">
                            <FileText className="w-3 h-3 mr-1" />
                            All Cards
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-purple-50 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800">
                            <Users className="w-3 h-3 mr-1" />
                            Assignees
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-orange-50 dark:bg-orange-950/50 border-orange-200 dark:border-orange-800">
                            <Clock className="w-3 h-3 mr-1" />
                            Due Dates
                          </Badge>
                          <Badge variant="outline" className="text-xs bg-slate-50 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800">
                            <BarChart3 className="w-3 h-3 mr-1" />
                            Metadata
                          </Badge>
                        </div>
                        
                        <div className="pt-2">
                          <ExportClient boardId={board.id} boardTitle={board.title} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Export preview */}
            <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                  <span>What&rsquo;s Included</span>
                </CardTitle>
                <CardDescription>
                  Your export will contain the following information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Board Information</h4>
                    </div>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Board title and unique ID</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Workspace information</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Creation and export timestamps</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Board statistics and metrics</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <h4 className="font-semibold text-slate-900 dark:text-slate-100">Card Details</h4>
                    </div>
                    <div className="pl-4 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Card titles and descriptions</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Status and completion data</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Due dates and assignee information</span>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
                        <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                        <span>Creation and completion timestamps</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading board for export:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80 px-4">
        <div className="text-center p-6 sm:p-8 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/20 dark:to-red-800/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
          
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Unable to Load Board
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm sm:text-base leading-relaxed">
            We encountered an issue while loading your board for export. Please try again or contact support if the problem persists.
          </p>
          
          <div className="space-y-3">
            <Button asChild variant="outline" className="w-full">
              <Link href="/workspaces">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Workspaces
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full text-sm">
              <Link href={`/board/${boardId}`}>
                Try Board Again
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
}