/* eslint-disable @typescript-eslint/no-unused-vars */
// components/MobileNav.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { 
  Menu, 
  Layout, 
  Users, 
  Settings, 
  Plus,
  Crown,
  Zap,
  Star,
  BarChart3
} from 'lucide-react'

interface MobileNavProps {
  planDetails: {
    plan: string
    workspaceLimit: number
    boardLimit: number
    memberLimit: number
    currentBoards: number
    currentMembers: number
  }
  effectivePlan: string
  workspaceId: string
  userId: string
  isOwner?: boolean
  isBoardLimitReached?: boolean
  isMemberLimitReached?: boolean
}

export function MobileNav({ 
  planDetails, 
  effectivePlan, 
  workspaceId, 
  userId,
  isOwner = false,
  isBoardLimitReached = false,
  isMemberLimitReached = false
}: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  const { plan, boardLimit, memberLimit, currentBoards, currentMembers } = planDetails

  // Calculate usage percentages
  const boardPercentage = boardLimit === Infinity ? 0 : Math.round((currentBoards / boardLimit) * 100)
  const memberPercentage = memberLimit === Infinity ? 0 : Math.round((currentMembers / memberLimit) * 100)

  const getPlanIcon = () => {
    switch (plan) {
      case 'FREE':
        return <Users className="h-4 w-4" />
      case 'PRO':
        return <Zap className="h-4 w-4" />
      case 'ENTERPRISE':
        return <Crown className="h-4 w-4" />
      default:
        return <Users className="h-4 w-4" />
    }
  }

  const getPlanColor = () => {
    switch (plan) {
      case 'FREE':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      case 'PRO':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'ENTERPRISE':
        return 'bg-purple-100 text-purple-700 border-purple-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600'
    if (percentage >= 70) return 'text-amber-600'
    return 'text-green-600'
  }

  const handleClose = () => setIsOpen(false)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0" title={undefined}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className={getPlanColor()}>
                <div className="flex items-center space-x-1">
                  {getPlanIcon()}
                  <span className="font-medium">{plan} Plan</span>
                </div>
              </Badge>
            </div>
          </div>

          {/* Usage Stats */}
          <div className="p-4 space-y-4 border-b">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Usage Overview
            </h3>
            
            {/* Boards Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Boards</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentBoards} / {boardLimit === Infinity ? '∞' : boardLimit}
                </span>
              </div>
              
              {boardLimit !== Infinity && (
                <div className="space-y-2">
                  <Progress value={boardPercentage} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${getStatusColor(boardPercentage)}`}>
                      {boardPercentage >= 90 ? 'Critical' : boardPercentage >= 70 ? 'Warning' : 'Good'}
                    </span>
                    <span className="text-muted-foreground">
                      {boardPercentage}% used
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Members Usage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-sm">Members</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentMembers} / {memberLimit === Infinity ? '∞' : memberLimit}
                </span>
              </div>
              
              {memberLimit !== Infinity && (
                <div className="space-y-2">
                  <Progress value={memberPercentage} className="h-2" />
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${getStatusColor(memberPercentage)}`}>
                      {memberPercentage >= 90 ? 'Critical' : memberPercentage >= 70 ? 'Warning' : 'Good'}
                    </span>
                    <span className="text-muted-foreground">
                      {memberPercentage}% used
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="p-4 space-y-3 flex-1">
            <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
              Quick Actions
            </h3>
            
            <div className="space-y-2">
              {/* Create Board Button - Uses your CreateBoardButton logic */}
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="sm"
                disabled={isBoardLimitReached}
                onClick={handleClose}
                asChild={!isBoardLimitReached}
                title={isBoardLimitReached ? `Board limit reached (${currentBoards}/${boardLimit}) - Upgrade to create more boards` : undefined}
              >
                {isBoardLimitReached ? (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board (Limit Reached)
                  </>
                ) : (
                  <Link href={`/workspace/${workspaceId}?create=board`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Board
                  </Link>
                )}
              </Button>
              
              {/* Manage Members - Only show for owners */}
              {isOwner && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleClose}
                  asChild
                >
                  <Link href={`/workspace/${workspaceId}/members`}>
                    <Users className="h-4 w-4 mr-2" />
                    Manage Members
                  </Link>
                </Button>
              )}
              
              {/* Analytics - Route to dashboard */}
              <Button 
                variant="outline" 
                className="w-full justify-start" 
                size="sm"
                onClick={handleClose}
                asChild
              >
                <Link href={`/dashboard/${userId}/analytics`}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Link>
              </Button>
              
              {/* Workspace Settings - Only show for owners */}
              {isOwner && (
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  onClick={handleClose}
                  asChild
                >
                  <Link href={`/workspace/${workspaceId}/settings`}>
                    <Settings className="h-4 w-4 mr-2" />
                    Workspace Settings
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Upgrade CTA (if applicable) */}
          {plan !== 'ENTERPRISE' && (boardPercentage > 70 || memberPercentage > 70) && (
            <div className="p-4 border-t">
              <Button 
                className="w-full" 
                size="sm"
                onClick={handleClose}
                asChild
              >
                <Link href="/settings/subscription">
                  <Star className="h-4 w-4 mr-2" />
                  Upgrade to {plan === 'FREE' ? 'Pro' : 'Enterprise'}
                </Link>
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}