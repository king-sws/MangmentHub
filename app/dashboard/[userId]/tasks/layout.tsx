// app/dashboard/[userId]/tasks/page.tsx
import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { TasksHeader } from "./_components/TasksHeader";
import { TasksTable } from "./_components/TasksTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Metadata } from "next";

// Metadata for SEO and social sharing
export const metadata: Metadata = {
  title: "Tasks | Blutto - Task Management Dashboard",
  description: "Manage and track your tasks efficiently across all projects with advanced filtering and organization tools.",
  keywords: ["task management", "productivity", "project management", "todo", "dashboard"],
  openGraph: {
    title: "Tasks - Blutto Dashboard",
    description: "Organize and manage your tasks with powerful filtering and tracking capabilities.",
    type: "website",
  },
  robots: {
    index: false, // Private dashboard pages shouldn't be indexed
    follow: false,
  },
};

// Enhanced mobile-first loading skeleton
function TasksLoadingSkeleton() {
  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Mobile-optimized header skeleton */}
      <div className="space-y-4 sm:space-y-0 sm:flex sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24 sm:h-8 sm:w-32" />
          <Skeleton className="h-3 w-48 sm:h-4 sm:w-64" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Skeleton className="h-8 w-20 sm:h-9 sm:w-24" />
          <Skeleton className="h-8 w-24 sm:h-9 sm:w-32" />
        </div>
      </div>

      {/* Stats skeleton - responsive grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-3 sm:p-4 bg-muted/30 rounded-lg border">
            <Skeleton className="h-4 w-4 mb-2" />
            <Skeleton className="h-5 w-8 mb-1" />
            <Skeleton className="h-3 w-16" />
          </div>
        ))}
      </div>

      {/* Search and filters skeleton */}
      <div className="space-y-3 p-3 sm:p-4 bg-muted/30 rounded-lg border">
        <Skeleton className="h-9 w-full sm:w-64" />
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-18" />
        </div>
      </div>

      {/* Mobile-first table skeleton */}
      <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
        <div className="p-3 sm:p-6">
          <div className="space-y-3 sm:space-y-4">
            {/* Mobile: Card-style skeleton */}
            <div className="block sm:hidden space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-4 w-4" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
            
            {/* Desktop: Table skeleton */}
            <div className="hidden sm:block">
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
              {Array.from({ length: 6 }).map((_, i) => (
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
        </div>
        
        {/* Pagination skeleton */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-3 sm:px-6 py-3 sm:py-4 border-t bg-muted/20">
          <Skeleton className="h-4 w-24 sm:w-32" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-16 sm:w-20" />
            <Skeleton className="h-4 w-12 sm:w-16" />
            <Skeleton className="h-8 w-12 sm:w-16" />
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
      {/* Responsive container with proper mobile spacing */}
      <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="py-4 sm:py-6 md:py-8 lg:py-10">
          <div className="space-y-4 sm:space-y-6 md:space-y-8">
            {/* Header section with mobile optimization */}
            <div className="space-y-1">
              <TasksHeader />
            </div>
            
            {/* Main content with enhanced responsive design */}
            <Suspense fallback={<TasksLoadingSkeleton />}>
              <div className="relative">
                {/* Responsive background pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.01] sm:from-primary/[0.02] via-transparent to-secondary/[0.01] sm:to-secondary/[0.02] rounded-xl sm:rounded-2xl" />
                
                <div className="relative">
                  <TasksTable userId={session.user.id} />
                </div>
              </div>
            </Suspense>
          </div>
        </div>
      </div>
      
      {/* Mobile-optimized footer */}
      <div className="border-t bg-muted/20">
        <div className="mx-auto max-w-[1400px] px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="py-3 sm:py-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center">
              <span className="hidden sm:inline">Manage your tasks efficiently with advanced filtering and organization tools</span>
              <span className="sm:hidden">Task management made simple</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}