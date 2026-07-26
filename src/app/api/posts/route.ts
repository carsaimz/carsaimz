import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      // Fetch a single post by slug with full details including comments
      const post = await db.post.findUnique({
        where: { slug },
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
    }

    // Fetch all published posts with comments included
    const posts = await db.post.findMany({
      where: { published: true },
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
      orderBy: { createdAt: 'desc' },
    })

    // Transform tags to a cleaner format
    const formattedPosts = posts.map((post) => ({
      ...post,
      tags: post.tags.map((pt) => pt.tag),
    }))

    return NextResponse.json({
      success: true,
      data: formattedPosts,
      count: formattedPosts.length,
    })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch posts',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

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
      authorId,
      categoryId,
      tagIds,
    } = body

    // Validate required fields
    if (!slug || !title || !authorId) {
      return NextResponse.json(
        {
          success: false,
          message: 'slug, title, and authorId are required fields',
        },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await db.post.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'A post with this slug already exists',
        },
        { status: 409 }
      )
    }

    // Verify author exists
    const author = await db.user.findUnique({ where: { id: authorId } })
    if (!author) {
      return NextResponse.json(
        {
          success: false,
          message: 'Author not found',
        },
        { status: 400 }
      )
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

    // Create the post
    const post = await db.post.create({
      data: {
        title,
        titleI18n: titleI18nValue ?? undefined,
        slug,
        excerpt: excerpt ?? undefined,
        excerptI18n: excerptI18nValue ?? undefined,
        content: content ?? undefined,
        contentI18n: contentI18nValue ?? undefined,
        featuredImage: featuredImage ?? undefined,
        published: published ?? false,
        authorId,
        categoryId: categoryId ?? undefined,
        tags: tagIds && Array.isArray(tagIds) && tagIds.length > 0
          ? {
              create: tagIds.map((tagId: string) => ({
                tag: { connect: { id: tagId } },
              })),
            }
          : undefined,
      },
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
    }, { status: 201 })
  } catch (error) {
    console.error('Post creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create post',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
