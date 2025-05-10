import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format as fnsFormat } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return fnsFormat(dateObj, "MMM d, yyyy");
}