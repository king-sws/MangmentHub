"use client";

import { cn } from "@/lib/utils";

// Define the possible status values
type CardStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | string;

interface StatusBadgeProps {
  status: CardStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusConfig = (status: CardStatus) => {
    switch (status) {
      case "BACKLOG":
        return {
          label: "Backlog",
          bgColor: "bg-gray-100",
          textColor: "text-gray-800"
        };
      case "TODO":
        return {
          label: "To Do",
          bgColor: "bg-blue-100",
          textColor: "text-blue-800"
        };
      case "IN_PROGRESS":
        return {
          label: "In Progress",
          bgColor: "bg-yellow-100",
          textColor: "text-yellow-800"
        };
      case "IN_REVIEW":
        return {
          label: "In Review",
          bgColor: "bg-purple-100",
          textColor: "text-purple-800"
        };
      case "DONE":
        return {
          label: "Done",
          bgColor: "bg-green-100",
          textColor: "text-green-800"
        };
      default:
        return {
          label: status,
          bgColor: "bg-gray-100",
          textColor: "text-gray-800"
        };
    }
  };

  const { label, bgColor, textColor } = getStatusConfig(status);

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        bgColor,
        textColor
      )}
    >
      {label}
    </span>
  );
}