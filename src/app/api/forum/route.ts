import { NextRequest, NextResponse } from 'next/server'
import { getDoc, getDocByField, queryDocs, getDocs, countDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

import { AVAILABLE_LANGUAGES, type LanguageCode } from '@/lib/i18n'

/**
 * Get the localized name for a category.
 * Uses nameI18n if available, falls back to the default name.
 */
function getLocalizedName(cat: any, lang: string): string {
  if (cat.nameI18n && typeof cat.nameI18n === 'object' && cat.nameI18n[lang]) {
    return cat.nameI18n[lang]
  }
  return cat.name
}

/**
 * Batch-fetch user data for a set of user IDs.
 * Returns a map of userId → { id, name, email, avatar }.
 */
async function batchFetchUsers(userIds: string[]): Promise<Record<string, any>> {
  const uniqueIds = [...new Set(userIds.filter(Boolean))]
  const userMap: Record<string, any> = {}

  await Promise.all(
    uniqueIds.map(async (uid) => {
      try {
        const user = await getDoc('users', uid)
        if (user) {
          userMap[uid] = { id: user.id, name: user.name, email: user.email, avatar: user.avatar }
        }
      } catch {
        // Skip failed user fetches
      }
    })
  )

  return userMap
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicSlug = searchParams.get('topic')
    const lang = searchParams.get('lang') || 'pt-pt'

    if (topicSlug) {
      // Fetch a single topic by slug
      const topic = await getDocByField('forum_topics', 'slug', topicSlug)

      if (!topic) {
        return NextResponse.json(
          { success: false, message: 'Topic not found' },
          { status: 404 }
        )
      }

      // Collect all author IDs we need to fetch
      const authorIds: string[] = [topic.authorId].filter(Boolean)

      // Get replies
      let repliesRaw: any[] = []
      try {
        repliesRaw = await queryDocs('forum_posts', [
          { field: 'topicId', op: '==', value: topic.id },
        ], 'createdAt', 'asc')
        repliesRaw.forEach((r: any) => { if (r.authorId) authorIds.push(r.authorId) })
      } catch {
        // Replies may not exist yet
      }

      // Batch-fetch all users
      const userMap = await batchFetchUsers(authorIds)

      // Get category
      let category: any = null
      if (topic.categoryId) {
        try {
          const catDoc = await getDoc('forum_categories', topic.categoryId)
          if (catDoc) {
            category = { id: catDoc.id, name: getLocalizedName(catDoc, lang), slug: catDoc.slug, description: catDoc.description, nameI18n: catDoc.nameI18n || null }
          }
        } catch {
          // Category fetch failed
        }
      }

      // Build replies with authors from map
      const replies = repliesRaw.map((reply: any) =>
        serializeFirestore({ ...reply, author: userMap[reply.authorId] || null })
      )

      // Get likes
      let likes: any[] = []
      try {
        likes = await queryDocs('forum_likes', [
          { field: 'topicId', op: '==', value: topic.id },
        ])
      } catch {
        // Likes may not exist yet
      }

      const likesFormatted = likes.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        createdAt: serializeFirestore(l.createdAt),
      }))

      const enrichedTopic = serializeFirestore({
        ...topic,
        author: userMap[topic.authorId] || null,
        category,
        replies,
        likes: likesFormatted,
        _count: {
          replies: replies.length,
          likes: likes.length,
        },
      })

      return NextResponse.json({
        success: true,
        data: enrichedTopic,
      })
    }

    // ── Fetch all forum categories with topics ──
    // Use a simpler, more resilient approach to avoid N+1 queries and timeouts

    // 1. Fetch all categories
    let categories: any[] = []
    try {
      categories = await queryDocs('forum_categories', [], 'order', 'asc')
    } catch {
      // Categories may not exist yet
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    if (categories.length === 0) {
      return NextResponse.json({ success: true, data: [], count: 0 })
    }

    // 2. Fetch all topics for all categories at once
    let allTopics: any[] = []
    try {
      allTopics = await queryDocs('forum_topics', [])
    } catch {
      // No topics yet — return categories without topics
      const emptyCategories = categories.map((cat: any) =>
        serializeFirestore({
          ...cat,
          name: getLocalizedName(cat, lang),
          nameI18n: cat.nameI18n || null,
          topics: [],
          _count: { topics: 0 },
        })
      )
      return NextResponse.json({ success: true, data: emptyCategories, count: emptyCategories.length })
    }

    // 3. Collect all unique author IDs
    const authorIds: string[] = []
    allTopics.forEach((t: any) => { if (t.authorId) authorIds.push(t.authorId) })

    // 4. Batch-fetch all authors
    const userMap = await batchFetchUsers(authorIds)

    // 5. Fetch all replies and likes (simplified — just counts, not full data)
    // For the listing page, we only need counts, not full reply/like data
    // This dramatically reduces the number of queries
    let allReplies: any[] = []
    try {
      allReplies = await queryDocs('forum_posts', [])
    } catch {
      // No replies yet
    }

    let allLikes: any[] = []
    try {
      allLikes = await queryDocs('forum_likes', [])
    } catch {
      // No likes yet
    }

    // 6. Group replies and likes by topicId
    const repliesByTopic: Record<string, number> = {}
    allReplies.forEach((r: any) => {
      const tid = r.topicId
      if (tid) repliesByTopic[tid] = (repliesByTopic[tid] || 0) + 1
    })

    const likesByTopic: Record<string, any[]> = {}
    allLikes.forEach((l: any) => {
      const tid = l.topicId
      if (tid) {
        if (!likesByTopic[tid]) likesByTopic[tid] = []
        likesByTopic[tid].push({ id: l.id, userId: l.userId })
      }
    })

    // 7. Group topics by categoryId
    const topicsByCategory: Record<string, any[]> = {}
    allTopics.forEach((topic: any) => {
      const cid = topic.categoryId
      if (cid) {
        if (!topicsByCategory[cid]) topicsByCategory[cid] = []
        topicsByCategory[cid].push(topic)
      }
    })

    // 8. Build enriched categories
    const enrichedCategories = categories.map((cat: any) => {
      const categoryTopics = topicsByCategory[cat.id] || []

      // Sort: pinned first, then by createdAt desc
      categoryTopics.sort((a: any, b: any) => {
        if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1
        const aTime = a.createdAt ? new Date(serializeFirestore(a.createdAt)).getTime() : 0
        const bTime = b.createdAt ? new Date(serializeFirestore(b.createdAt)).getTime() : 0
        return bTime - aTime
      })

      // Enrich each topic (lightweight — no full reply data, just counts)
      const topics = categoryTopics.map((topic: any) =>
        serializeFirestore({
          ...topic,
          author: userMap[topic.authorId] || null,
          replies: [], // Don't include full replies in listing — use topic detail for that
          likes: likesByTopic[topic.id] || [],
          _count: {
            replies: repliesByTopic[topic.id] || 0,
            likes: (likesByTopic[topic.id] || []).length,
          },
        })
      )

      return serializeFirestore({
        ...cat,
        name: getLocalizedName(cat, lang),
        nameI18n: cat.nameI18n || null,
        topics,
        _count: { topics: topics.length },
      })
    })

    return NextResponse.json({
      success: true,
      data: enrichedCategories,
      count: enrichedCategories.length,
    })
  } catch (error) {
    console.error('Forum fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch forum data',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
