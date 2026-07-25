import { NextRequest, NextResponse } from 'next/server'

// Allowed MIME types for validation
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
]

const ALLOWED_DOCUMENT_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Max file sizes in bytes
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10MB

// Allowed file extensions
const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
const ALLOWED_DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx']

function getExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : ''
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const category = formData.get('category') as string | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided. Send a file in the "file" field of the FormData.' },
        { status: 400 }
      )
    }

    // Validate file extension
    const extension = getExtension(file.name)
    const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(extension)
    const isDocument = ALLOWED_DOCUMENT_EXTENSIONS.includes(extension)

    if (!isImage && !isDocument) {
      return NextResponse.json(
        {
          error: `Invalid file type. Allowed extensions: images (${ALLOWED_IMAGE_EXTENSIONS.join(', ')}), documents (${ALLOWED_DOCUMENT_EXTENSIONS.join(', ')}).`,
        },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (isImage && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
      // SVG files sometimes have varying MIME types; allow if extension is svg
      if (extension === 'svg' && file.type.includes('xml') || extension === 'svg' && file.type === '') {
        // Allow SVG with unusual MIME types
      } else {
        return NextResponse.json(
          { error: `Invalid MIME type for image: ${file.type}. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}.` },
          { status: 400 }
        )
      }
    }

    if (isDocument && !ALLOWED_DOCUMENT_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid MIME type for document: ${file.type}. Allowed: ${ALLOWED_DOCUMENT_TYPES.join(', ')}.` },
        { status: 400 }
      )
    }

    // Validate file size
    const maxSize = isImage ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE
    if (file.size > maxSize) {
      const maxSizeMB = isImage ? 5 : 10
      return NextResponse.json(
        { error: `File too large. Maximum size for ${isImage ? 'images' : 'documents'} is ${maxSizeMB}MB. Your file is ${(file.size / 1024 / 1024).toFixed(2)}MB.` },
        { status: 400 }
      )
    }

    // Convert file buffer to base64
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const base64Data = buffer.toString('base64')

    // Determine proper MIME type (prefer the file's type, fallback based on extension)
    let mimeType = file.type
    if (!mimeType || mimeType === '') {
      const mimeMap: Record<string, string> = {
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        png: 'image/png',
        gif: 'image/gif',
        webp: 'image/webp',
        svg: 'image/svg+xml',
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      }
      mimeType = mimeMap[extension] || 'application/octet-stream'
    }

    // Build data URI
    const dataUri = `data:${mimeType};base64,${base64Data}`

    // Build metadata
    const metadata = {
      originalName: file.name,
      mimeType: mimeType,
      size: file.size,
      sizeKB: Math.round(file.size / 1024),
      extension: extension,
      category: category || (isImage ? 'image' : 'document'),
    }

    return NextResponse.json({
      success: true,
      dataUri: dataUri,
      metadata: metadata,
    })
  } catch (error) {
    console.error('Upload API error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error occurred'
    return NextResponse.json(
      { error: `Failed to process file upload: ${message}` },
      { status: 500 }
    )
  }
}
