// components/PlanIndicator.tsx
'use client'

import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Info, Users, Layout, Crown, Zap, Star } from 'lucide-react'

interface PlanIndicatorProps {
  plan: string
  boardLimit: number
  memberLimit: number
  currentBoards: number
  currentMembers: number
}

export function PlanIndicator({ 
  plan, 
  boardLimit, 
  memberLimit, 
  currentBoards, 
  currentMembers 
}: PlanIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Calculate usage percentages
  const boardPercentage = boardLimit === Infinity ? 0 : Math.round((currentBoards / boardLimit) * 100)
  const memberPercentage = memberLimit === Infinity ? 0 : Math.round((currentMembers / memberLimit) * 100)

  // Determine status colors
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive'
    if (percentage >= 70) return 'warning'
    return 'success'
  }

  const getStatusText = (percentage: number) => {
    if (percentage >= 90) return 'Critical'
    if (percentage >= 70) return 'Warning'
    return 'Good'
  }

  // Plan styling
  const getPlanStyle = () => {
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

  const getPlanIcon = () => {
    switch (plan) {
      case 'FREE':
        return <Users className="h-3 w-3" />
      case 'PRO':
        return <Zap className="h-3 w-3" />
      case 'ENTERPRISE':
        return <Crown className="h-3 w-3" />
      default:
        return <Users className="h-3 w-3" />
    }
  }

  // Desktop view (hidden on mobile)
  const DesktopView = () => (
    <div className="hidden lg:flex items-center space-x-4 rounded-lg bg-muted/50 px-4 py-2 text-sm">
      <div className="flex items-center space-x-2">
        <Badge variant="outline" className={getPlanStyle()}>
          <div className="flex items-center space-x-1">
            {getPlanIcon()}
            <span className="font-medium">{plan}</span>
          </div>
        </Badge>
      </div>
      
      <div className="flex items-center space-x-1">
        <Layout className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Boards:</span>
        <span className={`font-mono text-xs ${
          boardPercentage >= 90 ? 'text-red-600' : 
          boardPercentage >= 70 ? 'text-amber-600' : 
          'text-green-600'
        }`}>
          {currentBoards}/{boardLimit === Infinity ? '∞' : boardLimit}
        </span>
      </div>
      
      <div className="flex items-center space-x-1">
        <Users className="h-3 w-3 text-muted-foreground" />
        <span className="font-medium">Members:</span>
        <span className={`font-mono text-xs ${
          memberPercentage >= 90 ? 'text-red-600' : 
          memberPercentage >= 70 ? 'text-amber-600' : 
          'text-green-600'
        }`}>
          {currentMembers}/{memberLimit === Infinity ? '∞' : memberLimit}
        </span>
      </div>
    </div>
  )

  // Compact view (hidden on large screens)
  const CompactView = () => (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="lg:hidden flex items-center space-x-2 h-8"
        >
          <Badge variant="outline" className={`${getPlanStyle()} text-xs px-1 py-0`}>
            <div className="flex items-center space-x-1">
              {getPlanIcon()}
              <span>{plan}</span>
            </div>
          </Badge>
          <Info className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-base">
              {getPlanIcon()}
              <span>{plan} Plan</span>
            </CardTitle>
            <CardDescription>Current usage and limits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Boards Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Layout className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Boards</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentBoards} / {boardLimit === Infinity ? '∞' : boardLimit}
                </span>
              </div>
              {boardLimit !== Infinity && (
                <div className="space-y-1">
                  <Progress 
                    value={boardPercentage} 
                    className="h-2"
                    // Custom colors would need to be handled through CSS classes
                  />
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${
                      boardPercentage >= 90 ? 'text-red-600' : 
                      boardPercentage >= 70 ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {getStatusText(boardPercentage)}
                    </span>
                    <span className="text-muted-foreground">
                      {boardPercentage}% used
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Members Usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Members</span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {currentMembers} / {memberLimit === Infinity ? '∞' : memberLimit}
                </span>
              </div>
              {memberLimit !== Infinity && (
                <div className="space-y-1">
                  <Progress 
                    value={memberPercentage} 
                    className="h-2"
                  />
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${
                      memberPercentage >= 90 ? 'text-red-600' : 
                      memberPercentage >= 70 ? 'text-amber-600' : 
                      'text-green-600'
                    }`}>
                      {getStatusText(memberPercentage)}
                    </span>
                    <span className="text-muted-foreground">
                      {memberPercentage}% used
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Upgrade CTA for non-enterprise plans */}
            {plan !== 'ENTERPRISE' && (boardPercentage > 70 || memberPercentage > 70) && (
              <div className="pt-2 border-t">
                <Button size="sm" className="w-full" variant="outline">
                  <Star className="h-3 w-3 mr-1" />
                  Upgrade Plan
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  )

  return (
    <>
      <DesktopView />
      <CompactView />
    </>
  )
}