// components/ExportClient.tsx
"use client";

import { useState } from "react";
import { Download, Loader2, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ExportClientProps {
  boardId: string;
  boardTitle: string;
}

export function ExportClient({ boardId, boardTitle }: ExportClientProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleExport = async () => {
    setIsExporting(true);
    setExportStatus('idle');

    try {
      const response = await fetch(`/api/board/${boardId}/export`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Export failed');
      }

      if (data.success) {
        // Create and download the file
        const jsonString = JSON.stringify(data.data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = data.filename || `${boardTitle}_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        setExportStatus('success');
        toast("Export Successful");
      }
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus('error');
      toast("Export Failed");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex items-center space-x-3">
      <Button
        onClick={handleExport}
        disabled={isExporting}
        className="bg-blue-600 hover:bg-blue-700 text-white"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Export as JSON
          </>
        )}
      </Button>

      {exportStatus === 'success' && (
        <div className="flex items-center text-green-600 dark:text-green-400">
          <CheckCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Exported successfully</span>
        </div>
      )}

      {exportStatus === 'error' && (
        <div className="flex items-center text-red-600 dark:text-red-400">
          <XCircle className="w-4 h-4 mr-1" />
          <span className="text-sm font-medium">Export failed</span>
        </div>
      )}
    </div>
  );
}