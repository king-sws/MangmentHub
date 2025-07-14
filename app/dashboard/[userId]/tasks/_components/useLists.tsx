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
  _count?: {
    cards: number;
  };
}

interface UseLists {
  lists: List[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLists(boardId?: string): UseLists {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchLists() {
      // Don't fetch if no boardId provided
      if (!boardId) {
        setLists([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch(`/api/lists?boardId=${boardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch lists: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        
        // Handle the response format from your API
        // Your API returns { lists: [...], permissions: {...}, userRole: '...' }
        if (data && typeof data === 'object' && data.lists && Array.isArray(data.lists)) {
          setLists(data.lists);
        } else if (Array.isArray(data)) {
          // Fallback if API returns direct array
          setLists(data);
        } else {
          console.error("Invalid lists data format:", data);
          console.error("Expected format: { lists: [...] } or [...]");
          throw new Error("Received invalid data format for lists");
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)));
        console.error("Error fetching lists:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLists();
  }, [boardId, refreshKey]);

  // Manual refetch function
  const refetch = () => {
    setRefreshKey(prevKey => prevKey + 1);
  };

  return { lists, isLoading, error, refetch };
}