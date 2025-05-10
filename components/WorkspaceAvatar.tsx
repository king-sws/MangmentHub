/* eslint-disable @typescript-eslint/no-unused-vars */
// app/workspace/[workspaceId]/_components/WorkspaceAvatar.tsx
"use client";

import { cn } from "@/lib/utils";
import { Briefcase } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface WorkspaceAvatarProps {
  name: string;
  imageUrl?: string | null;
  className?: string;
}

/**
 * Get a consistent color based on workspace name
 */
const getColorFromName = (name: string): string => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-amber-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-red-500",
    "bg-teal-500",
  ];
  
  // Simple hash function to get consistent color from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Get color from hash
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export function WorkspaceAvatar({ name, imageUrl, className }: WorkspaceAvatarProps) {
  // Get first letter of workspace name
  const firstLetter = name ? name.charAt(0).toUpperCase() : "W";
  
  // Get color based on name
  const colorClass = getColorFromName(name);

  return (
    <Avatar className={cn("rounded-md", className)}>
      {imageUrl ? (
        <img src={imageUrl} alt={name} className="object-cover" />
      ) : (
        <AvatarFallback className={cn("rounded-md flex items-center justify-center", colorClass)}>
          <span className="sr-only">{name}</span>
          <Briefcase className="h-1/2 w-1/2 text-white" />
        </AvatarFallback>
      )}
    </Avatar>
  );
}