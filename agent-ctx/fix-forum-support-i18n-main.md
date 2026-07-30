# Task: Fix Forum Topic Creation, Support Ticket Detail, i18n Issues

## Summary
All 6 issues have been fixed successfully:

### 1. Forum Topic Creation Dialog (forum-page.tsx)
- Added a Dialog component that shows when `showNewTopicDialog` is true
- Dialog includes: Title (Input), Category (Select from categories), Content (Textarea)
- On submit, POSTs to `/api/forum/topics` with { title, slug (auto-generated from title), content, categoryId, authorId }
- Uses the `useAuth` hook to get the current user
- Shows toast on success/failure using `useToast`
- Refreshes the topics list after creation by re-fetching from `/api/forum`

### 2. Forum Reply Persistence (topic-detail.tsx)
- Replaced the mocked `setTimeout` reply submission with real API call
- Now POSTs to `/api/forum/replies` with { topicId, content, authorId }
- Uses `apiFetch` and `safeJson` from `@/lib/api-fetch`
- Handles success and error cases properly

### 3. Blog Comment Persistence (post-detail.tsx)
- Replaced the mocked `setTimeout` comment submission with real API call
- Now POSTs to `/api/comments` with { postId, content, authorId }
- Uses `apiFetch` and `safeJson` from `@/lib/api-fetch`
- Handles success and error cases properly

### 4. Support Ticket Detail with Replies (user-support.tsx)
- Added `selectedTicket` state to track which ticket is selected
- When a ticket is selected, shows a detail view instead of the list
- Detail view shows: ticket description, status, priority, and replies
- Added a reply form that POSTs to `/api/support/replies` with { ticketId, content, authorId }
- Added a "Back to list" button with `ArrowLeft` icon
- Updated `SupportData` interface to include `description` and `replies` fields
- Made table rows clickable to navigate to ticket detail

### 5. Post Detail i18n Content Resolution (post-detail.tsx)
- Imported `resolveI18nContent` from `@/lib/i18n-content`
- Added `language` to the destructured `useLanguage()` hook
- Added `titleI18n`, `excerptI18n`, `contentI18n` fields to the `PostData` interface
- Applied `resolveI18nContent` for:
  - Title: `resolveI18nContent(post.titleI18n, post.title, language)`
  - Content: `resolveI18nContent(post.contentI18n, post.content || '', language)`
  - Used in share text, read time calculation, and content rendering

### 6. Differentiate Reports and Analytics from Dashboard
- **admin-reports.tsx**: Created a dedicated reports page with:
  - Summary cards (Total Revenue, Total Bookings, New Users)
  - Revenue Report table (monthly totals with avg per booking)
  - User Growth Report table (new users, total users, growth rate)
  - Service Usage Report table (bookings, revenue, avg revenue per service)
  - All using mock data with realistic structure

- **admin-analytics.tsx**: Created a dedicated analytics page with:
  - System Health metrics (Uptime, Active Connections, Memory, CPU, Disk, Cache Hit Rate)
  - API Response Times with visual progress bars (avg and P99)
  - Error Rates summary (by period with error count and rate)
  - Recent Errors log (with status codes, methods, paths, and messages)
  - Resource Summary cards (CPU, Disk, Bandwidth)
  - All using mock data with realistic structure

## Files Modified
1. `src/components/forum/forum-page.tsx` - Added dialog, imports, and submit handler
2. `src/components/forum/topic-detail.tsx` - Replaced mock reply with real API call
3. `src/components/blog/post-detail.tsx` - Replaced mock comment, added i18n resolution
4. `src/components/user/user-support.tsx` - Added ticket detail view and reply form
5. `src/components/admin/admin-reports.tsx` - Complete rewrite with reports data
6. `src/components/admin/admin-analytics.tsx` - Complete rewrite with analytics data

## Lint Status
All modified files pass lint with no errors.
