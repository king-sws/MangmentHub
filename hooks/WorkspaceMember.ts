"use client";

import { useState, useEffect } from "react";

interface User {
  id: string;
  name: string | null;
  email: string | null;
}

interface WorkspaceMember {
  id: string;
  userId: string;
  workspaceId: string;
  role: string;
  user: User;
}

export const useWorkspaceMembers = (workspaceId: string | undefined) => {
  const [data, setData] = useState<WorkspaceMember[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      if (!workspaceId) {
        setData(null);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/workspaces/${workspaceId}/members`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch workspace members");
        }
        
        const membersData = await response.json();
        setData(membersData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [workspaceId]);

  return { data, isLoading, error };
};