"use client";

import { useState, useEffect } from "react";
import { List } from "@prisma/client";

export const useLists = (boardId: string | undefined) => {
  const [data, setData] = useState<List[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchLists = async () => {
      if (!boardId) {
        setData(null);
        return;
      }
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/boards/${boardId}/lists`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch lists");
        }
        
        const listsData = await response.json();
        setData(listsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchLists();
  }, [boardId]);

  return { data, isLoading, error };
};