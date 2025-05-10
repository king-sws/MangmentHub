"use client";

import { useState, useEffect } from "react";
import { Board } from "@prisma/client";

export const useBoards = () => {
  const [data, setData] = useState<Board[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchBoards = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/boards");
        
        if (!response.ok) {
          throw new Error("Failed to fetch boards");
        }
        
        const boardsData = await response.json();
        setData(boardsData);
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error occurred"));
      } finally {
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, []);

  return { data, isLoading, error };
};