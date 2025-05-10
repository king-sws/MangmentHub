'use client';

import { Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton for the board page that displays a placeholder UI
 * while the board data is being fetched
 */
export function BoardSkeleton() {
  return (
    <div className="h-full w-full p-4">
      {/* Board header skeleton */}
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-8 w-64" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      
      {/* Lists skeleton */}
      <div className="flex items-start gap-3 h-full overflow-x-auto pb-4">
        {Array(3).fill(0).map((_, index) => (
          <div 
            key={index} 
            className="bg-gray-100 dark:bg-slate-800 rounded-md w-72 shrink-0 h-[calc(100vh-10rem)]"
          >
            {/* List header skeleton */}
            <div className="p-3 flex justify-between items-center">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
            
            {/* Card skeletons */}
            <div className="px-2 pb-2">
              {Array(Math.floor(Math.random() * 4) + 2).fill(0).map((_, cardIndex) => (
                <div 
                  key={cardIndex} 
                  className="bg-white dark:bg-slate-900 p-3 mb-2 rounded-md shadow-sm"
                >
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <div className="flex justify-between items-center mt-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-6 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Add card button skeleton */}
            <div className="p-2">
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        ))}
        
        {/* Add list button skeleton */}
        <div className="bg-gray-50 dark:bg-slate-800/60 rounded-md w-72 h-12 shrink-0 flex items-center justify-center">
          <Skeleton className="h-8 w-40" />
        </div>
      </div>
      
      {/* Loading spinner */}
      <div className="fixed bottom-4 right-4 bg-white dark:bg-slate-800 p-2 rounded-full shadow-lg">
        <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    </div>
  );
}