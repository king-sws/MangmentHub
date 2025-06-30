// app/board/[boardId]/settings/page.tsx

import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { ArrowLeft, Settings, Trash2, Archive, Calendar, Users, BarChart3 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { BoardSettingsForm } from "@/components/BoardSettingsForm";

interface BoardSettingsPageProps {
  params: { boardId: string };
}

export default async function BoardSettingsPage({ params }: BoardSettingsPageProps) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return redirect("/sign-in");
  }

  const board = await prisma.board.findUnique({
    where: { id: params.boardId },
    include: {
      workspace: true,
      lists: {
        include: {
          cards: true,
        },
      },
    },
  });

  if (!board) {
    return notFound();
  }

  // Check permissions
  const workspace = await prisma.workspace.findUnique({
    where: { id: board.workspaceId },
  });

  const isOwner = workspace?.userId === userId;

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

  const totalCards = board.lists.reduce((acc, list) => acc + list.cards.length, 0);
  const completedCards = board.lists.reduce(
    (acc, list) => acc + list.cards.filter(card => card.completed).length,
    0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100/80 dark:from-slate-950 dark:via-slate-900 dark:to-slate-900/80">
      {/* Header */}
      <header className="bg-white/95 dark:bg-slate-950/95 border-b border-slate-200/60 dark:border-slate-800/60 backdrop-blur-md sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            {/* Left section - Back button and breadcrumb */}
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
              <div className="flex items-center space-x-2 min-w-0">
                <Settings className="w-4 h-4 text-slate-500 shrink-0" />
                <span className="text-sm text-slate-500 dark:text-slate-400 truncate">Board Settings</span>
              </div>
            </div>
            
            {/* Center section - Board title */}
            <div className="sm:flex-1 sm:text-center">
              <h1 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 truncate">
                {board.title}
              </h1>
            </div>
            
            {/* Right section - Status badge */}
            <div className="flex justify-end sm:w-32">
              <Badge 
                variant={board.completedAt ? "outline" : "default"}
                className="shrink-0"
              >
                {board.completedAt ? "Archived" : "Active"}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 max-w-6xl">
        <div className="grid gap-6 lg:gap-8">
          {/* Board Overview */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                Board Overview
              </CardTitle>
              <CardDescription>
                General information and statistics about your board
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Statistics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-800/10 rounded-xl border border-blue-200/50 dark:border-blue-800/30">
                  <div className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {board.lists.length}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Lists</div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-800/10 rounded-xl border border-green-200/50 dark:border-green-800/30">
                  <div className="text-2xl sm:text-3xl font-bold text-green-600 dark:text-green-400">
                    {totalCards}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Total Cards</div>
                </div>
                <div className="text-center p-4 sm:p-6 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-800/10 rounded-xl border border-purple-200/50 dark:border-purple-800/30 sm:col-span-2 lg:col-span-1">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {totalCards > 0 ? Math.round((completedCards / totalCards) * 100) : 0}%
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">Completed</div>
                </div>
              </div>

              <Separator className="bg-slate-200 dark:bg-slate-700" />

              {/* Board Details */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Workspace</span>
                    </div>
                    <Badge variant="secondary" className="self-start sm:self-center">
                      {board.workspace.name}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Created</span>
                    </div>
                    <span className="text-sm text-slate-600 dark:text-slate-400">
                      {new Date(board.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Settings className="w-4 h-4 text-slate-500" />
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status</span>
                    </div>
                    <Badge 
                      variant={board.completedAt ? "outline" : "default"}
                      className="self-start sm:self-center"
                    >
                      {board.completedAt ? "Archived" : "Active"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Board Settings Form */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                Board Settings
              </CardTitle>
              <CardDescription>
                Customize your board name and other preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BoardSettingsForm board={board} />
            </CardContent>
          </Card>

          {/* Danger Zone */}
          {isOwner && (
            <Card className="border-red-200 dark:border-red-800 shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader>
                <CardTitle className="text-red-600 dark:text-red-400 flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  These actions are irreversible. Please be careful.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Archive Board */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-orange-200 dark:border-orange-800 rounded-lg bg-orange-50/50 dark:bg-orange-950/20">
                  <div className="space-y-1">
                    <h4 className="font-medium text-orange-800 dark:text-orange-200">
                      Archive Board
                    </h4>
                    <p className="text-sm text-orange-600 dark:text-orange-400">
                      Archive this board to hide it from your workspace
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-700 dark:text-orange-300 dark:hover:bg-orange-950/50 shrink-0 w-full sm:w-auto"
                  >
                    <Archive className="w-4 h-4 mr-2" />
                    <Link href={`/board/${board.id}/archive`}>
                      Archive
                    </Link>
                  </Button>
                </div>

                {/* Delete Board */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                  <div className="space-y-1">
                    <h4 className="font-medium text-red-800 dark:text-red-200">
                      Delete Board
                    </h4>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Permanently delete this board and all its data
                    </p>
                  </div>
                  <Button 
                    variant="destructive" 
                    className="shrink-0 w-full sm:w-auto hover:bg-red-700 dark:hover:bg-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}