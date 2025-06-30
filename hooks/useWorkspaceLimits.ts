// hooks/useWorkspaceLimits.ts
"use client";

import { useState, useEffect } from "react";
import { PlanType } from "@/lib/plans";

interface WorkspaceLimitsData {
  members: WorkspaceMember[];
  invitations: Invitation[];
  currentUserRole: string;
  memberLimit: number;
  currentMemberCount: number;
  canInviteMore: boolean;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  user: {
    id: string;
    name: string | null;
    email: string | null;
  };
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  workspaceId: string;
  expiresAt: string;
}

interface MemberLimitError {
  error: string;
  code?: string;
  currentCount?: number;
  limit?: number;
  plan?: PlanType;
  pendingCount?: number;
}

export const useWorkspaceLimits = (workspaceId: string | undefined) => {
  const [data, setData] = useState<WorkspaceLimitsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = async () => {
    if (!workspaceId) {
      setData(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/workspaces/${workspaceId}/members`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch workspace data");
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  // Function to invite a member with limit checking
  const inviteMember = async (email: string, role: string = "MEMBER") => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required");
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle member limit exceeded
        if (response.status === 402) {
          const limitError: MemberLimitError = result;
          throw new Error(limitError.error);
        }
        throw new Error(result.error || "Failed to invite member");
      }

      // Refresh data after successful invitation
      await fetchData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to remove a member
  const removeMember = async (memberId: string) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required");
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ memberId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to remove member");
      }

      // Refresh data after successful removal
      await fetchData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to cancel an invitation
  const cancelInvitation = async (invitationId: string) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required");
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ invitationId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to cancel invitation");
      }

      // Refresh data after successful cancellation
      await fetchData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Function to update member role
  const updateMemberRole = async (userId: string, role: string) => {
    if (!workspaceId) {
      throw new Error("Workspace ID is required");
    }

    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/members`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId, role }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to update member role");
      }

      // Refresh data after successful update
      await fetchData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  // Helper functions
  const canInviteMembers = () => {
    if (!data) return false;
    return data.canInviteMore && ["OWNER", "ADMIN"].includes(data.currentUserRole);
  };

  const getRemainingSlots = () => {
    if (!data) return 0;
    return Math.max(0, data.memberLimit - data.currentMemberCount);
  };

  const getTotalUsedSlots = () => {
    if (!data) return 0;
    return data.currentMemberCount + data.invitations.length;
  };

  const isAtLimit = () => {
    if (!data) return false;
    return getTotalUsedSlots() >= data.memberLimit;
  };

  return {
    // Data
    data,
    isLoading,
    error,
    
    // Actions
    inviteMember,
    removeMember,
    cancelInvitation,
    updateMemberRole,
    refreshData: fetchData,
    
    // Helper functions
    canInviteMembers,
    getRemainingSlots,
    getTotalUsedSlots,
    isAtLimit,
    
    // Computed values
    members: data?.members || [],
    invitations: data?.invitations || [],
    memberLimit: data?.memberLimit || 0,
    currentMemberCount: data?.currentMemberCount || 0,
    currentUserRole: data?.currentUserRole || "MEMBER",
  };
};