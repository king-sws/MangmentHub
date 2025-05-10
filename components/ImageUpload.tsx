"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { X, Upload } from "lucide-react";

interface ImageUploadProps {
  onChange: (base64: string) => void;
  value: string;
  disabled?: boolean;
}

export const ImageUpload = ({ 
  onChange, 
  value, 
  disabled
}: ImageUploadProps) => {
  const [error, setError] = useState<string | null>(null);

  const handleDrop = useCallback((acceptedFiles: File[]) => {
    if (disabled) return;

    const file = acceptedFiles[0];
    
    if (!file) return;
    
    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("File is too large. Maximum size is 5MB.");
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file.");
      return;
    }

    setError(null);
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      onChange(base64);
    };
    
    reader.readAsDataURL(file);
  }, [disabled, onChange]);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop: handleDrop,
    accept: {
      'image/*': []
    },
    maxFiles: 1,
    disabled
  });

  const handleRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onChange("");
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div
        {...getRootProps({
          className: `
            border-2 border-dashed
            rounded-md
            p-2
            ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-gray-400 transition"}
            ${value ? "border-gray-300 bg-gray-50" : "border-gray-200"}
          `
        })}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center gap-2">
          {value ? (
            <div className="relative w-40 h-40 mx-auto overflow-hidden rounded-full">
              <Image
                fill
                src={value}
                alt="Profile image"
                className="object-cover"
              />
              {!disabled && (
                <button
                  onClick={handleRemove}
                  className="absolute top-1 right-1 p-1 rounded-full bg-rose-500 text-white shadow-sm"
                  type="button"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="h-10 w-10 text-gray-400" />
              <p className="text-sm text-gray-600 mt-2">
                Drag & drop an image, or click to browse
              </p>
              <span className="text-xs text-gray-500 mt-1">
                (Max size: 5MB)
              </span>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-500 mt-1">
          {error}
        </div>
      )}
    </div>
  );
};