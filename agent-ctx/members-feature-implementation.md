# Task: Team Members Feature Implementation

## Summary
Successfully implemented the team members feature with public API, admin API, admin page, sidebar integration, and i18n translations.

## Files Created

### 1. Public API: `/src/app/api/members/route.ts`
- GET endpoint querying `members` collection where `isPublished == true`, ordered by `order` asc
- Returns only public-safe fields (excludes internal fields)
- Follows exact same pattern as testimonials public route

### 2. Admin API: `/src/app/api/admin/members/route.ts`
- GET: All members (including unpublished), ordered by `order` asc
- POST: Create new member (validates name and role required)
- PUT: Update member by id (supports partial updates)
- DELETE: Delete member by id (via query param)
- Uses `buildI18nJson` from i18n-content for i18n fields
- Uses `checkFirebaseAdmin`, `safeQueryDocs`, `safeGetDoc` from db-helpers
- Uses `invalidateKnowledgeCache` after mutations
- Follows exact same pattern as admin testimonials route

### 3. Admin Page: `/src/app/(dashboard)/admin/members/page.tsx`
- 'use client' component with full CRUD UI
- Table listing: avatar thumbnail, name, role, order, published status, actions (toggle/edit/delete)
- Dialog form for create/edit with:
  - Multilingual tabs (LanguageTabs) for name, role, description across 8 languages
  - Image upload (ImageUpload component, avatar type)
  - Contact fields: email, phone, whatsapp
  - Social links: linkedin, github, twitter, facebook, website
  - Order number input
  - Published toggle (Switch)
- Uses shadcn/ui components (Card, Button, Input, Dialog, Label, Badge, Switch, Table, Avatar, etc.)
- Uses lucide-react icons
- Uses apiFetch/safeJson from @/lib/api-fetch
- Uses useLanguage from @/contexts/language-context
- Uses useToast from @/hooks/use-toast
- Uses useDocumentTitle hook
- Motion animations with framer-motion
- Style consistent with admin-content-manager pattern

## Files Modified

### 4. Admin Sidebar: `/src/components/layout/admin-shell.tsx`
- Added `{ path: '/admin/members', labelKey: 'admin.members', icon: Users }` after testimonials entry
- `Users` icon was already imported

### 5. Translation Files (8 files)
Added `members` key in the `admin` section of each translation file:

| File | Value |
|------|-------|
| pt-pt.ts | `members: 'Membros'` |
| en-us.ts | `members: 'Members'` |
| pt-br.ts | `members: 'Membros'` |
| fr-fr.ts | `members: 'Membres'` |
| es-es.ts | `members: 'Miembros'` |
| zh-cn.ts | `members: '成员'` |
| de-de.ts | `members: 'Mitglieder'` |
| sw-tz.ts | `members: 'Wajumbe'` |

## Verification
- ESLint passes with 0 errors (3 pre-existing warnings in scripts)
- All patterns follow existing codebase conventions
