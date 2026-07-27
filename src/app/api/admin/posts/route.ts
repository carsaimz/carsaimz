import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all posts (including unpublished) for admin
export async function GET() {
  try {
    const posts = await db.post.findMany({
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        category: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: posts })
  } catch (error) {
    console.error('Admin posts fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch posts' },
      { status: 500 }
    )
  }
}

// POST create a new post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleI18n, slug, excerpt, excerptI18n, content, contentI18n, categoryId, published, authorId } = body

    const existing = await db.post.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const post = await db.post.create({
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        excerpt: excerpt || null,
        excerptI18n: excerptI18n || null,
        content: content || null,
        contentI18n: contentI18n || null,
        authorId: authorId || 'default-author',
        categoryId: categoryId || null,
        published: published || false,
      },
    })
    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Admin post create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create post' },
      { status: 500 }
    )
  }
}

// PUT update a post
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, titleI18n, slug, excerpt, excerptI18n, content, contentI18n, categoryId, published } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (slug) {
      const existing = await db.post.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const post = await db.post.update({
      where: { id },
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        excerpt: excerpt || null,
        excerptI18n: excerptI18n || null,
        content: content || null,
        contentI18n: contentI18n || null,
        categoryId: categoryId || null,
        published: published || false,
      },
    })
    return NextResponse.json({ success: true, data: post })
  } catch (error) {
    console.error('Admin post update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update post' },
      { status: 500 }
    )
  }
}

// DELETE a post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    // Delete related comments and tags first
    await db.comment.deleteMany({ where: { postId: id } })
    await db.postTag.deleteMany({ where: { postId: id } })
    await db.post.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin post delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
