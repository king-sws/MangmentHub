// app/board/[boardId]/archive/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { ArrowLeft, Archive, AlertTriangle, Calendar, Users, FileText, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArchiveClient } from "@/components/ArchiveClient";

interface ArchivePageProps {
  params: { boardId: string };
}

export default async function ArchivePage({ params }: ArchivePageProps) {
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
          select: { id: true, name: true, userId: true },
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

    const isOwner = board.workspace.userId === userId;

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
    const isArchived = !!board.completedAt;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950 dark:to-slate-900/50">
        {/* Header */}
        <header className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md supports-[backdrop-filter]:bg-white/90 dark:supports-[backdrop-filter]:bg-slate-950/90 sticky top-0 z-50 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link 
                  href={`/board/${board.id}`}
                  className="flex items-center text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors group"
                >
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-0.5" />
                  <span className="font-medium text-sm">Back to Board</span>
                </Link>
                
                <div className="w-px h-4 bg-slate-300 dark:bg-slate-600" />
                
                <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
                  <span>{board.workspace.name}</span>
                  <span>/</span>
                  <span>{board.title}</span>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Archive className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                  {isArchived ? 'Restore Board' : 'Archive Board'}
                </h1>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-6 py-8 max-w-4xl">
          <div className="space-y-8">
            {/* Status indicator */}
            {isArchived && (
              <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20">
                <Archive className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                <AlertDescription className="text-orange-800 dark:text-orange-200">
                  This board is currently archived. Archived on {new Date(board.completedAt!).toLocaleDateString()}.
                </AlertDescription>
              </Alert>
            )}

            {/* Board overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Board Overview</span>
                </CardTitle>
                <CardDescription>
                  Review your board information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Lists</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalLists}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <div className="p-2 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Cards</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalCards}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <Archive className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Completed</p>
                      <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{completedCards}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400">
                      <Calendar className="w-4 h-4" />
                      <span>Created: {new Date(board.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={isArchived ? "destructive" : "secondary"}>
                        {isArchived ? "Archived" : "Active"}
                      </Badge>
                      <Badge variant="outline">
                        {Math.round((completedCards / totalCards) * 100) || 0}% Complete
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Permission check */}
            {!isOwner && (
              <Alert className="border-red-200 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20">
                <Shield className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  Only workspace owners can archive or restore boards. You have member access to this workspace.
                </AlertDescription>
              </Alert>
            )}

            {/* Archive/Restore actions */}
            {isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    {isArchived ? (
                      <>
                        <Archive className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span>Restore Board</span>
                      </>
                    ) : (
                      <>
                        <Archive className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        <span>Archive Board</span>
                      </>
                    )}
                  </CardTitle>
                  <CardDescription>
                    {isArchived 
                      ? "Restore this board to make it active again"
                      : "Archive this board to mark it as completed"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isArchived ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/50 rounded-lg">
                        <h3 className="font-medium text-green-900 dark:text-green-100 mb-2">
                          Restore Board
                        </h3>
                        <p className="text-sm text-green-700 dark:text-green-200 mb-4">
                          Restoring this board will make it active again. All lists and cards will remain intact.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                            Reactivate Board
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                            Preserve All Data
                          </Badge>
                          <Badge variant="outline" className="text-xs border-green-300 text-green-700 dark:border-green-700 dark:text-green-300">
                            Resume Collaboration
                          </Badge>
                        </div>
                        <ArchiveClient 
                          boardId={board.id} 
                          boardTitle={board.title} 
                          isArchived={true}
                          workspaceId={board.workspaceId}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert className="border-orange-200 bg-orange-50 dark:border-orange-900/50 dark:bg-orange-950/20">
                        <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                        <AlertDescription className="text-orange-800 dark:text-orange-200">
                          Archiving will mark this board as completed. The board and all its data will be preserved, but it will be moved out of your active workspace view.
                        </AlertDescription>
                      </Alert>

                      <div className="p-4 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-lg">
                        <h3 className="font-medium text-orange-900 dark:text-orange-100 mb-2">
                          What happens when you archive?
                        </h3>
                        <ul className="text-sm text-orange-700 dark:text-orange-200 space-y-1 mb-4">
                          <li>• Board is marked as completed</li>
                          <li>• All data (lists, cards, assignees) is preserved</li>
                          <li>• Board becomes read-only for members</li>
                          <li>• Can be restored at any time by workspace owners</li>
                        </ul>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                            Preserve Data
                          </Badge>
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                            Reversible Action
                          </Badge>
                          <Badge variant="outline" className="text-xs border-orange-300 text-orange-700 dark:border-orange-700 dark:text-orange-300">
                            Owner Only
                          </Badge>
                        </div>
                        <ArchiveClient 
                          boardId={board.id} 
                          boardTitle={board.title} 
                          isArchived={false}
                          workspaceId={board.workspaceId}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Additional actions */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Actions</CardTitle>
                <CardDescription>
                  Other things you can do with this board
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/board/${board.id}/export`}>
                      <Archive className="w-4 h-4 mr-2" />
                      Export Board Data
                    </Link>
                  </Button>
                  
                  <Button asChild variant="outline" className="flex-1">
                    <Link href={`/board/${board.id}/settings`}>
                      <Users className="w-4 h-4 mr-2" />
                      Board Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error loading board for archive:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
        <div className="text-center p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">!</span>
            </div>
          </div>
          
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Unable to Load Board
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
            We encountered an issue while loading your board for archiving.
          </p>
          
          <Button asChild variant="outline" className="w-full">
            <Link href="/workspaces">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Workspaces
            </Link>
          </Button>
        </div>
      </div>
    );
  }
}