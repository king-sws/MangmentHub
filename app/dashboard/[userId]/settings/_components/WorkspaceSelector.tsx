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
    <div className="space-y-6">
      {/* Clean header with context */}
      <div className="border-b border-border pb-4">
        <h2 className="text-lg font-semibold text-foreground">Workspace Settings</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage settings and permissions for your selected workspace
        </p>
      </div>

      {/* Workspace selector */}
      <div className="space-y-3">
        <Select
          value={selectedWorkspaceId || ""}
          onValueChange={handleWorkspaceChange}
        >
          <SelectTrigger className="w-full border-0 bg-card hover:bg-accent/50 transition-colors p-7 rounded-lg shadow-sm">
            <SelectValue>
              {selectedWorkspace ? (
                <div className="flex items-center gap-3 w-full">
                  {/* Workspace icon */}
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                    <Building2 className="w-5 h-5 text-primary" />
                  </div>
                  
                  {/* Workspace info */}
                  <div className="flex-1 text-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">
                        {selectedWorkspace.name}
                      </span>
                      {getPlanConfig(selectedWorkspace.planType) && (
                        <Badge className={cn("text-xs font-medium px-2 py-0.5 border-0", getPlanConfig(selectedWorkspace.planType)?.className)}>
                          {getPlanConfig(selectedWorkspace.planType)?.label}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs">
                      {/* Role */}
                      <div className={cn("flex items-center gap-1", getRoleConfig(selectedWorkspace).className)}>
                        {React.createElement(getRoleIcon(selectedWorkspace), { className: "w-3 h-3" })}
                        <span className="font-medium">{getRoleConfig(selectedWorkspace).label}</span>
                      </div>
                      
                      {/* Member count */}
                      {selectedWorkspace.memberCount !== undefined && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users2 className="w-3 h-3" />
                          <span>
                            {selectedWorkspace.memberCount} member{selectedWorkspace.memberCount !== 1 ? 's' : ''}
                            {selectedWorkspace.memberLimit && (
                              <span className="text-muted-foreground/70"> of {selectedWorkspace.memberLimit}</span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-muted-foreground/25">
                    <Building2 className="w-5 h-5 text-muted-foreground/50" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-muted-foreground">Select Workspace</div>
                    <div className="text-xs text-muted-foreground/70">Choose a workspace to manage</div>
                  </div>
                </div>
              )}
            </SelectValue>
          </SelectTrigger>
          
          <SelectContent className="w-full min-w-[400px]">
            <div className="p-2">
              {workspaces.length > 0 ? (
                workspaces.map((workspace) => {
                  const roleConfig = getRoleConfig(workspace);
                  const planConfig = getPlanConfig(workspace.planType);
                  const RoleIcon = getRoleIcon(workspace);
                  
                  return (
                    <SelectItem 
                      key={workspace.id} 
                      value={workspace.id}
                      className="p-4 cursor-pointer hover:bg-accent rounded-lg mb-1 last:mb-0"
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 border border-primary/20">
                          <Building2 className="w-5 h-5 text-primary" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-sm">{workspace.name}</span>
                            {planConfig && (
                              <Badge className={cn("text-xs font-medium px-2 py-0.5 border-0", planConfig.className)}>
                                {planConfig.label}
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-4 text-xs">
                            <div className={cn("flex items-center gap-1", roleConfig.className)}>
                              <RoleIcon className="w-3 h-3" />
                              <span className="font-medium">{roleConfig.label}</span>
                            </div>
                            
                            {workspace.memberCount !== undefined && (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Users2 className="w-3 h-3" />
                                <span>
                                  {workspace.memberCount} member{workspace.memberCount !== 1 ? 's' : ''}
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
                <div className="p-8 text-center">
                  <div className="w-12 h-12 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/25 flex items-center justify-center mx-auto mb-3">
                    <Building2 className="w-6 h-6 text-muted-foreground/50" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">No workspaces available</p>
                  <p className="text-xs text-muted-foreground/70">You don&#39;t have access to any workspaces yet</p>
                </div>
              )}
            </div>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}