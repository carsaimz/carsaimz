# Task: Base64 File Storage Implementation

## Task ID: base64-file-storage

## Summary
Implemented base64 file storage for the Carsai Mozambique project, replacing server-side file storage with inline base64 data URIs stored in database fields.

## Files Created
1. **`/src/app/api/upload/route.ts`** - New API endpoint for file uploads to base64 conversion
   - Accepts POST with FormData containing a file
   - Validates file size (5MB images, 10MB documents)
   - Validates file type (images: jpg, png, gif, webp, svg; documents: pdf, doc, docx)
   - Converts file buffer to base64 data URI with proper MIME prefix
   - Returns data URI and metadata (original name, MIME, size, category)

2. **`/src/lib/file-utils.ts`** - Utility helper functions for file/base64 operations
   - `fileToBase64(file: File): Promise<string>` - client-side file to base64
   - `validateFileType(file: File, allowedTypes: string[]): boolean`
   - `validateFileSize(file: File, maxSizeMB: number): boolean`
   - `getBase64MimeType(base64: string): string`
   - `base64ToBlob(base64: string): Blob`
   - `uploadFileToBase64(file, category)` - uploads via API
   - `downloadBase64File(dataUri, filename)` - triggers browser download
   - `isBase64DataUri(str)` - validates data URI format
   - Constants for allowed MIME types and max sizes

## Files Modified
1. **`/prisma/schema.prisma`** - Updated schema
   - Added `FileAttachment` model (id, name, mimeType, size, data, category, userId, createdAt)
   - Updated comments on: User.avatar, Service.icon, Project.images, Testimonial.avatar, Post.featuredImage, Quote.attachments, Payment.receiptUrl
   - All comments now indicate base64 data URI storage

2. **`/src/lib/seed-data.ts`** - Updated seed data
   - Added SVG-to-base64 helper function `svgToDataUri()`
   - Created placeholder SVG generators for avatars, project images, featured images
   - Users now have base64 avatar data URIs (colored initials)
   - Services now have base64 icon data URIs (colored SVG icons)
   - Projects now have JSON arrays of base64 image data URIs
   - Posts now have base64 featured image data URIs
   - Testimonials now have base64 avatar data URIs
   - Added FileAttachment seed data (8 files: logo, avatars, project images, post images)
   - Added `fileAttachment.deleteMany()` to cleanup

## Database Changes
- New table `file_attachments` created via `prisma db push`
- Prisma Client regenerated with FileAttachment model

## Build Result
- **Lint**: Passed ✅
- **Build**: Compiled successfully ✅
- **Dev Server**: Running ✅
- **API Route**: `/api/upload` listed in build output ✅
