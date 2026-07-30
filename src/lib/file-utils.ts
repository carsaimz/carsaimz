/**
 * File utility helpers for base64 conversion, validation, and manipulation.
 * These functions work client-side (browser) and server-side where applicable.
 */

/**
 * Convert a File object to a base64 data URI string.
 * Works in the browser (client-side).
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = () => {
      reject(new Error(`Failed to read file: ${file.name}`))
    }
    reader.readAsDataURL(file)
  })
}

/**
 * Validate that a file's type matches one of the allowed MIME types.
 */
export function validateFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type)
}

/**
 * Validate that a file's size does not exceed the maximum size in MB.
 */
export function validateFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  return file.size <= maxSizeBytes
}

/**
 * Extract the MIME type from a base64 data URI string.
 * Example: "data:image/png;base64,..." → "image/png"
 */
export function getBase64MimeType(base64: string): string {
  const match = base64.match(/^data:([^;]+);/)
  if (match && match[1]) {
    return match[1]
  }
  return ''
}

/**
 * Convert a base64 data URI string to a Blob object.
 * Useful for downloading or displaying base64-stored files.
 */
export function base64ToBlob(base64: string): Blob {
  // Extract MIME type
  const mimeType = getBase64MimeType(base64)

  // Extract the base64 data portion (after the comma)
  const base64Data = base64.split(',')[1]
  if (!base64Data) {
    throw new Error('Invalid base64 data URI: no data portion found')
  }

  // Decode base64 to binary
  const byteCharacters = atob(base64Data)
  const byteArrays: Uint8Array[] = []

  // Process in chunks to avoid stack overflow with large files
  const chunkSize = 8192
  for (let offset = 0; offset < byteCharacters.length; offset += chunkSize) {
    const slice = byteCharacters.slice(offset, offset + chunkSize)
    const byteNumbers = new Array(slice.length)
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i)
    }
    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new Blob(byteArrays as BlobPart[], { type: mimeType })
}

/**
 * Get the file extension from a MIME type.
 */
export function mimeTypeToExtension(mimeType: string): string {
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  }
  return map[mimeType] || ''
}

/**
 * Format file size in human-readable format.
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)
  return `${size.toFixed(i > 0 ? 1 : 0)} ${units[i]}`
}

import { apiFetch, safeJson } from '@/lib/api-fetch';

/**
 * Upload a file to the server's base64 upload API endpoint.
 * Returns the data URI and metadata.
 */
export async function uploadFileToBase64(
  file: File,
  category?: string
): Promise<{ dataUri: string; metadata: { originalName: string; mimeType: string; size: number; extension: string; category: string } }> {
  const formData = new FormData()
  formData.append('file', file)
  if (category) {
    formData.append('category', category)
  }

  const response = await apiFetch('/api/upload', {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    const errorData = await safeJson(response)
    throw new Error(errorData?.error || 'Upload failed')
  }

  const result = await safeJson(response)
  if (!result) throw new Error('Server returned non-JSON response')
  return {
    dataUri: result.dataUri,
    metadata: result.metadata,
  }
}

/**
 * Create a download trigger for a base64 data URI.
 * Opens the data in a new tab or triggers a download.
 */
export function downloadBase64File(dataUri: string, filename?: string): void {
  const link = document.createElement('a')
  link.href = dataUri

  if (filename) {
    link.download = filename
  } else {
    // Try to extract a sensible filename from the MIME type
    const mimeType = getBase64MimeType(dataUri)
    const ext = mimeTypeToExtension(mimeType)
    link.download = `file.${ext}`
  }

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Check if a string is a valid base64 data URI.
 */
export function isBase64DataUri(str: string): boolean {
  return /^data:[^;]+;base64,/.test(str)
}

/**
 * Allowed file type constants for reuse across the app.
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const MAX_IMAGE_SIZE_MB = 5
export const MAX_DOCUMENT_SIZE_MB = 10
