/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// components/chat/ChatInput.tsx
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ChatMessage } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  X, 
  Paperclip, 
  Image,
  FileText,
  AlertCircle,
  Check,
  Upload
} from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface ChatInputProps {
  onSendMessage: (content: string, attachments?: any[]) => Promise<void>;
  onTyping?: (isTyping: boolean) => void;
  replyingTo: ChatMessage | null;
  onCancelReply: () => void;
  disabled?: boolean;
  placeholder?: string;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  allowedFileTypes?: string[];
  workspaceId?: string;
  roomId?: string;
}

interface FileUpload {
  file: File;
  id: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  url?: string;
  fileId?: string;
  thumbnailUrl?: string;
  error?: string;
}

const EMOJI_SHORTCUTS = {
  ':)': '😊',
  ':D': '😃',
  ':(': '😢',
  ':P': '😛',
  ':o': '😮',
  ':/': '😕',
  '<3': '❤️',
  ':+1:': '👍',
  ':-1:': '👎',
};

export default function ChatInput({
  onSendMessage,
  onTyping,
  replyingTo,
  onCancelReply,
  disabled = false,
  placeholder = "Type your message...",
  maxFiles = 5,
  maxFileSize = 10, // 10MB
  allowedFileTypes = ['image/*', 'text/*', 'application/pdf', 'application/json'],
  workspaceId,
  roomId
}: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [textareaHeight, setTextareaHeight] = useState('auto');
  const [dragOver, setDragOver] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // Debounce typing state changes
  const debouncedIsTyping = useDebounce(isTyping, 500);
  
  // Auto-resize textarea
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 200; // Max height in pixels
      const newHeight = Math.min(scrollHeight, maxHeight);
      textareaRef.current.style.height = `${newHeight}px`;
      setTextareaHeight(`${newHeight}px`);
    }
  }, []);

  // Effect to send typing events
  useEffect(() => {
    if (onTyping) {
      onTyping(debouncedIsTyping);
    }
  }, [debouncedIsTyping, onTyping]);

  // Focus textarea when replying
  useEffect(() => {
    if (replyingTo && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [replyingTo]);

  // Auto-resize on message change
  useEffect(() => {
    adjustTextareaHeight();
  }, [message, adjustTextareaHeight]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && fileUploads.length === 0) || isSubmitting || disabled) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Get successful uploads
      const successfulUploads = fileUploads
        .filter(upload => upload.status === 'success')
        .map(upload => ({ 
          url: upload.url, 
          fileId: upload.fileId,
          name: upload.file.name, 
          type: upload.file.type,
          thumbnailUrl: upload.thumbnailUrl 
        }));
      
      await onSendMessage(message, successfulUploads);
      setMessage("");
      setFileUploads([]);
      setIsTyping(false);
      
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Auto-replace emoji shortcuts
    Object.entries(EMOJI_SHORTCUTS).forEach(([shortcut, emoji]) => {
      value = value.replace(new RegExp(shortcut.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), emoji);
    });
    
    setMessage(value);
    
    // Update typing state
    if (value.trim() && !isTyping) {
      setIsTyping(true);
    } else if (!value.trim() && isTyping) {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter (without Shift)
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSubmit(e);
    }
    
    // Escape to cancel reply
    if (e.key === "Escape" && replyingTo) {
      onCancelReply();
    }
  };

  const handleFileSelect = (files: FileList) => {
    const validFiles = Array.from(files).filter(file => {
      // Check file size
      if (file.size > maxFileSize * 1024 * 1024) {
        console.warn(`File ${file.name} is too large`);
        return false;
      }
      
      // Check file type
      const isValidType = allowedFileTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.replace('/*', '/'));
        }
        return file.type === type;
      });
      
      if (!isValidType) {
        console.warn(`File ${file.name} type not allowed`);
        return false;
      }
      
      return true;
    });

    // Check total file limit
    if (fileUploads.length + validFiles.length > maxFiles) {
      console.warn(`Cannot upload more than ${maxFiles} files`);
      return;
    }

    // Add files to upload queue
    const newUploads: FileUpload[] = validFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      progress: 0,
      status: 'pending'
    }));

    setFileUploads(prev => [...prev, ...newUploads]);
    
    // Start uploading files
    newUploads.forEach(upload => uploadFile(upload));
  };

  const uploadFile = async (upload: FileUpload) => {
    try {
      setFileUploads(prev => 
        prev.map(u => u.id === upload.id ? { ...u, status: 'uploading' } : u)
      );

      // Create FormData for the actual upload
      const formData = new FormData();
      formData.append('file', upload.file);
      
      // Add workspace and room context if available
      if (workspaceId) {
        formData.append('workspaceId', workspaceId);
      }
      if (roomId) {
        formData.append('roomId', roomId);
      }

      // Make the actual API call to your upload endpoint
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const result = await response.json();

      // Update the upload with success data
      setFileUploads(prev => 
        prev.map(u => u.id === upload.id ? { 
          ...u, 
          status: 'success', 
          progress: 100,
          url: result.fileUrl,
          fileId: result.fileId,
          thumbnailUrl: result.thumbnailUrl
        } : u)
      );

    } catch (error) {
      console.error('Upload error:', error);
      setFileUploads(prev => 
        prev.map(u => u.id === upload.id ? { 
          ...u, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : u)
      );
    }
  };

  const removeFile = (uploadId: string) => {
    setFileUploads(prev => prev.filter(u => u.id !== uploadId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const canSend = !isSubmitting && !disabled && (message.trim() || fileUploads.some(u => u.status === 'success'));

  return (
    <div className={cn(
      "border-t border-border bg-background transition-all duration-200",
      dragOver && "bg-primary/5 border-primary"
    )}>
      {/* Drag overlay */}
      {dragOver && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg flex items-center justify-center z-50">
          <div className="text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-sm font-medium">Drop files here to upload</p>
          </div>
        </div>
      )}

      <div 
        className="p-4"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Reply preview */}
        {replyingTo && (
          <div className="mb-3 p-3 bg-muted/50 rounded-lg border-l-4 border-primary flex justify-between items-start">
            <div className="flex-1">
              <div className="text-xs text-muted-foreground mb-1 font-medium">
                Replying to {replyingTo.user?.name || "Unknown"}
              </div>
              <div className="text-sm text-foreground/80 line-clamp-2">{replyingTo.content}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              onClick={onCancelReply}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* File uploads preview */}
        {fileUploads.length > 0 && (
          <div className="mb-3 space-y-2">
            {fileUploads.map((upload) => (
              <div
                key={upload.id}
                className="bg-muted/30 p-2 rounded-md flex items-center justify-between text-sm border"
              >
                <div className="flex items-center gap-2 flex-1">
                  {upload.file.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-500" />
                  ) : (
                    <FileText className="h-4 w-4 text-gray-500" />
                  )}
                  <span className="font-medium truncate max-w-32">{upload.file.name}</span>
                  <Badge variant={
                    upload.status === 'success' ? 'default' :
                    upload.status === 'error' ? 'destructive' :
                    'secondary'
                  } className="text-xs">
                    {upload.status === 'uploading' ? `${upload.progress}%` : upload.status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  {upload.status === 'uploading' && (
                    <Progress value={upload.progress} className="w-16 h-2" />
                  )}
                  {upload.status === 'success' && (
                    <Check className="h-4 w-4 text-green-500" />
                  )}
                  {upload.status === 'error' && (
                    <AlertCircle className="h-4 w-4 text-destructive" />
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => removeFile(upload.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-2">
          {/* Main input area */}
          <div className="flex items-end gap-2">
            <div className="flex-1 relative">
              <Textarea
                ref={textareaRef}
                value={message}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={placeholder}
                className={cn(
                  "min-h-[44px] py-3 pr-12 resize-none transition-all duration-200",
                  "placeholder:text-muted-foreground/60",
                  "scrollbar-hide overflow-y-auto", // Add these classes
                  disabled && "opacity-50 cursor-not-allowed"
                )}
                style={{
                  height: textareaHeight,
                  resize: 'none'
                }}
                disabled={disabled || isSubmitting}
                rows={1}
              />
              
              {/* Attach files button */}
              <div className="absolute bottom-2 right-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 hover:bg-muted"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={disabled}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Attach files</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Send button */}
            <Button
              type="submit"
              className={cn(
                "h-11 px-4 transition-all duration-200",
                canSend ? "bg-primary hover:bg-primary/90" : ""
              )}
              disabled={!canSend}
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  <span className="hidden sm:inline">Sending...</span>
                </div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* Character count and shortcuts hint */}
          <div className="flex justify-between items-center text-xs text-muted-foreground px-1">
            <span>Press Enter to send, Shift+Enter for new line</span>
            {message.length > 0 && (
              <span className={cn(
                message.length > 2000 ? "text-destructive" : "text-muted-foreground"
              )}>
                {message.length}/2000
              </span>
            )}
          </div>
        </form>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
          multiple
          accept={allowedFileTypes.join(',') || undefined}
        />
      </div>
    </div>
  );
}