import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('postId')

    if (!postId) {
      return NextResponse.json(
        { success: false, message: 'postId query parameter is required' },
        { status: 400 }
      )
    }

    // Verify the post exists
    const post = await getDoc('posts', postId)

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Get approved comments for this post
    const comments = await queryDocs('comments', [
      { field: 'postId', op: '==', value: postId },
      { field: 'isApproved', op: '==', value: true },
    ], 'createdAt', 'desc')

    // Enrich each comment with author data
    const enrichedComments = await Promise.all(
      comments.map(async (comment: any) => {
        let author: any = null
        if (comment.authorId) {
          const authorDoc = await getDoc('users', comment.authorId)
          if (authorDoc) {
            author = {
              id: authorDoc.id,
              name: authorDoc.name,
              email: authorDoc.email,
              avatar: authorDoc.avatar,
            }
          }
        }
        return serializeFirestore({ ...comment, author })
      })
    )

    return NextResponse.json({
      success: true,
      data: enrichedComments,
      count: enrichedComments.length,
    })
  } catch (error) {
    console.error('Comments fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch comments',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
