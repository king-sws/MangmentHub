// DndWrapper.tsx
"use client";

import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";

interface DndWrapperProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export function DndWrapper({ 
  children, 
  loadingMessage = "Loading board..." 
}: DndWrapperProps) {
  const [isClient, setIsClient] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Handle initial client rendering
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Add a slight delay to ensure smooth hydration
  useEffect(() => {
    if (isClient) {
      const timer = setTimeout(() => {
        setIsHydrated(true);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isClient]);

  if (!isClient || !isHydrated) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        <span className="mt-4 text-lg text-blue-500 font-medium">{loadingMessage}</span>
      </div>
    );
  }

  return <>{children}</>;
}