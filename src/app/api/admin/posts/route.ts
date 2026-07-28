import { NextRequest, NextResponse } from 'next/server'
import { queryDocs, getDocByField, createDoc, updateDoc, getDoc, deleteDoc, deleteMany } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all posts (including unpublished) for admin
export async function GET() {
  try {
    const posts = await queryDocs('posts', [], 'createdAt', 'desc')

    // Enrich with author and category data
    const enrichedPosts = await Promise.all(
      posts.map(async (post: any) => {
        let author: any = null
        let category: any = null

        if (post.authorId) {
          author = await getDoc('users', post.authorId)
          if (author) {
            author = { id: author.id, name: author.name, email: author.email }
          }
        }

        if (post.categoryId) {
          category = await getDoc('categories', post.categoryId)
          if (category) {
            category = { id: category.id, name: category.name, slug: category.slug }
          }
        }

        return serializeFirestore({ ...post, author, category })
      })
    )

    return NextResponse.json({ success: true, data: enrichedPosts })
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

    const existing = await getDocByField('posts', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const postId = await createDoc('posts', {
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
    })

    const post = await getDoc('posts', postId)
    return NextResponse.json({ success: true, data: serializeFirestore(post) })
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
      const existing = await getDocByField('posts', 'slug', slug)
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const updateData: Record<string, any> = {}
    if (title !== undefined) updateData.title = title
    if (titleI18n !== undefined) updateData.titleI18n = titleI18n || null
    if (slug !== undefined) updateData.slug = slug
    if (excerpt !== undefined) updateData.excerpt = excerpt || null
    if (excerptI18n !== undefined) updateData.excerptI18n = excerptI18n || null
    if (content !== undefined) updateData.content = content || null
    if (contentI18n !== undefined) updateData.contentI18n = contentI18n || null
    if (categoryId !== undefined) updateData.categoryId = categoryId || null
    if (published !== undefined) updateData.published = published || false

    await updateDoc('posts', id, updateData)
    const post = await getDoc('posts', id)
    return NextResponse.json({ success: true, data: serializeFirestore(post) })
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
    await deleteMany('comments', [{ field: 'postId', op: '==', value: id }])
    await deleteMany('post_tags', [{ field: 'postId', op: '==', value: id }])
    await deleteDoc('posts', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin post delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete post' },
      { status: 500 }
    )
  }
}
