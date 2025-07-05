// app/settings/[userId]/_components/WorkspaceSelector.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Building2, Crown, Shield, User, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import React from "react";

interface Workspace {
  id: string;
  name: string;
  userId: string;
  memberCount?: number;
  memberLimit?: number;
  canAddMembers?: boolean;
  planType?: 'FREE' | 'PRO' | 'ENTERPRISE';
  role?: 'OWNER' | 'ADMIN' | 'MEMBER';
}

interface WorkspaceSelectorProps {
  workspaces: Workspace[];
  selectedWorkspaceId?: string;
  userId: string;
}

export function WorkspaceSelector({
  workspaces,
  selectedWorkspaceId,
  userId
}: WorkspaceSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleWorkspaceChange = (workspaceId: string) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set('workspace', workspaceId);

    const currentHash = window.location.hash;
    router.push(`/settings/${userId}?${params.toString()}${currentHash}`);
  };

  const isOwner = (workspace: Workspace) => workspace.userId === userId;
  
  const getRoleIcon = (workspace: Workspace) => {
    if (isOwner(workspace)) return Crown;
    if (workspace.role === 'ADMIN') return Shield;
    return User;
  };

  const getRoleConfig = (workspace: Workspace) => {
    if (isOwner(workspace)) {
      return { 
        label: 'Owner', 
        className: 'text-amber-600 dark:text-amber-400' 
      };
    }
    if (workspace.role === 'ADMIN') {
      return { 
        label: 'Admin', 
        className: 'text-blue-600 dark:text-blue-400' 
      };
    }
    return { 
      label: 'Member', 
      className: 'text-slate-600 dark:text-slate-400' 
    };
  };

  const getPlanConfig = (planType?: string) => {
    switch (planType) {
      case 'FREE':
        return { 
          label: 'Free', 
          className: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' 
        };
      case 'PRO':
        return { 
          label: 'Pro', 
          className: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' 
        };
      case 'ENTERPRISE':
        return { 
          label: 'Enterprise', 
          className: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white' 
        };
      default:
        return null;
    }
  };

  const selectedWorkspace = workspaces.find(w => w.id === selectedWorkspaceId);

  return (
    <div className="w-full max-w-none">
      <div className="space-y-4 sm:space-y-6">
        {/* Responsive header */}
        <div className="border-b border-border pb-3 sm:pb-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            Workspace Settings
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Manage settings and permissions for your selected workspace
          </p>
        </div>

        {/* Responsive workspace selector */}
        <div className="space-y-3">
          <Select
            value={selectedWorkspaceId || ""}
            onValueChange={handleWorkspaceChange}
          >
            <SelectTrigger className="w-full border-0 bg-card hover:bg-accent/50 transition-colors p-3 sm:p-4 lg:p-7 rounded-lg shadow-sm min-h-[60px] sm:min-h-[80px]">
              <SelectValue>
                {selectedWorkspace ? (
                  <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                    {/* Responsive workspace icon */}
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                    </div>
                    
                    {/* Responsive workspace info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                        <span className="font-semibold text-foreground text-sm sm:text-base truncate">
                          {selectedWorkspace.name}
                        </span>
                        {getPlanConfig(selectedWorkspace.planType) && (
                          <Badge className={cn("text-xs font-medium px-1.5 sm:px-2 py-0.5 border-0 flex-shrink-0", getPlanConfig(selectedWorkspace.planType)?.className)}>
                            {getPlanConfig(selectedWorkspace.planType)?.label}
                          </Badge>
                        )}
                      </div>
                      
                      {/* Responsive metadata */}
                      <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
                        {/* Role */}
                        <div className={cn("flex items-center gap-1 flex-shrink-0", getRoleConfig(selectedWorkspace).className)}>
                          {React.createElement(getRoleIcon(selectedWorkspace), { className: "w-3 h-3" })}
                          <span className="font-medium">{getRoleConfig(selectedWorkspace).label}</span>
                        </div>
                        
                        {/* Member count - hide on very small screens */}
                        {selectedWorkspace.memberCount !== undefined && (
                          <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                            <Users2 className="w-3 h-3" />
                            <span className="hidden xs:inline">
                              {selectedWorkspace.memberCount} member{selectedWorkspace.memberCount !== 1 ? 's' : ''}
                              {selectedWorkspace.memberLimit && (
                                <span className="text-muted-foreground/70 hidden sm:inline"> of {selectedWorkspace.memberLimit}</span>
                              )}
                            </span>
                            <span className="xs:hidden">
                              {selectedWorkspace.memberCount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 border-dashed border-muted-foreground/25">
                      <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground/50" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-muted-foreground text-sm sm:text-base">Select Workspace</div>
                      <div className="text-xs text-muted-foreground/70 hidden sm:block">Choose a workspace to manage</div>
                    </div>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            
            {/* Responsive dropdown content */}
            <SelectContent className="w-full min-w-0 max-w-[95vw] sm:min-w-[300px] sm:max-w-[500px]">
              <div className="p-1 sm:p-2">
                {workspaces.length > 0 ? (
                  workspaces.map((workspace) => {
                    const roleConfig = getRoleConfig(workspace);
                    const planConfig = getPlanConfig(workspace.planType);
                    const RoleIcon = getRoleIcon(workspace);
                    
                    return (
                      <SelectItem 
                        key={workspace.id} 
                        value={workspace.id}
                        className="p-2 sm:p-3 lg:p-4 cursor-pointer hover:bg-accent rounded-lg mb-1 last:mb-0"
                      >
                        <div className="flex items-center gap-2 sm:gap-3 w-full min-w-0">
                          <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/10 border border-primary/20">
                            <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 sm:gap-2 mb-1 flex-wrap">
                              <span className="font-semibold text-sm truncate">{workspace.name}</span>
                              {planConfig && (
                                <Badge className={cn("text-xs font-medium px-1.5 sm:px-2 py-0.5 border-0 flex-shrink-0", planConfig.className)}>
                                  {planConfig.label}
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-2 sm:gap-4 text-xs flex-wrap">
                              <div className={cn("flex items-center gap-1 flex-shrink-0", roleConfig.className)}>
                                <RoleIcon className="w-3 h-3" />
                                <span className="font-medium">{roleConfig.label}</span>
                              </div>
                              
                              {workspace.memberCount !== undefined && (
                                <div className="flex items-center gap-1 text-muted-foreground flex-shrink-0">
                                  <Users2 className="w-3 h-3" />
                                  <span className="hidden xs:inline">
                                    {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
                                  </span>
                                  <span className="xs:hidden">
                                    {workspace.memberCount}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })
                ) : (
                  <div className="p-4 sm:p-8 text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center mx-auto mb-3">
                      <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-muted-foreground/50" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">No workspaces available</p>
                    <p className="text-xs text-muted-foreground/70 hidden sm:block">You don&#39;t have access to any workspaces yet</p>
                  </div>
                )}
              </div>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}