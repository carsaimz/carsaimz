'use client';

/**
 * Carsai Mozambique — Image Upload Component
 *
 * Converts images to base64 and stores them in Firestore.
 * Supports:
 *   - Drag & drop
 *   - Click to select
 *   - Preview
 *   - Remove
 *   - Resize (max width/height)
 *   - Gravatar fallback for avatars
 *
 * Usage:
 *   <ImageUpload value={image} onChange={setImage} />
 *   <ImageUpload value={avatar} onChange={setAvatar} type="avatar" email={userEmail} />
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';

interface ImageUploadProps {
  /** Current base64 image value (or null) */
  value: string | null;
  /** Called when image changes (base64 string or null) */
  onChange: (value: string | null) => void;
  /** Type of upload — affects default size and shape */
  type?: 'avatar' | 'image';
  /** Email for Gravatar fallback (avatar type only) */
  email?: string | null;
  /** Maximum width in pixels (default: 800 for image, 200 for avatar) */
  maxWidth?: number;
  /** Maximum height in pixels (default: 800 for image, 200 for avatar) */
  maxHeight?: number;
  /** Maximum dimension (sets both maxWidth and maxHeight) */
  maxDimension?: number;
  /** Maximum file size in MB (default: 5) */
  maxSize?: number;
  /** Quality for JPEG compression (0-1, default: 0.8) */
  quality?: number;
  /** Placeholder text for the upload area */
  placeholder?: string;
  /** Additional CSS class */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}

/**
 * Generate a simple Gravatar-like avatar from email initials.
 * Uses a deterministic color based on the email string.
 */
function generateAvatarFromEmail(email: string): string {
  const initials = email
    .split('@')[0]
    .split(/[._-]/)
    .map((s) => s[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Deterministic color from email hash
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="hsl(${hue}, 60%, 45%)" rx="50"/>
    <text x="50" y="50" text-anchor="middle" dy="0.35em" fill="white" font-size="40" font-family="sans-serif">${initials}</text>
  </svg>`;

  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Resize an image file to fit within max dimensions and convert to base64.
 */
function resizeAndConvert(
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality: number
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Scale down if larger than max dimensions
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Convert to base64 (JPEG for photos, PNG for transparency)
        const isPng = file.type === 'image/png';
        const mimeType = isPng ? 'image/png' : 'image/jpeg';
        const base64 = canvas.toDataURL(mimeType, quality);
        resolve(base64);
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export function ImageUpload({
  value,
  onChange,
  type = 'image',
  email,
  maxWidth,
  maxHeight,
  maxDimension,
  maxSize = 5,
  quality = 0.8,
  placeholder,
  className = '',
  disabled = false,
}: ImageUploadProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [processing, setProcessing] = useState(false);

  const isAvatar = type === 'avatar';
  const maxW = maxDimension || maxWidth || (isAvatar ? 200 : 800);
  const maxH = maxDimension || maxHeight || (isAvatar ? 200 : 800);
  const maxFileSize = maxSize * 1024 * 1024;

  // Generate avatar from email if no value provided
  const displayValue = value || (isAvatar && email ? generateAvatarFromEmail(email) : null);

  const handleFile = useCallback(
    async (file: File) => {
      if (!file.type.startsWith('image/')) return;

      // Max file size
      if (file.size > maxFileSize) return;

      setProcessing(true);
      try {
        const base64 = await resizeAndConvert(file, maxW, maxH, quality);
        onChange(base64);
      } catch (err) {
        console.error('Image processing error:', err);
      } finally {
        setProcessing(false);
      }
    },
    [maxW, maxH, quality, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset input so the same file can be selected again
      e.target.value = '';
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
  }, [onChange]);

  const handleUseGravatar = useCallback(() => {
    if (email) {
      onChange(generateAvatarFromEmail(email));
    }
  }, [email, onChange]);

  if (isAvatar) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="relative group">
          <div className="size-16 rounded-full overflow-hidden bg-muted border-2 border-border">
            {displayValue ? (
              <img
                src={displayValue}
                alt="Avatar"
                className="size-full object-cover"
              />
            ) : (
              <div className="size-full flex items-center justify-center text-muted-foreground">
                <User className="size-8" />
              </div>
            )}
          </div>
          {!disabled && (
            <div
              className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="size-4 text-white" />
            </div>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || processing}
            >
              {processing ? '...' : t('common.upload') || 'Upload'}
            </Button>
            {value && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={disabled}
              >
                <X className="size-3" />
              </Button>
            )}
          </div>
          {email && !value && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="text-xs h-auto p-0"
              onClick={handleUseGravatar}
              disabled={disabled}
            >
              {t('common.useInitials') || 'Usar iniciais do email'}
            </Button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled}
        />
      </div>
    );
  }

  // Standard image upload
  return (
    <div className={`space-y-2 ${className}`}>
      {displayValue ? (
        <div className="relative group rounded-lg overflow-hidden border border-border">
          <img
            src={displayValue}
            alt="Preview"
            className="w-full max-h-48 object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="size-3 mr-1" />
                {t('common.change') || 'Alterar'}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={handleRemove}
              >
                <X className="size-3 mr-1" />
                {t('common.remove') || 'Remover'}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {placeholder || t('common.dragDropImage') || 'Arraste uma imagem ou clique para seleccionar'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            PNG, JPG, GIF (máx. {maxSize}MB)
          </p>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
        disabled={disabled}
      />
    </div>
  );
}
