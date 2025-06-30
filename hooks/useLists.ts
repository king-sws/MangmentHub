
// hooks/useLists.ts
import { useState, useEffect } from 'react';

interface List {
  id: string;
  title: string;
  boardId: string;
  position?: number;
  // Add other list properties as needed
}

export function useLists(boardId?: string) {
  const [lists, setLists] = useState<List[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!boardId) {
      setLists([]);
      setError(null);
      return;
    }

    async function fetchLists() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Based on your API structure, you might need to get the full board data
        // which might include lists, or create a specific endpoint for lists
        const response = await fetch(`/api/board/${boardId}/full`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch board data: ${response.statusText}`);
        }
        
        const boardData = await response.json();
        
        // Extract lists from the board data
        if (boardData.lists && Array.isArray(boardData.lists)) {
          setLists(boardData.lists);
        } else if (boardData.data && boardData.data.lists && Array.isArray(boardData.data.lists)) {
          setLists(boardData.data.lists);
        } else {
          // If no lists property, you might need to create a specific endpoint
          console.warn('No lists found in board data. You might need to create a specific lists endpoint');
          setLists([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch lists';
        setError(errorMessage);
        setLists([]);
        console.error('Error fetching lists for board', boardId, ':', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLists();
  }, [boardId]);

  return { lists, isLoading, error };
}