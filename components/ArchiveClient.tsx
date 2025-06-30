/* eslint-disable react/no-unescaped-entities */
// components/ArchiveClient.tsx
"use client";

import { useState } from "react";
import { Archive, Loader2, CheckCircle, XCircle, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "./ui/button";
import { toast } from "sonner";

interface ArchiveClientProps {
  boardId: string;
  boardTitle: string;
  isArchived: boolean;
  workspaceId: string;
}

export function ArchiveClient({ 
  boardId, 
  boardTitle, 
  isArchived, 
  workspaceId 
}: ArchiveClientProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const router = useRouter();

  const handleArchive = async () => {
    setIsProcessing(true);
    setStatus('idle');

    try {
      const method = isArchived ? 'DELETE' : 'POST';
      const response = await fetch(`/api/board/${boardId}/archive`, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `${isArchived ? 'Restore' : 'Archive'} failed`);
      }

      if (data.success) {
        setStatus('success');
        toast(`Board ${isArchived ? 'Restored' : 'Archived'}`);

        // Redirect to workspace after a short delay
        setTimeout(() => {
          router.push(`/workspace/${workspaceId}`);
        }, 1500);
      }
    } catch (error) {
      console.error('Archive/Restore error:', error);
      setStatus('error');
      toast(`${isArchived ? 'Restore' : 'Archive'} Failed`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            disabled={isProcessing || status === 'success'}
            variant={isArchived ? "default" : "destructive"}
            className={isArchived 
              ? "bg-green-600 hover:bg-green-700 text-white" 
              : "bg-orange-600 hover:bg-orange-700 text-white"
            }
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {isArchived ? 'Restoring...' : 'Archiving...'}
              </>
            ) : isArchived ? (
              <>
                <RotateCcw className="w-4 h-4 mr-2" />
                Restore Board
              </>
            ) : (
              <>
                <Archive className="w-4 h-4 mr-2" />
                Archive Board
              </>
            )}
          </Button>
        </AlertDialogTrigger>
        
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isArchived ? 'Restore Board?' : 'Archive Board?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isArchived ? (
                <>
                  Are you sure you want to restore "<strong>{boardTitle}</strong>"? 
                  This will make the board active again and visible in your workspace.
                </>
              ) : (
                <>
                  Are you sure you want to archive "<strong>{boardTitle}</strong>"? 
                  This will mark the board as completed and move it out of your active workspace view. 
                  You can restore it later if needed.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleArchive}
              className={isArchived 
                ? "bg-green-600 hover:bg-green-700" 
                : "bg-orange-600 hover:bg-orange-700"
              }
            >
              {isArchived ? 'Restore' : 'Archive'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {status === 'success' && (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">
            {isArchived ? 'Restored successfully' : 'Archived successfully'}
          </span>
        </div>
      )}

      {status === 'error' && (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <XCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">
            {isArchived ? 'Restore failed' : 'Archive failed'}
          </span>
        </div>
      )}
    </div>
  );
}