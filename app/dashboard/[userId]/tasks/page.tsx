import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TasksHeader } from "./_components/TasksHeader";
import { TasksTable } from "./_components/TasksTable";
import { Skeleton } from "@/components/ui/skeleton";

// Professional loading skeleton component
function TasksLoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      {/* Filters skeleton */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 rounded-lg border">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-36" />
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border bg-card shadow-sm">
        <div className="p-6">
          <div className="space-y-4">
            {/* Table header */}
            <div className="grid grid-cols-6 gap-4 pb-3 border-b">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-4" />
            </div>
            
            {/* Table rows */}
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-6 gap-4 py-3">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-full max-w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-4 w-4" />
              </div>
            ))}
          </div>
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function TasksPage() {
  const session = await auth();
  
  if (!session?.user) {
    redirect("/sign-in");
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Professional container with proper spacing and constraints */}
      <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
        <div className="py-6 sm:py-8 lg:py-10">
          <div className="space-y-6 sm:space-y-8">
            {/* Header section */}
            <div className="space-y-1">
              <TasksHeader />
            </div>
            
            {/* Main content with enhanced loading state */}
            <Suspense fallback={<TasksLoadingSkeleton />}>
              <div className="relative">
                {/* Subtle background pattern for visual interest */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.02] via-transparent to-secondary/[0.02] rounded-2xl" />
                
                <div className="relative">
                  <TasksTable userId={session.user.id} />
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Subtle footer for brand consistency */}
      <div className="border-t bg-muted/20">
        <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <p className="text-xs text-muted-foreground text-center">
              Manage your tasks efficiently with advanced filtering and organization tools
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}