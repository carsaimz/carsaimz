# Task: Make forum and blog areas fully functional with like counts on posts, comments, and forum topics

## Summary of Changes

### 1. Prisma Schema (`prisma/schema.prisma`)
- Added `PostLike` model (blog post likes) with `@@unique([postId, userId])`
- Added `CommentLike` model (blog comment likes) with `@@unique([commentId, userId])`
- Added `ForumPostLike` model (forum reply likes) with `@@unique([postId, userId])`
- Added reverse relations: `Post.postLikes`, `Comment.likes`, `ForumPost.likes`, `User.postLikes`, `User.commentLikes`, `User.forumPostLikes`
- Ran `bun run db:push` successfully

### 2. New API Endpoints Created

- **`/src/app/api/forum/likes/route.ts`** — POST to toggle like on a forum topic (ForumLike model)
  - Accepts `{ topicId, userId }`, checks if already liked → toggle (remove/add), returns `{ success, liked, likeCount }`

- **`/src/app/api/forum/posts/route.ts`** — POST to create a forum reply + PUT to toggle like on a forum reply
  - POST: Accepts `{ topicId, content, authorId }`, creates ForumPost, returns reply data with `_count.likes`
  - PUT: Accepts `{ postId, userId }`, toggles like on ForumPost (ForumPostLike model), returns `{ success, liked, likeCount }`

- **`/src/app/api/posts/likes/route.ts`** — POST to toggle like on a blog post
  - Accepts `{ postId, userId }`, toggles like (PostLike model), returns `{ success, liked, likeCount }`

- **`/src/app/api/comments/likes/route.ts`** — POST to toggle like on a comment
  - Accepts `{ commentId, userId }`, toggles like (CommentLike model), returns `{ success, liked, likeCount }`

### 3. Updated API Endpoints

- **`/src/app/api/comments/route.ts`** — Added POST handler to create comments
  - POST: Accepts `{ postId, content, authorId }`, creates Comment, returns comment data with `_count.likes`
  - GET: Updated to include `likes` field and `_count.likes` on comments

- **`/src/app/api/posts/route.ts`** — Updated to include like data
  - GET: Added `postLikes` (select userId), `_count: { postLikes, comments }` to all queries
  - Returns `likeCount` and `commentCount` fields on formatted posts
  - Comments now include `likes` array and `_count.likes`

- **`/src/app/api/forum/route.ts`** — Updated to include reply like data
  - Replies now include `likes` (select userId) and `_count.likes` count
  - Added like count mapping to replies in formatted data

### 4. Frontend Components Updated

- **`/src/components/forum/topic-detail.tsx`** — Major changes:
  - `handleLike`: Now calls `/api/forum/likes` POST endpoint (was mock local toggle)
  - `handleSubmitReply`: Now calls `/api/forum/posts` POST endpoint (was setTimeout mock)
  - Added `replyLikedMap`, `replyLikeCountMap`, `replyLikingMap` state for reply likes
  - Added `handleReplyLike()` function calling `/api/forum/posts` PUT endpoint
  - Each reply now shows a ThumbsUp like button with count and emerald-600 active state
  - Like button disabled when not authenticated or while API call is pending
  - Uses `toast.success/toast.error` from sonner for notifications
  - Initializes liked state from API data (checks if user.id in likes array)

- **`/src/components/blog/post-detail.tsx`** — Major changes:
  - `handleLike`: Now calls `/api/posts/likes` POST endpoint (was mock local toggle)
  - `handleSubmitComment`: Now calls `/api/comments` POST endpoint (was setTimeout mock)
  - Added `likeCount` state initialized from API `likeCount` field
  - Added `commentLikedMap`, `commentLikeCountMap`, `commentLikingMap` state for comment likes
  - Added `handleCommentLike()` function calling `/api/comments/likes` POST endpoint
  - Each comment now shows a ThumbsUp like button with count and emerald-600 active state
  - Post like button shows count, disabled when not authenticated
  - Hero image area shows like count and comment count
  - Uses `toast.success/toast.error` from sonner for notifications
  - Initializes liked state from API `postLikes` data

- **`/src/components/blog/blog-page.tsx`** — Changes:
  - Added `Heart` and `MessageCircle` icons to imports
  - Added `likeCount` and `commentCount` to `PostData` interface
  - Post card footer now shows: ❤️ likes count, 💬 comments count, 📅 date (was only author+date)

- **`/src/components/forum/forum-page.tsx`** — No changes needed (already has like/reply count display)

### Lint Check
- `bun run lint` passed with no errors
