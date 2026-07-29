/**
 * Carsai Mozambique — Client-Side Firestore Data Layer
 *
 * Provides functions to fetch blog posts, forum data, and other content
 * directly from Firestore using the Firebase Client SDK.
 *
 * This is used as a fallback when the server API routes are unavailable
 * (e.g., with `output: "export"` in next.config.ts, or in Capacitor native apps).
 *
 * Pattern: Try API route first → Fall back to client-side Firestore → Show empty state
 */

import { firestoreClient } from '@/lib/firebase-client'
import { apiFetch, safeJson } from '@/lib/api-fetch'
import {
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

interface PostAuthor {
  id: string
  name: string
  email: string
  avatar: string | null
}

interface PostCategory {
  id: string
  name: string
  slug: string
}

interface PostTag {
  id: string
  name: string
  slug: string
}

export interface PostData {
  id: string
  title: string
  titleI18n: string | null
  slug: string
  excerpt: string | null
  excerptI18n: string | null
  content: string | null
  contentI18n: string | null
  featuredImage: string | null
  published: boolean
  authorId: string
  categoryId: string | null
  createdAt: string
  updatedAt: string
  author: PostAuthor
  category: PostCategory | null
  tags: PostTag[]
}

interface TopicAuthor {
  id: string
  name: string
  email: string
  avatar: string | null
}

export interface ForumTopicData {
  id: string
  title: string
  slug: string
  content: string | null
  categoryId: string
  authorId: string
  isPinned: boolean
  isLocked: boolean
  isResolved: boolean
  createdAt: string
  updatedAt: string
  author: TopicAuthor
  _count: {
    replies: number
    likes: number
  }
}

export interface ForumCategoryData {
  id: string
  name: string
  slug: string
  description: string | null
  order: number
  createdAt: string
  topics: ForumTopicData[]
  _count: {
    topics: number
  }
}

// ──────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────

/**
 * Convert a Firestore Timestamp or Date to ISO string
 */
function toISO(value: any): string {
  if (!value) return new Date().toISOString()
  if (value instanceof Timestamp) return value.toDate().toISOString()
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'string') return value
  return new Date().toISOString()
}

/**
 * Check if client-side Firestore is available
 */
function isClientFirestoreAvailable(): boolean {
  return !!firestoreClient
}

// ──────────────────────────────────────────────
// Blog Posts
// ──────────────────────────────────────────────

/**
 * Fetch all published blog posts from Firestore client-side.
 * Returns enriched posts with author, category, and tags.
 */
export async function fetchPostsClient(): Promise<PostData[]> {
  if (!isClientFirestoreAvailable()) {
    throw new Error('Firestore client not available')
  }

  const db = firestoreClient!

  // Get published posts
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, where('published', '==', true), orderBy('createdAt', 'desc'))
  const postsSnap = await getDocs(q)

  if (postsSnap.empty) return []

  // Enrich each post with author, category, and tags
  const posts: PostData[] = []

  for (const postDoc of postsSnap.docs) {
    const postData = postDoc.data()

    // Get author
    let author: PostAuthor = { id: '', name: 'Unknown', email: '', avatar: null }
    if (postData.authorId) {
      try {
        const authorDoc = await getDoc(doc(db, 'users', postData.authorId))
        if (authorDoc.exists()) {
          const a = authorDoc.data()
          author = { id: authorDoc.id, name: a.name || 'Unknown', email: a.email || '', avatar: a.avatar || null }
        }
      } catch {}
    }

    // Get category
    let category: PostCategory | null = null
    if (postData.categoryId) {
      try {
        const catDoc = await getDoc(doc(db, 'categories', postData.categoryId))
        if (catDoc.exists()) {
          const c = catDoc.data()
          category = { id: catDoc.id, name: c.name || '', slug: c.slug || '' }
        }
      } catch {}
    }

    // Get tags
    const tags: PostTag[] = []
    try {
      const postTagsRef = collection(db, 'post_tags')
      const ptQuery = query(postTagsRef, where('postId', '==', postDoc.id))
      const ptSnap = await getDocs(ptQuery)

      for (const ptDoc of ptSnap.docs) {
        const ptData = ptDoc.data()
        if (ptData.tagId) {
          const tagDoc = await getDoc(doc(db, 'tags', ptData.tagId))
          if (tagDoc.exists()) {
            const t = tagDoc.data()
            tags.push({ id: tagDoc.id, name: t.name || '', slug: t.slug || '' })
          }
        }
      }
    } catch {}

    posts.push({
      id: postDoc.id,
      title: postData.title || '',
      titleI18n: postData.titleI18n || null,
      slug: postData.slug || '',
      excerpt: postData.excerpt || null,
      excerptI18n: postData.excerptI18n || null,
      content: postData.content || null,
      contentI18n: postData.contentI18n || null,
      featuredImage: postData.featuredImage || null,
      published: postData.published ?? true,
      authorId: postData.authorId || '',
      categoryId: postData.categoryId || null,
      createdAt: toISO(postData.createdAt),
      updatedAt: toISO(postData.updatedAt),
      author,
      category,
      tags,
    })
  }

  return posts
}

/**
 * Fetch a single blog post by slug from Firestore client-side.
 */
export async function fetchPostBySlugClient(slug: string): Promise<PostData | null> {
  if (!isClientFirestoreAvailable()) {
    throw new Error('Firestore client not available')
  }

  const db = firestoreClient!

  // Find post by slug
  const postsRef = collection(db, 'posts')
  const q = query(postsRef, where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)

  if (snap.empty) return null

  const postDoc = snap.docs[0]
  const postData = postDoc.data()

  // Get author
  let author: PostAuthor = { id: '', name: 'Unknown', email: '', avatar: null }
  if (postData.authorId) {
    try {
      const authorDoc = await getDoc(doc(db, 'users', postData.authorId))
      if (authorDoc.exists()) {
        const a = authorDoc.data()
        author = { id: authorDoc.id, name: a.name || 'Unknown', email: a.email || '', avatar: a.avatar || null }
      }
    } catch {}
  }

  // Get category
  let category: PostCategory | null = null
  if (postData.categoryId) {
    try {
      const catDoc = await getDoc(doc(db, 'categories', postData.categoryId))
      if (catDoc.exists()) {
        const c = catDoc.data()
        category = { id: catDoc.id, name: c.name || '', slug: c.slug || '' }
      }
    } catch {}
  }

  // Get tags
  const tags: PostTag[] = []
  try {
    const postTagsRef = collection(db, 'post_tags')
    const ptQuery = query(postTagsRef, where('postId', '==', postDoc.id))
    const ptSnap = await getDocs(ptQuery)

    for (const ptDoc of ptSnap.docs) {
      const ptData = ptDoc.data()
      if (ptData.tagId) {
        const tagDoc = await getDoc(doc(db, 'tags', ptData.tagId))
        if (tagDoc.exists()) {
          const t = tagDoc.data()
          tags.push({ id: tagDoc.id, name: t.name || '', slug: t.slug || '' })
        }
      }
    }
  } catch {}

  return {
    id: postDoc.id,
    title: postData.title || '',
    titleI18n: postData.titleI18n || null,
    slug: postData.slug || '',
    excerpt: postData.excerpt || null,
    excerptI18n: postData.excerptI18n || null,
    content: postData.content || null,
    contentI18n: postData.contentI18n || null,
    featuredImage: postData.featuredImage || null,
    published: postData.published ?? true,
    authorId: postData.authorId || '',
    categoryId: postData.categoryId || null,
    createdAt: toISO(postData.createdAt),
    updatedAt: toISO(postData.updatedAt),
    author,
    category,
    tags,
  }
}

// ──────────────────────────────────────────────
// Forum
// ──────────────────────────────────────────────

/**
 * Fetch all forum categories with topics from Firestore client-side.
 */
export async function fetchForumClient(): Promise<ForumCategoryData[]> {
  if (!isClientFirestoreAvailable()) {
    throw new Error('Firestore client not available')
  }

  const db = firestoreClient!

  // Get categories ordered by 'order'
  const catsRef = collection(db, 'forum_categories')
  const catsQuery = query(catsRef, orderBy('order', 'asc'))
  const catsSnap = await getDocs(catsQuery)

  if (catsSnap.empty) return []

  const categories: ForumCategoryData[] = []

  for (const catDoc of catsSnap.docs) {
    const catData = catDoc.data()

    // Get topics for this category
    const topics: ForumTopicData[] = []
    try {
      const topicsRef = collection(db, 'forum_topics')
      const topicsQuery = query(topicsRef, where('categoryId', '==', catDoc.id))
      const topicsSnap = await getDocs(topicsQuery)

      for (const topicDoc of topicsSnap.docs) {
        const topicData = topicDoc.data()

        // Get topic author
        let topicAuthor: TopicAuthor = { id: '', name: 'Unknown', email: '', avatar: null }
        if (topicData.authorId) {
          try {
            const authorDoc = await getDoc(doc(db, 'users', topicData.authorId))
            if (authorDoc.exists()) {
              const a = authorDoc.data()
              topicAuthor = { id: authorDoc.id, name: a.name || 'Unknown', email: a.email || '', avatar: a.avatar || null }
            }
          } catch {}
        }

        // Count replies
        let replyCount = 0
        try {
          const repliesRef = collection(db, 'forum_posts')
          const repliesQuery = query(repliesRef, where('topicId', '==', topicDoc.id))
          const repliesSnap = await getDocs(repliesQuery)
          replyCount = repliesSnap.size
        } catch {}

        // Count likes
        let likeCount = 0
        try {
          const likesRef = collection(db, 'forum_likes')
          const likesQuery = query(likesRef, where('topicId', '==', topicDoc.id))
          const likesSnap = await getDocs(likesQuery)
          likeCount = likesSnap.size
        } catch {}

        topics.push({
          id: topicDoc.id,
          title: topicData.title || '',
          slug: topicData.slug || '',
          content: topicData.content || null,
          categoryId: topicData.categoryId || catDoc.id,
          authorId: topicData.authorId || '',
          isPinned: topicData.isPinned ?? false,
          isLocked: topicData.isLocked ?? false,
          isResolved: topicData.isResolved ?? false,
          createdAt: toISO(topicData.createdAt),
          updatedAt: toISO(topicData.updatedAt),
          author: topicAuthor,
          _count: { replies: replyCount, likes: likeCount },
        })
      }
    } catch {}

    // Sort topics: pinned first, then by date
    topics.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    })

    categories.push({
      id: catDoc.id,
      name: catData.name || '',
      slug: catData.slug || '',
      description: catData.description || null,
      order: catData.order ?? 0,
      createdAt: toISO(catData.createdAt),
      topics,
      _count: { topics: topics.length },
    })
  }

  return categories
}

/**
 * Fetch a single forum topic by slug from Firestore client-side.
 */
export async function fetchForumTopicBySlugClient(slug: string): Promise<ForumTopicData | null> {
  if (!isClientFirestoreAvailable()) {
    throw new Error('Firestore client not available')
  }

  const db = firestoreClient!

  // Find topic by slug
  const topicsRef = collection(db, 'forum_topics')
  const q = query(topicsRef, where('slug', '==', slug), limit(1))
  const snap = await getDocs(q)

  if (snap.empty) return null

  const topicDoc = snap.docs[0]
  const topicData = topicDoc.data()

  // Get author
  let author: TopicAuthor = { id: '', name: 'Unknown', email: '', avatar: null }
  if (topicData.authorId) {
    try {
      const authorDoc = await getDoc(doc(db, 'users', topicData.authorId))
      if (authorDoc.exists()) {
        const a = authorDoc.data()
        author = { id: authorDoc.id, name: a.name || 'Unknown', email: a.email || '', avatar: a.avatar || null }
      }
    } catch {}
  }

  // Count replies
  let replyCount = 0
  try {
    const repliesRef = collection(db, 'forum_posts')
    const repliesQuery = query(repliesRef, where('topicId', '==', topicDoc.id))
    const repliesSnap = await getDocs(repliesQuery)
    replyCount = repliesSnap.size
  } catch {}

  // Count likes
  let likeCount = 0
  try {
    const likesRef = collection(db, 'forum_likes')
    const likesQuery = query(likesRef, where('topicId', '==', topicDoc.id))
    const likesSnap = await getDocs(likesQuery)
    likeCount = likesSnap.size
  } catch {}

  return {
    id: topicDoc.id,
    title: topicData.title || '',
    slug: topicData.slug || '',
    content: topicData.content || null,
    categoryId: topicData.categoryId || '',
    authorId: topicData.authorId || '',
    isPinned: topicData.isPinned ?? false,
    isLocked: topicData.isLocked ?? false,
    isResolved: topicData.isResolved ?? false,
    createdAt: toISO(topicData.createdAt),
    updatedAt: toISO(topicData.updatedAt),
    author,
    _count: { replies: replyCount, likes: likeCount },
  }
}

// ──────────────────────────────────────────────
// Generic fetch with fallback
// ──────────────────────────────────────────────

/**
 * Try to fetch data from an API route, falling back to client-side Firestore.
 * This is the unified pattern used by blog, forum, and other data-fetching components.
 *
 * Handles edge cases:
 * - API route returns HTML (e.g., 404 page from static export) → falls back to client
 * - API route returns JSON with { success: false } → falls back to client
 * - API route returns JSON with non-standard format → falls back to client
 * - Network error → falls back to client
 * - Client-side Firestore also fails → returns empty array as last resort
 */
export async function fetchWithFallback<T>(
  apiPath: string,
  clientFallback: () => Promise<T>
): Promise<{ data: T; source: 'api' | 'client' }> {
  // Try API route first
  try {
    const res = await apiFetch(apiPath)
    const contentType = res.headers.get('content-type') || ''

    // Only parse as JSON if the server explicitly says it's JSON
    if (contentType.includes('application/json') && res.ok) {
      try {
        const json = await safeJson(res)
        if (json && json.success && json.data !== undefined) {
          return { data: json.data, source: 'api' }
        }
      } catch {
        // JSON parse failed (e.g., malformed JSON) — fall through to client
      }
    }
    // API returned non-JSON, error, or unexpected format — fall through to client
  } catch {
    // Network error — fall through to client
  }

  // Fallback to client-side Firestore
  try {
    const data = await clientFallback()
    return { data, source: 'client' }
  } catch (clientErr) {
    console.warn('[fetchWithFallback] Client-side Firestore also failed:', clientErr)
    // Return empty array as last resort so the UI doesn't crash
    return { data: [] as unknown as T, source: 'client' }
  }
}
