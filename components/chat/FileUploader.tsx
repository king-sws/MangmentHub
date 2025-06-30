"use client";

import { useState, useRef } from "react";
import { toast } from "sonner";
import { X, Upload, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

// Configuration for file uploads
const CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ],
  PRICING: {
    BASE_PRICE: 0, // Free for files under threshold
    THRESHOLD_MB: 2, // Files larger than 2MB incur charges
    PRICE_PER_MB: 0.05, // $0.05 per MB over threshold
  }
};

export interface FileAttachment {
  file: File;
  id: string;
  previewUrl?: string;
  progress: number;
  error?: string;
  fee: number;
}

interface FileUploaderProps {
  onAttachmentsChange: (files: FileAttachment[]) => void;
  maxFiles?: number;
  disabled?: boolean;
}

export function FileUploader({ 
  onAttachmentsChange, 
  maxFiles = 5,
  disabled = false 
}: FileUploaderProps) {
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [totalFee, setTotalFee] = useState(0);

  const calculateFee = (fileSize: number): number => {
    const fileSizeMB = fileSize / (1024 * 1024);
    
    if (fileSizeMB <= CONFIG.PRICING.THRESHOLD_MB) {
      return 0; // Free tier
    }
    
    const excessMB = fileSizeMB - CONFIG.PRICING.THRESHOLD_MB;
    const fee = excessMB * CONFIG.PRICING.PRICE_PER_MB;
    
    // Round to 2 decimal places
    return Math.round(fee * 100) / 100;
  };

  const updateTotalFee = (files: FileAttachment[]) => {
    const newTotalFee = files.reduce((sum, file) => sum + file.fee, 0);
    setTotalFee(newTotalFee);
  };

  const handleFileClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (!CONFIG.ALLOWED_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        error: `Unsupported file type: ${file.type}` 
      };
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      return { 
        valid: false, 
        error: `File too large (max ${CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB)` 
      };
    }

    return { valid: true };
  };

  const processFiles = (files: FileList | null) => {
    if (!files || disabled) return;

    // Check if adding these files would exceed the max
    if (attachments.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const newAttachments: FileAttachment[] = [];
    const fileArray = Array.from(files);

    fileArray.forEach(file => {
      const validation = validateFile(file);
      const fee = calculateFee(file.size);
      
      const fileAttachment: FileAttachment = {
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        progress: validation.valid ? 0 : 100,
        error: validation.error,
        fee
      };

      // Generate preview for images
      if (validation.valid && file.type.startsWith('image/')) {
        fileAttachment.previewUrl = URL.createObjectURL(file);
      }

      // Simulate upload progress for valid files
      if (validation.valid) {
        simulateUpload(fileAttachment);
      }

      newAttachments.push(fileAttachment);
    });

    const updatedAttachments = [...attachments, ...newAttachments];
    setAttachments(updatedAttachments);
    onAttachmentsChange(updatedAttachments);
    updateTotalFee(updatedAttachments);
  };

  const simulateUpload = (fileAttachment: FileAttachment) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }
      
      setAttachments(prev => 
        prev.map(att => 
          att.id === fileAttachment.id 
            ? { ...att, progress } 
            : att
        )
      );
    }, 200);
  };

  const removeAttachment = (id: string) => {
    // Revoke object URL if there's a preview
    const attachment = attachments.find(att => att.id === id);
    if (attachment?.previewUrl) {
      URL.revokeObjectURL(attachment.previewUrl);
    }

    const updatedAttachments = attachments.filter(att => att.id !== id);
    setAttachments(updatedAttachments);
    onAttachmentsChange(updatedAttachments);
    updateTotalFee(updatedAttachments);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="w-full space-y-3">
      {/* File input and drag area */}
      <div
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          isDragging ? "border-primary bg-primary/5" : "border-muted-foreground/20"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:border-primary/50"}`}
        onClick={handleFileClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          onChange={(e) => processFiles(e.target.files)}
          disabled={disabled}
        />
        <div className="flex flex-col items-center justify-center gap-2 py-4">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm font-medium">
            Click to upload or drag and drop files
          </p>
          <p className="text-xs text-muted-foreground">
            Max {maxFiles} files, up to {CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB each
          </p>
        </div>
      </div>

      {/* Fee information */}
      {totalFee > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-amber-500 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800">File upload fees apply</p>
              <p className="text-xs text-amber-700">
                Files over {CONFIG.PRICING.THRESHOLD_MB}MB incur a fee of ${CONFIG.PRICING.PRICE_PER_MB.toFixed(2)}/MB.
                Total fee: ${totalFee.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* File list */}
      {attachments.length > 0 && (
        <div className="space-y-2 mt-3">
          <p className="text-sm font-medium">Attachments ({attachments.length}/{maxFiles})</p>
          <div className="space-y-2">
            {attachments.map((attachment) => (
              <div 
                key={attachment.id} 
                className={`flex items-center gap-3 bg-muted/40 border rounded-md p-2 ${attachment.error ? 'border-red-300 bg-red-50' : ''}`}
              >
                {/* Preview for images */}
                {attachment.previewUrl && (
                  <div className="h-10 w-10 rounded overflow-hidden shrink-0">
                    <img 
                      src={attachment.previewUrl} 
                      alt="Preview" 
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                
                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="truncate pr-2">
                      <p className="text-sm font-medium truncate">
                        {attachment.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(attachment.file.size)}
                        {attachment.fee > 0 && (
                          <span className="text-amber-600 ml-2">
                            ${attachment.fee.toFixed(2)} fee
                          </span>
                        )}
                      </p>
                    </div>
                    
                    {/* Error message */}
                    {attachment.error && (
                      <p className="text-xs text-red-500 truncate max-w-[200px]">
                        {attachment.error}
                      </p>
                    )}
                  </div>
                  
                  {/* Progress bar */}
                  {!attachment.error && (
                    <div className="mt-1">
                      <Progress value={attachment.progress} className="h-1" />
                    </div>
                  )}
                </div>
                
                {/* Remove button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeAttachment(attachment.id)}
                  disabled={disabled}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}