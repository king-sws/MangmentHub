"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CardStatus } from "@prisma/client";

interface StatusBadgeProps {
  status: CardStatus | string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "BACKLOG":
        return "bg-purple-100 text-purple-800 hover:bg-purple-100";
      case "TODO":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "IN_REVIEW":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "DONE":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const formatStatusText = (status: string) => {
    return status
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <Badge
      variant="outline"
      className={cn(
        "border-0 font-normal",
        getStatusColor(status)
      )}
    >
      {formatStatusText(status)}
    </Badge>
  );
}