/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/chat/ChatMessage.tsx - Fixed read receipts integration
"use client";

import { useState, useEffect } from "react";
import { ChatMessage as ChatMessageType } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Reply, 
  MoreHorizontal, 
  Trash, 
  Edit,
  AlignCenter,
  Check,
  X,
  Download,
  CheckCheck, // For read receipts
  Eye // For read receipts
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/hooks/useAuth";

// Enhanced read receipt interface
interface ReadReceipt {
  userId: string;
  userName: string;
  readAt: Date;
}

interface EnhancedChatMessageType extends ChatMessageType {
  readBy?: ReadReceipt[];
  deliveredTo?: string[];
}

interface ChatMessageProps {
  message: EnhancedChatMessageType;
  onReplyToMessage: (message: ChatMessageType) => void;
  workspaceId: string;
  roomId: string;
  onUpdateMessage?: (messageId: string, content: string) => Promise<any>;
  onDeleteMessage?: (messageId: string) => Promise<any>;
  // Fixed: Align with ChatMessageList props
  onMarkAsRead?: (messageId: string) => void;
  currentUserId?: string;
  isMessageReadByUser?: (messageId: string, userId: string) => boolean;
}

export default function ChatMessage({
  message,
  onReplyToMessage,
  workspaceId,
  roomId,
  onUpdateMessage,
  onDeleteMessage,
  onMarkAsRead,
  currentUserId,
  isMessageReadByUser
}: ChatMessageProps) {
  const { user } = useAuth();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(message.content);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Use currentUserId prop or fallback to user.id
  const effectiveUserId = currentUserId || user?.id;
  
  // Check if the current user is the message author
  const isAuthor = effectiveUserId === message.userId;

  // Removed duplicate intersection observer - this is now handled by ChatMessageList
  // The visibility tracking and read marking is handled at the list level

  const handleDeleteMessage = async () => {
    if (!onDeleteMessage) return;
    
    try {
      setIsDeleting(true);
      await onDeleteMessage(message.id);
    } catch (error) {
      console.error("Error deleting message:", error);
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  const handleUpdateMessage = async () => {
    if (!onUpdateMessage || editedContent.trim() === message.content) {
      setIsEditing(false);
      return;
    }

    try {
      setIsUpdating(true);
      await onUpdateMessage(message.id, editedContent);
    } catch (error) {
      console.error("Error updating message:", error);
    } finally {
      setIsUpdating(false);
      setIsEditing(false);
    }
  };

  const cancelEdit = () => {
    setEditedContent(message.content);
    setIsEditing(false);
  };

  // Handle system messages differently
  if (message.isSystemMessage) {
    return (
      <div className="py-2 px-4 rounded-md bg-muted/50 text-center text-sm text-muted-foreground mx-auto max-w-md my-2">
        {message.content}
      </div>
    );
  }

  // Format timestamp
  const timestamp = formatDistanceToNow(new Date(message.createdAt), { addSuffix: true });

  // Handle reply rendering
  const hasReply = message.replyTo !== null;

  // Determine message position styles
  const messagePositionClass = isAuthor 
    ? "ml-auto bg-primary text-primary-foreground" 
    : "mr-auto bg-muted";

  // Read receipt helpers - use both message.readBy and isMessageReadByUser function
  const readCount = message.readBy?.length || 0;
  const isRead = readCount > 0;
  
  // Check if current user has read this message using both methods for reliability
  const readByCurrentUser = effectiveUserId && (
    message.readBy?.some(receipt => receipt.userId === effectiveUserId) ||
    (isMessageReadByUser && isMessageReadByUser(message.id, effectiveUserId))
  );

  // Format read receipt tooltip
  const readReceiptTooltip = message.readBy && message.readBy.length > 0
    ? message.readBy.map(receipt => 
        `${receipt.userId === effectiveUserId ? 'You' : receipt.userName} - ${new Date(receipt.readAt).toLocaleTimeString()}`
      ).join('\n')
    : '';

  return (
    <div className="group relative mb-1 flex items-end">
      {/* Avatar - Always show for non-authored messages */}
      {!isAuthor && (
        <div className="mr-2 flex-shrink-0 mb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={message.user?.image || ""} alt={message.user?.name || "User"} />
            <AvatarFallback>
              {message.user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}
      
      <div className={`flex flex-col max-w-[70%] ${isAuthor ? "items-end" : "items-start"}`}>
        {/* Username for non-authored messages */}
        {!isAuthor && (
          <div className="text-xs font-medium text-muted-foreground mb-1 ml-1">
            {message.user?.name || "Unknown User"}
          </div>
        )}

        {/* Reply reference */}
        {hasReply && message.replyTo && (
          <div className={`px-2 py-1 mb-1 rounded-t-lg bg-muted/70 ${isAuthor ? "rounded-l-lg mr-1" : "rounded-r-lg ml-1"} text-xs border-l-2 border-primary`}>
            <div className="font-medium text-primary">
              {message.replyTo.user.id === effectiveUserId ? "You" : message.replyTo.user?.name || "Unknown"}
            </div>
            <div className="truncate max-w-[250px] text-muted-foreground">
              {message.replyTo.content}
            </div>
          </div>
        )}

        {/* Message content */}
        {isEditing ? (
          <div className={`${isAuthor ? "ml-auto" : "mr-auto"} w-full`}>
            <Textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="min-h-10 mb-2"
              autoFocus
            />
            <div className="flex justify-end space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={cancelEdit}
                disabled={isUpdating}
              >
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={handleUpdateMessage}
                disabled={isUpdating || editedContent.trim() === message.content}
              >
                <Check className="h-4 w-4 mr-1" /> Save
              </Button>
            </div>
          </div>
        ) : (
          <div className={`relative rounded-lg px-3 py-2 shadow-sm ${messagePositionClass} ${hasReply ? "rounded-tl-sm" : "rounded-tl-lg"} ${isAuthor ? "rounded-bl-lg rounded-tr-lg rounded-br-sm" : "rounded-bl-sm rounded-tr-sm rounded-br-lg"}`}>
            <div className="text-sm break-words whitespace-pre-wrap">
              {message.content}
            </div>
            
            {/* Message time indicator with read receipts */}
            <div className={`text-xs ${isAuthor ? "text-primary-foreground/80" : "text-muted-foreground"} mt-1 flex items-center gap-1 justify-end`}>
              {message.isEdited && <span>(edited)</span>}
              <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              
              {/* Read receipt indicators for author */}
              {isAuthor && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <div className="flex items-center gap-1">
                        {isRead ? (
                          <CheckCheck className={`h-3 w-3 ${readCount > 1 ? 'text-blue-400' : 'text-primary-foreground/60'}`} />
                        ) : (
                          <Check className="h-3 w-3 text-primary-foreground/40" />
                        )}
                        {readCount > 0 && (
                          <span className="text-xs">{readCount}</span>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      {readCount > 0 ? (
                        <div className="text-xs whitespace-pre-line">
                          Read by:<br />
                          {readReceiptTooltip}
                        </div>
                      ) : (
                        <div className="text-xs">Delivered</div>
                      )}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>

            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {message.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="relative group/attachment"
                  >
                    {attachment.fileType.startsWith("image/") ? (
                      <div className="relative">
                        <img
                          src={attachment.fileUrl}
                          alt={attachment.fileName}
                          className="max-h-40 rounded-md object-cover"
                        />
                        <a
                          href={attachment.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute top-1 right-1 bg-black/50 rounded-full p-1 opacity-0 group-hover/attachment:opacity-100 transition-opacity"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-white" />
                        </a>
                      </div>
                    ) : (
                      <a
                        href={attachment.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center bg-background/60 p-2 rounded-md hover:bg-background/80 transition"
                      >
                        <AlignCenter className="h-4 w-4 mr-2" />
                        <span className="text-sm truncate max-w-[200px]">{attachment.fileName}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Author avatar (right side) */}
      {isAuthor && (
        <div className="ml-2 flex-shrink-0 mb-1">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.image || ""} alt={user?.name || "You"} />
            <AvatarFallback>
              {user?.name?.charAt(0) || "Y"}
            </AvatarFallback>
          </Avatar>
        </div>
      )}

      {/* Action buttons - only shown on hover */}
      <div className={`absolute ${isAuthor ? "left-0" : "right-0"} top-0 hidden group-hover:flex items-center space-x-1`}>
        {/* Reply button */}
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 rounded-full bg-background/90 shadow-sm hover:bg-background/90"
          onClick={() => onReplyToMessage(message)}
        >
          <Reply className="h-3.5 w-3.5" />
        </Button>

        {/* Edit/Delete dropdown only for author */}
        {isAuthor && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-full bg-background/90 shadow-sm hover:bg-background/90">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={isAuthor ? "start" : "end"} className="w-32">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteMessage}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}