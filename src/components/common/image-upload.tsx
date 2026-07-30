'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ImageUploadProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  placeholder?: string;
  maxSize?: number;
  className?: string;
  /** Maximum dimension for resizing (default 800) */
  maxDimension?: number;
}

/**
 * Resize an image to fit within maxDimension × maxDimension while preserving aspect ratio.
 * Returns a base64 data URI string.
 */
function resizeImage(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // Only resize if the image is larger than maxDimension
      if (width <= maxDimension && height <= maxDimension) {
        // No resize needed, just read as base64
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
        return;
      }

      // Calculate new dimensions
      if (width > height) {
        height = Math.round((height / width) * maxDimension);
        width = maxDimension;
      } else {
        width = Math.round((width / height) * maxDimension);
        height = maxDimension;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      // Convert to base64 with quality compression for JPEG
      const dataUri = canvas.toDataURL('image/jpeg', 0.85);
      resolve(dataUri);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export function ImageUpload({
  value,
  onChange,
  placeholder = 'Click or drag to upload an image',
  maxSize = 2,
  className,
  maxDimension = 800,
}: ImageUploadProps) {
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback(
    async (file: File) => {
      setError(null);

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP, SVG).');
        return;
      }

      // Validate file size
      const maxSizeBytes = maxSize * 1024 * 1024;
      if (file.size > maxSizeBytes) {
        setError(`File is too large. Maximum size is ${maxSize}MB.`);
        return;
      }

      setProcessing(true);
      try {
        const base64 = await resizeImage(file, maxDimension);
        onChange(base64);
      } catch (err) {
        console.error('Image processing error:', err);
        setError('Failed to process image. Please try again.');
      } finally {
        setProcessing(false);
      }
    },
    [maxSize, maxDimension, onChange]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        processFile(file);
      }
      // Reset input so the same file can be re-selected
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [processFile]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) {
        processFile(file);
      }
    },
    [processFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleRemove = useCallback(() => {
    onChange(null);
    setError(null);
  }, [onChange]);

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img
            src={value}
            alt="Uploaded preview"
            className="w-full h-40 object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="h-4 w-4 mr-1" />
              Replace
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleRemove}
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col items-center justify-center h-40 rounded-lg border-2 border-dashed transition-colors cursor-pointer',
            dragOver
              ? 'border-emerald-500 bg-emerald-50/50'
              : 'border-muted-foreground/25 hover:border-emerald-500/50 hover:bg-emerald-50/20',
            processing && 'pointer-events-none opacity-60'
          )}
          onClick={() => !processing && inputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          {processing ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-emerald-600 animate-spin" />
              <p className="text-sm text-muted-foreground">Processing...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground text-center px-4">
                {placeholder}
              </p>
              <p className="text-xs text-muted-foreground/60">
                Max {maxSize}MB • JPEG, PNG, GIF, WebP, SVG
              </p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="hidden"
        onChange={handleFileChange}
      />

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  );
}
