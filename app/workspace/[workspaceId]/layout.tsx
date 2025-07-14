// app/workspace/[workspaceId]/layout.tsx
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { getCurrentSubscription } from '@/actions/subscription'
import { getEffectivePlan, getWorkspaceLimit, getBoardLimit, getMemberLimit } from '@/lib/plans'
import { WorkspaceProvider } from '@/components/workspace-context'
import { PlanIndicator } from './_components/PlanIndicator'
import { MobileNav } from './_components/MobileNav'
import Link from 'next/link'

// app/dashboard/[userId]/workspace/[workspaceId]/layout.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Workspace | Blutto',
  description: 'Your centralized workspace in Blutto. Manage boards, tasks, teams, and settings—all in one place.',
  keywords: ['Blutto', 'Workspace', 'Team collaboration', 'Boards', 'Tasks', 'Project management', 'Work hub'],
};


interface WorkspaceLayoutProps {
  children: ReactNode
  params: { workspaceId: string }
}

export default async function WorkspaceLayout({
  children,
  params
}: WorkspaceLayoutProps) {
  const { workspaceId } = params
  const session = await auth()
  
  if (!session?.user?.id) redirect('/sign-in')

  try {
    const [workspace, subscription] = await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        include: {
          _count: {
            select: {
              boards: true,
              members: true
            }
          }
        }
      }),
      getCurrentSubscription()
    ])

    if (!workspace) redirect(`/dashboard/${session.user.id}`)

    const effectivePlan = getEffectivePlan(subscription.plan, subscription.planExpires)
    const planDetails = {
      plan: effectivePlan,
      workspaceLimit: getWorkspaceLimit(effectivePlan),
      boardLimit: getBoardLimit(effectivePlan),
      memberLimit: getMemberLimit(effectivePlan),
      currentBoards: workspace._count.boards,
      currentMembers: workspace._count.members
    }

    // Check if user is member/owner
    const isOwner = workspace.userId === session.user.id
    const membership = isOwner ? { role: 'OWNER' } : await prisma.workspaceMember.findFirst({
      where: { userId: session.user.id, workspaceId }
    })

    if (!membership) {
      const firstWorkspace = await prisma.workspaceMember.findFirst({
        where: { userId: session.user.id },
        select: { workspaceId: true }
      })
      redirect(firstWorkspace ? `/workspace/${firstWorkspace.workspaceId}` : '/dashboard')
    }

    // Calculate if limits are reached
    const isBoardLimitReached = planDetails.boardLimit !== Infinity && planDetails.currentBoards >= planDetails.boardLimit
    const isMemberLimitReached = planDetails.memberLimit !== Infinity && planDetails.currentMembers >= planDetails.memberLimit

    return (
      <WorkspaceProvider value={planDetails}>
        <div className="flex flex-col min-h-screen bg-background">
          {/* Desktop Header */}
          <header className="hidden md:block border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between h-16 px-4 lg:px-6">
              <div className="flex items-center space-x-4">
                <WorkspaceSwitcher />
                <PlanIndicator
                  plan={effectivePlan} 
                  boardLimit={planDetails.boardLimit} 
                  memberLimit={planDetails.memberLimit} 
                  currentBoards={planDetails.currentBoards} 
                  currentMembers={planDetails.currentMembers} 
                />
              </div>
              <div className="flex items-center space-x-4 ">
                {/* Add any additional header actions here */}

                <Link
                  href={`/dashboard/${session?.user?.id}`}
                  className="hidden lg:inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-zinc-800 active:scale-95 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-zinc-500 focus:ring-offset-2"
                  aria-label="Go back to dashboard"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back
                </Link>

                </div>
            </div>
          </header>

          {/* Mobile Header */}
          <header className="md:hidden border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
            <div className="flex items-center justify-between h-14 px-4">
              <WorkspaceSwitcher />
              <MobileNav
                planDetails={planDetails}
                effectivePlan={effectivePlan}
                workspaceId={workspaceId}
                userId={session.user.id}
                isOwner={isOwner}
                isBoardLimitReached={isBoardLimitReached}
                isMemberLimitReached={isMemberLimitReached}
              />
            </div>
          </header>

          <main className="flex-1 overflow-hidden">
            <div className="h-full">
              {children}
            </div>
          </main>
        </div>
      </WorkspaceProvider>
    )
  } catch (error) {
    console.error("Workspace layout error:", error)
    redirect(`/dashboard/${session.user.id}`)
  }
}