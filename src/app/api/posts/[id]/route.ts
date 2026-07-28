import { NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocByField, deleteDoc, deleteMany, createDoc, updateDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await getDoc('posts', id)

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Enrich with author, category, tags, and comments
    let author: any = null
    if (post.authorId) {
      const authorDoc = await getDoc('users', post.authorId)
      if (authorDoc) {
        author = { id: authorDoc.id, name: authorDoc.name, email: authorDoc.email, avatar: authorDoc.avatar }
      }
    }

    let category: any = null
    if (post.categoryId) {
      const catDoc = await getDoc('categories', post.categoryId)
      if (catDoc) {
        category = { id: catDoc.id, name: catDoc.name, slug: catDoc.slug }
      }
    }

    // Get post_tags and then the actual tags
    const postTags = await queryDocs('post_tags', [
      { field: 'postId', op: '==', value: id },
    ])

    const tags = await Promise.all(
      postTags.map(async (pt: any) => {
        if (pt.tagId) {
          const tagDoc = await getDoc('tags', pt.tagId)
          if (tagDoc) return { id: tagDoc.id, name: tagDoc.name, slug: tagDoc.slug }
        }
        return null
      }).filter(Boolean)
    )

    // Get approved comments with authors
    const commentsRaw = await queryDocs('comments', [
      { field: 'postId', op: '==', value: id },
      { field: 'isApproved', op: '==', value: true },
    ], 'createdAt', 'desc')

    const comments = await Promise.all(
      commentsRaw.map(async (c: any) => {
        let commentAuthor: any = null
        if (c.authorId) {
          const a = await getDoc('users', c.authorId)
          if (a) commentAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
        }
        return serializeFirestore({ ...c, author: commentAuthor })
      })
    )

    const formattedPost = serializeFirestore({
      ...post,
      author,
      category,
      tags,
      comments,
    })

    return NextResponse.json({
      success: true,
      data: formattedPost,
    })
  } catch (error) {
    console.error('Post fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch post',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Check that the post exists
    const existing = await getDoc('posts', id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    const {
      title,
      titleI18n,
      slug,
      excerpt,
      excerptI18n,
      content,
      contentI18n,
      featuredImage,
      published,
      categoryId,
      tagIds,
    } = body

    // If slug is being changed, check for duplicates
    if (slug && slug !== existing.slug) {
      const duplicate = await getDocByField('posts', 'slug', slug)
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: 'A post with this slug already exists',
          },
          { status: 409 }
        )
      }
    }

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const titleI18nValue =
      typeof titleI18n === 'object' && titleI18n !== null
        ? buildI18nJson(titleI18n)
        : titleI18n

    const excerptI18nValue =
      typeof excerptI18n === 'object' && excerptI18n !== null
        ? buildI18nJson(excerptI18n)
        : excerptI18n

    const contentI18nValue =
      typeof contentI18n === 'object' && contentI18n !== null
        ? buildI18nJson(contentI18n)
        : contentI18n

    // Build update data object with only provided fields
    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (titleI18nValue !== undefined) updateData.titleI18n = titleI18nValue
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt
    if (excerptI18nValue !== undefined) updateData.excerptI18n = excerptI18nValue
    if (content !== undefined) updateData.content = content
    if (contentI18nValue !== undefined) updateData.contentI18n = contentI18nValue
    if (featuredImage !== undefined) updateData.featuredImage = featuredImage
    if (published !== undefined) updateData.published = published
    if (categoryId !== undefined) updateData.categoryId = categoryId

    await updateDoc('posts', id, updateData)

    // Handle tag updates separately - replace all existing tags
    if (tagIds && Array.isArray(tagIds)) {
      // Delete existing tag connections and create new ones
      await deleteMany('post_tags', [{ field: 'postId', op: '==', value: id }])
      for (const tagId of tagIds) {
        await createDoc('post_tags', { postId: id, tagId })
      }
    }

    // Fetch updated post with enriched data
    const updatedPost = await getDoc('posts', id)

    let author: any = null
    if (updatedPost?.authorId) {
      const authorDoc = await getDoc('users', updatedPost.authorId)
      if (authorDoc) {
        author = { id: authorDoc.id, name: authorDoc.name, email: authorDoc.email, avatar: authorDoc.avatar }
      }
    }

    let category: any = null
    if (updatedPost?.categoryId) {
      const catDoc = await getDoc('categories', updatedPost.categoryId)
      if (catDoc) {
        category = { id: catDoc.id, name: catDoc.name, slug: catDoc.slug }
      }
    }

    // Get tags
    const postTags = await queryDocs('post_tags', [
      { field: 'postId', op: '==', value: id },
    ])
    const tags = await Promise.all(
      postTags.map(async (pt: any) => {
        if (pt.tagId) {
          const tagDoc = await getDoc('tags', pt.tagId)
          if (tagDoc) return { id: tagDoc.id, name: tagDoc.name, slug: tagDoc.slug }
        }
        return null
      }).filter(Boolean)
    )

    const formattedPost = serializeFirestore({
      ...updatedPost,
      author,
      category,
      tags,
    })

    return NextResponse.json({
      success: true,
      data: formattedPost,
    })
  } catch (error) {
    console.error('Post update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update post',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check that the post exists
    const existing = await getDoc('posts', id)
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete related records first (tags, comments)
    await deleteMany('post_tags', [{ field: 'postId', op: '==', value: id }])
    await deleteMany('comments', [{ field: 'postId', op: '==', value: id }])
    await deleteDoc('posts', id)

    return NextResponse.json({
      success: true,
      message: 'Post deleted successfully',
    })
  } catch (error) {
    console.error('Post delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete post',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
