import { NextRequest, NextResponse } from 'next/server'
import { getDoc, getDocByField, queryDocs, getDocs, countDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const topicSlug = searchParams.get('topic')

    if (topicSlug) {
      // Fetch a single topic by slug
      const topic = await getDocByField('forum_topics', 'slug', topicSlug)

      if (!topic) {
        return NextResponse.json(
          { success: false, message: 'Topic not found' },
          { status: 404 }
        )
      }

      // Enrich topic with author, category, replies, likes, and counts
      let author: any = null
      if (topic.authorId) {
        const authorDoc = await getDoc('users', topic.authorId)
        if (authorDoc) {
          author = { id: authorDoc.id, name: authorDoc.name, email: authorDoc.email, avatar: authorDoc.avatar }
        }
      }

      let category: any = null
      if (topic.categoryId) {
        const catDoc = await getDoc('forum_categories', topic.categoryId)
        if (catDoc) {
          category = { id: catDoc.id, name: catDoc.name, slug: catDoc.slug, description: catDoc.description }
        }
      }

      // Get replies with authors
      const repliesRaw = await queryDocs('forum_posts', [
        { field: 'topicId', op: '==', value: topic.id },
      ], 'createdAt', 'asc')

      const replies = await Promise.all(
        repliesRaw.map(async (reply: any) => {
          let replyAuthor: any = null
          if (reply.authorId) {
            const a = await getDoc('users', reply.authorId)
            if (a) replyAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
          }
          return serializeFirestore({ ...reply, author: replyAuthor })
        })
      )

      // Get likes
      const likes = await queryDocs('forum_likes', [
        { field: 'topicId', op: '==', value: topic.id },
      ])

      const likesFormatted = likes.map((l: any) => ({
        id: l.id,
        userId: l.userId,
        createdAt: serializeFirestore(l.createdAt),
      }))

      const enrichedTopic = serializeFirestore({
        ...topic,
        author,
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

    // Fetch all forum categories with topics
    const categories = await queryDocs('forum_categories', [], 'order', 'asc')

    const enrichedCategories = await Promise.all(
      categories.map(async (cat: any) => {
        // Get topics for this category
        const topicsRaw = await queryDocs('forum_topics', [
          { field: 'categoryId', op: '==', value: cat.id },
        ])

        // Sort: pinned first, then by createdAt desc
        topicsRaw.sort((a: any, b: any) => {
          if (a.isPinned !== b.isPinned) return b.isPinned ? 1 : -1
          const aTime = a.createdAt ? new Date(serializeFirestore(a.createdAt)).getTime() : 0
          const bTime = b.createdAt ? new Date(serializeFirestore(b.createdAt)).getTime() : 0
          return bTime - aTime
        })

        // Enrich each topic
        const topics = await Promise.all(
          topicsRaw.map(async (topic: any) => {
            let topicAuthor: any = null
            if (topic.authorId) {
              const a = await getDoc('users', topic.authorId)
              if (a) topicAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
            }

            // Get replies for topic
            const repliesRaw = await queryDocs('forum_posts', [
              { field: 'topicId', op: '==', value: topic.id },
            ], 'createdAt', 'asc')

            const replies = await Promise.all(
              repliesRaw.map(async (reply: any) => {
                let replyAuthor: any = null
                if (reply.authorId) {
                  const a = await getDoc('users', reply.authorId)
                  if (a) replyAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
                }
                return serializeFirestore({ ...reply, author: replyAuthor })
              })
            )

            // Get likes
            const likes = await queryDocs('forum_likes', [
              { field: 'topicId', op: '==', value: topic.id },
            ])

            return serializeFirestore({
              ...topic,
              author: topicAuthor,
              replies,
              likes: likes.map((l: any) => ({ id: l.id, userId: l.userId })),
              _count: {
                replies: replies.length,
                likes: likes.length,
              },
            })
          })
        )

        return serializeFirestore({
          ...cat,
          topics,
          _count: { topics: topics.length },
        })
      })
    )

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
