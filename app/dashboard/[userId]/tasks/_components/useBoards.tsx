"use client";

import { useState, useEffect } from "react";

// Define board type
export interface Board {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
}

interface UseBoards {
  boards: Board[];
  isLoading: boolean;
  error: Error | null;
}

export function useBoards(): UseBoards {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchBoards() {
      try {
        setIsLoading(true);
        
        // First, fetch the user's active workspace
        const workspaceResponse = await fetch('/api/workspaces/active');
        
        if (!workspaceResponse.ok) {
          throw new Error("Failed to fetch active workspace");
        }
        
        const workspace = await workspaceResponse.json();
        
        // Then fetch boards for that workspace
        const boardsResponse = await fetch(`/api/board?workspaceId=${workspace.id}`);
        
        if (!boardsResponse.ok) {
          throw new Error("Failed to fetch boards");
        }
        
        const boardsData = await boardsResponse.json();
        setBoards(boardsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching boards:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoards();
  }, []);

  return { boards, isLoading, error };
}