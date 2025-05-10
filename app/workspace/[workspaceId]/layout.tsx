// app/workspace/[workspaceId]/layout.tsx
import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'
import { WorkspaceSwitcher } from '@/components/WorkspaceSwitcher'
import { getCurrentSubscription } from '@/actions/subscription'
import { getEffectivePlan, getWorkspaceLimit, getBoardLimit, getMemberLimit } from '@/lib/plans'
import { WorkspaceProvider } from '@/components/workspace-context'

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

    if (!workspace) redirect('/dashboard')

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

    return (
      <WorkspaceProvider value={planDetails}>
        <div className="flex flex-col min-h-screen">
          <header className="border-b">
            <div className="flex items-center justify-between h-16 px-4">
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
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </WorkspaceProvider>
    )
  } catch (error) {
    console.error("Workspace layout error:", error)
    redirect('/dashboard')
  }
}

// Define the props interface for PlanIndicator
interface PlanIndicatorProps {
  plan: string;
  boardLimit: number;
  memberLimit: number;
  currentBoards: number;
  currentMembers: number;
}

function PlanIndicator({ plan, boardLimit, memberLimit, currentBoards, currentMembers }: PlanIndicatorProps) {
  // Determine usage percentages
  const boardPercentage = boardLimit === Infinity ? 0 : Math.round((currentBoards / boardLimit) * 100);
  const memberPercentage = memberLimit === Infinity ? 0 : Math.round((currentMembers / memberLimit) * 100);

  // Function to determine color based on usage
  const getColor = (percentage: number) => {
    if (percentage >= 90) return "text-red-500";
    if (percentage >= 70) return "text-amber-500";
    return "text-green-500";
  };

  return (
    <div className="flex items-center rounded-lg bg-muted/50 px-4 py-2 text-sm">
      <div className="mr-4">
        <span className="font-medium">Plan: </span>
        <span className={`font-bold ${plan === 'FREE' ? 'text-gray-700' : plan === 'PRO' ? 'text-blue-600' : 'text-purple-600'}`}>
          {plan}
        </span>
      </div>
      
      <div className="flex items-center mr-4">
        <span className="font-medium mr-1">Boards:</span>
        <span className={getColor(boardPercentage)}>
          {currentBoards}/{boardLimit === Infinity ? '∞' : boardLimit}
        </span>
      </div>
      
      <div className="flex items-center">
        <span className="font-medium mr-1">Members:</span>
        <span className={getColor(memberPercentage)}>
          {currentMembers}/{memberLimit === Infinity ? '∞' : memberLimit}
        </span>
      </div>
    </div>
  );
}