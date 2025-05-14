"use client";

import { useState, useEffect } from "react";

// Define list type
export interface List {
  id: string;
  title: string;
  boardId: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface UseLists {
  lists: List[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void; // Added refetch function
}

export function useLists(boardId?: string): UseLists {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0); // Added for manual refetching

  useEffect(() => {
    async function fetchLists() {
      // Don't fetch if no boardId provided
      if (!boardId) {
        setLists([]);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null); // Reset error state before fetching
        
        const response = await fetch(`/api/lists?boardId=${boardId}`, {
          // Add cache: no-store to prevent stale data
          cache: 'no-store',
          next: { revalidate: 0 }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch lists: ${response.status} ${errorText}`);
        }
        
        const listsData = await response.json();
        
        // Verify the response is an array
        if (!Array.isArray(listsData)) {
          console.error("Invalid lists data format:", listsData);
          throw new Error("Received invalid data format for lists");
        }
        
        setLists(listsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching lists:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLists();
  }, [boardId, refreshKey]); // Added refreshKey dependency

  // Manual refetch function
  const refetch = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return { lists, isLoading, error, refetch };
}