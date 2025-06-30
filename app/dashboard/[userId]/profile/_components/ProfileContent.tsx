/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { 
  Crown, 
  Users, 
  Briefcase, 
  CheckCircle2,
  Settings,
  ExternalLink,
  ArrowRight,
  Shield,
  Zap,
  Clock,
  MessageSquare,
  BarChart3,
  User,
  Mail,
  Calendar,
  Building2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

type Workspace = {
  id: string;
  name: string;
  createdAt: Date;
  _count: {
    boards: number;
    members: number;
  };
};

type ProfileUser = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: string;
  emailVerified: Date | null;
  plan: string;
  planExpires: Date | null;
  planStarted: Date | null;
  createdAt: Date;
  lastLogin: Date | null;
  provider: string;
  workspaces: Workspace[];
  _count: {
    workspaces: number;
    assignedCards: number;
    chatMessages: number;
  };
};

type ProfileContentProps = {
  user: ProfileUser;
  canViewFullProfile: boolean;
};

export function ProfileContent({ user, canViewFullProfile }: ProfileContentProps) {
  const planInfo = {
    FREE: { 
      name: "Free Plan", 
      color: "text-slate-600 bg-slate-100 dark:text-slate-300 dark:bg-slate-800", 
      icon: Clock,
      variant: "secondary" as const
    },
    PRO: { 
      name: "Pro Plan", 
      color: "text-blue-600 bg-blue-100 dark:text-blue-300 dark:bg-blue-900", 
      icon: Zap,
      variant: "default" as const
    },
    BUSINESS: { 
      name: "Business Plan", 
      color: "text-purple-600 bg-purple-100 dark:text-purple-300 dark:bg-purple-900", 
      icon: Crown,
      variant: "secondary" as const
    },
  };

  const currentPlan = planInfo[user.plan as keyof typeof planInfo] || planInfo.FREE;
  const PlanIcon = currentPlan.icon;

  const stats = [
    {
      label: "Workspaces",
      value: user._count.workspaces,
      icon: Briefcase,
      description: "Active workspaces"
    },
    {
      label: "Tasks Assigned",
      value: user._count.assignedCards,
      icon: CheckCircle2,
      description: "Total assignments"
    },
    {
      label: "Messages Sent",
      value: user._count.chatMessages,
      icon: MessageSquare,
      description: "Chat activity"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <Card className="border-0 shadow-sm bg-card">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Avatar Section */}
            <div className="relative">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-border bg-muted">
                <Avatar className="w-full h-full">
                  <AvatarImage 
                    src={user.image ?? undefined} 
                    alt={user.name ?? undefined}
                    className="w-full h-full object-cover"
                  />
                  <AvatarFallback className="w-full h-full bg-primary/10 text-primary font-semibold text-xl flex items-center justify-center">
                    {(user.name?.charAt(0).toUpperCase() ?? "U")}
                  </AvatarFallback>
                </Avatar>
              </div>
              {user.role === "ADMIN" && (
                <div className="absolute -top-1 -right-1">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm">
                    <Shield className="w-3 h-3 text-primary-foreground" />
                  </div>
                </div>
              )}
            </div>
            
            {/* User Info */}
            <div className="flex-1 space-y-3">
              <div className="space-y-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl font-bold text-foreground">
                    {user.name || "Anonymous User"}
                  </h1>
                  <Badge className={currentPlan.color}>
                    <PlanIcon className="w-3 h-3 mr-1.5" />
                    {currentPlan.name}
                  </Badge>
                </div>
                <p className="text-muted-foreground">
                  {user.role === "ADMIN" ? "Administrator" : "User"} - {user.provider}
                </p>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">
                  <Calendar className="w-3 h-3 mr-1" />
                  Joined {format(new Date(user.createdAt), "MMM yyyy")}
                </Badge>
                {user.lastLogin && (
                  <Badge variant="outline" className="text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    Active {formatDistanceToNow(new Date(user.lastLogin), { addSuffix: true })}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Action Button */}
            {canViewFullProfile && (
              <Button asChild className="gap-2">
                <Link href={`/dashboard/${user.id}/settings`}>
                  <Settings className="w-4 h-4" />
                  <span className="hidden sm:inline">Edit Profile</span>
                  <span className="sm:hidden">Edit</span>
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats Cards */}
      {canViewFullProfile && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <Card key={stat.label} className="border-0 shadow-sm bg-card">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <IconComponent className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                      <p className="text-sm text-muted-foreground">{stat.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Account Information */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-sm bg-card">
            <CardHeader className="border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Account Information</CardTitle>
                  <CardDescription className="text-sm">
                    Personal details and account settings
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                    <p className="text-base font-medium text-foreground">{user.name || "Not provided"}</p>
                  </div>
                  
                  {canViewFullProfile && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email Address</label>
                      <p className="text-base font-medium text-foreground break-all">{user.email}</p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Account Type</label>{" "}
                    <Badge variant="outline" className="w-fit capitalize">
                      {user.provider}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Role</label>{" "}
                    <Badge variant={user.role === "ADMIN" ? "default" : "secondary"} className="w-fit">
                      {user.role === "ADMIN" ? "Administrator" : "User"}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          {canViewFullProfile && (
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <PlanIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Subscription Details</CardTitle>
                    <CardDescription className="text-sm">
                      Current plan and billing information
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Current Plan</label>
                    <div className="flex items-center gap-2">
                      <Badge className={currentPlan.color}>
                        <PlanIcon className="w-3 h-3 mr-1.5" />
                        {currentPlan.name}
                      </Badge>
                    </div>
                  </div>
                  
                  {user.planStarted && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Started</label>
                      <p className="text-base font-medium text-foreground">
                        {format(new Date(user.planStarted), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                  
                  {user.planExpires && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        {user.plan !== "FREE" ? "Next Billing" : "Expires"}
                      </label>
                      <p className="text-base font-medium text-foreground">
                        {format(new Date(user.planExpires), "MMM dd, yyyy")}
                      </p>
                    </div>
                  )}
                  
                  {user.emailVerified && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email Verified</label>
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-green-600 bg-green-100 dark:text-green-300 dark:bg-green-900">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Workspaces Sidebar */}
        {canViewFullProfile && (
          <div className="space-y-6">
            <Card className="border-0 shadow-sm bg-card">
              <CardHeader className="border-b border-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Workspaces</CardTitle>
                    <CardDescription className="text-sm">
                      Your active workspaces
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {user.workspaces.length > 0 ? (
                  <div className="space-y-4">
                    {user.workspaces.slice(0, 4).map((workspace) => (
                      <Link 
                        key={workspace.id}
                        href={`/workspaces/${workspace.id}`}
                        className="block group"
                      >
                        <div className="p-4 rounded-lg border border-border hover:border-primary/50 hover:bg-accent/50 transition-all duration-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                                {workspace.name}
                              </h4>
                              <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="w-3 h-3" />
                                  {workspace._count.boards} boards
                                </span>
                                <span className="flex items-center gap-1">
                                  <Users className="w-3 h-3" />
                                  {workspace._count.members} members
                                </span>
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 ml-2" />
                          </div>
                        </div>
                      </Link>
                    ))}
                    
                    {user._count.workspaces > 4 && (
                      <div className="pt-2 border-t border-border">
                        <Button variant="outline" asChild className="w-full gap-2">
                          <Link href="/dashboard/workspaces">
                            <Building2 className="w-4 h-4" />
                            View all {user._count.workspaces} workspaces
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-3 rounded-lg bg-muted mx-auto w-fit mb-3">
                      <Building2 className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground">No workspaces found</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {canViewFullProfile && (
        <Card className="border-0 shadow-sm bg-card">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <Button asChild className="gap-2">
                <Link href={`/dashboard/${user.id}/settings`}>
                  <Settings className="w-4 h-4" />
                  Account Settings
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="gap-2">
                <Link href="/dashboard/workspaces">
                  <Building2 className="w-4 h-4" />
                  My Workspaces
                </Link>
              </Button>
              
              {user.plan === "FREE" && (
                <Button variant="outline" asChild className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                  <Link href="/settings/subscription">
                    <Crown className="w-4 h-4" />
                    Upgrade Plan
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}