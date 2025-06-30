"use client";

import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TypingIndicatorProps {
  typingUsers: { id: string; name: string; image?: string }[];
}

export default function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  // Don't show anything if no one is typing
  if (typingUsers.length === 0) {
    return null;
  }

  // Create typing text based on who is typing
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const typingText = useMemo(() => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].name} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers[2].name} are typing...`;
    } else {
      return `${typingUsers[0].name}, ${typingUsers[1].name}, and ${typingUsers.length - 2} others are typing...`;
    }
  }, [typingUsers]);

  return (
    <div className="flex items-center gap-1.5 text-xs p-2 text-muted-foreground">
      <div className="flex -space-x-2">
        {typingUsers.slice(0, 3).map((user) => (
          <Avatar key={user.id} className="h-5 w-5 border border-background">
            <AvatarImage src={user.image || ""} alt={user.name} />
            <AvatarFallback className="text-[8px] bg-primary/10">
              {user.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ))}
      </div>
      <div className="flex items-center">
        <span className="mr-1">{typingText}</span>
        <span className="flex space-x-1">
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0ms]"></span>
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:150ms]"></span>
          <span className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:300ms]"></span>
        </span>
      </div>
    </div>
  );
}