/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";

// Define board type
export interface Board {
  id: string;
  title: string;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  // Add additional fields based on your API response
  totalCards?: number;
  totalLists?: number;
  _count?: {
    lists: number;
  };
  lists?: any[];
}

interface UseBoards {
  boards: Board[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useBoards(): UseBoards {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchBoards() {
      try {
        setIsLoading(true);
        setError(null);
        
        // First, fetch the user's active workspace
        const workspaceResponse = await fetch('/api/workspaces/active');
        
        if (!workspaceResponse.ok) {
          throw new Error("Failed to fetch active workspace");
        }
        
        const workspace = await workspaceResponse.json();
        
        // Then fetch boards for that workspace
        const boardsResponse = await fetch(`/api/board?workspaceId=${workspace.id}`, {
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!boardsResponse.ok) {
          const errorText = await boardsResponse.text();
          throw new Error(`Failed to fetch boards: ${boardsResponse.status} ${errorText}`);
        }
        
        const boardsData = await boardsResponse.json();
        
        // Check if the response has the expected structure
        if (boardsData.success && Array.isArray(boardsData.data)) {
          setBoards(boardsData.data);
        } else if (Array.isArray(boardsData)) {
          // Fallback in case the API returns array directly
          setBoards(boardsData);
        } else {
          console.error("Invalid boards data format:", boardsData);
          throw new Error("Received invalid data format for boards");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching boards:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoards();
  }, [refreshKey]);

  const refetch = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return { boards, isLoading, error, refetch };
}