import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const post = await db.post.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
        comments: {
          where: { isApproved: true },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!post) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Transform tags to a cleaner format
    const formattedPost = {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }

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
    const existing = await db.post.findUnique({ where: { id } })
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
      const duplicate = await db.post.findUnique({ where: { slug } })
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
    const updateData: Record<string, unknown> = {}
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

    // Handle tag updates separately - replace all existing tags
    if (tagIds && Array.isArray(tagIds)) {
      // Delete existing tag connections and create new ones
      await db.postTag.deleteMany({ where: { postId: id } })
      updateData.tags = {
        create: tagIds.map((tagId: string) => ({
          tag: { connect: { id: tagId } },
        })),
      }
    }

    const post = await db.post.update({
      where: { id },
      data: updateData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        tags: {
          include: {
            tag: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    })

    // Transform tags to a cleaner format
    const formattedPost = {
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }

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
    const existing = await db.post.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Post not found' },
        { status: 404 }
      )
    }

    // Delete related records first (tags, comments)
    await db.postTag.deleteMany({ where: { postId: id } })
    await db.comment.deleteMany({ where: { postId: id } })
    await db.post.delete({ where: { id } })

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
