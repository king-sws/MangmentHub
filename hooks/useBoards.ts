// hooks/useBoards.ts
import { useState, useEffect } from 'react';

interface Board {
  id: string;
  title: string;
  description?: string;
  // Add other board properties as needed
}

export function useBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBoards() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Based on your API structure, you might need to get boards from a user endpoint
        // or you might need to create a specific endpoint for listing all boards
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const possibleEndpoints = [
          '/api/board', // Standard endpoint if you create one
        ];
        
        let response;
        let data = [];
        
        // Try the recent-boards endpoint first
        try {
          response = await fetch('/api/board');
          if (response.ok) {
            data = await response.json();
          }
        } catch (err) {
          console.error('Error fetching from recent-boards:', err);
        }
        
        // If recent-boards doesn't work or returns empty, you might need to
        // create a new endpoint or handle this differently
        if (!data || data.length === 0) {
          // You might need to create an endpoint to list all boards
          // For now, we'll return an empty array
          console.warn('No boards found. You might need to create a /api/boards endpoint');
          setBoards([]);
          return;
        }
        
        // Handle different response formats
        if (Array.isArray(data)) {
          setBoards(data);
        } else if (data.boards && Array.isArray(data.boards)) {
          setBoards(data.boards);
        } else if (data.data && Array.isArray(data.data)) {
          setBoards(data.data);
        } else {
          setBoards([]);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch boards';
        setError(errorMessage);
        setBoards([]);
        console.error('Error fetching boards:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchBoards();
  }, []);

  return { boards, isLoading, error };
}
