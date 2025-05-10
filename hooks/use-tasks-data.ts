"use client";

import { TaskWithDetails } from "@/app/dashboard/[userId]/tasks/_components/Types";
import { useState, useEffect, useCallback } from "react";

interface TasksFilters {
  status?: string;
  assigneeId?: string;
  projectId?: string;
  dueDate?: Date;
}

export const useTasksData = (userId: string, initialFilters: TasksFilters = {}) => {
  const [data, setData] = useState<TaskWithDetails[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TasksFilters>(initialFilters);

  const fetchTasks = useCallback(async (currentFilters: TasksFilters = {}) => {
    try {
      setIsLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      
      if (currentFilters.status) {
        params.append("status", currentFilters.status);
      }
      
      if (currentFilters.assigneeId) {
        params.append("assigneeId", currentFilters.assigneeId);
      }
      
      if (currentFilters.projectId) {
        params.append("projectId", currentFilters.projectId);
      }
      
      if (currentFilters.dueDate) {
        params.append("dueDate", currentFilters.dueDate.toISOString());
      }
      
      const response = await fetch(`/api/tasks?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch tasks");
      }
      
      const tasksData = await response.json();
      setData(tasksData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error occurred"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update filters and refetch data
  const updateFilters = useCallback((newFilters: TasksFilters) => {
    setFilters(prev => {
      const updatedFilters = { ...prev, ...newFilters };
      fetchTasks(updatedFilters);
      return updatedFilters;
    });
  }, [fetchTasks]);

  // Initial fetch
  useEffect(() => {
    if (userId) {
      fetchTasks(filters);
    }
  }, [userId, fetchTasks, filters]);

  return { 
    data, 
    isLoading, 
    error,
    filters,
    updateFilters,
    refetch: () => fetchTasks(filters)
  };
};