"use client";

import { TaskWithDetails } from "@/app/dashboard/[userId]/tasks/_components/Types";
import { useState, useEffect, useCallback, useRef } from "react";

interface TasksFilters {
  status?: string;
  assigneeId?: string;
  projectId?: string;
  dueDate?: Date;
  search?: string;
}

export const useTasksData = (userId: string, initialFilters: TasksFilters = {}) => {
  const [data, setData] = useState<TaskWithDetails[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [filters, setFilters] = useState<TasksFilters>(initialFilters);
  
  // Use ref to avoid dependency issues
  const currentFiltersRef = useRef<TasksFilters>(initialFilters);

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
      
      if (currentFilters.search) {
        params.append("search", currentFilters.search);
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

  // Update filters without causing re-fetch loop
  const updateFilters = useCallback((newFilters: TasksFilters) => {
    const updatedFilters = { ...currentFiltersRef.current, ...newFilters };
    currentFiltersRef.current = updatedFilters;
    setFilters(updatedFilters);
    fetchTasks(updatedFilters);
  }, [fetchTasks]);

  // Refetch with current filters
  const refetch = useCallback(() => {
    fetchTasks(currentFiltersRef.current);
  }, [fetchTasks]);

  // Update task in local state without refetching
// Enhanced updateTaskInState function
const updateTaskInState = useCallback((taskId: string, updates: Partial<TaskWithDetails>) => {
  setData(prevData => {
    if (!prevData) return prevData;
    
    const taskExists = prevData.some(task => task.id === taskId);
    if (!taskExists) {
      console.warn(`Task with ID ${taskId} not found in current data`);
      return prevData;
    }
    
    return prevData.map(task =>
      task.id === taskId
        ? { ...task, ...updates }
        : task
    );
  });
}, []);

// Also add a function to revert a task update
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const revertTaskUpdate = useCallback((taskId: string, originalTask: TaskWithDetails) => {
  setData(prevData => {
    if (!prevData) return prevData;
    
    return prevData.map(task =>
      task.id === taskId
        ? originalTask
        : task
    );
  });
}, []);
  // Initial fetch - only run once when userId changes
  useEffect(() => {
    if (userId) {
      fetchTasks(currentFiltersRef.current);
    }
  }, [userId, fetchTasks]);

  return { 
    data, 
    isLoading, 
    error,
    filters,
    updateFilters,
    refetch,
    updateTaskInState
  };
};