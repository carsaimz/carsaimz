import { NextRequest, NextResponse } from 'next/server'
import { getDoc, queryDocs, getDocByField, createDoc, getDocs } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get('slug')

    if (slug) {
      // Fetch a single post by slug
      const post = await getDocByField('posts', 'slug', slug)

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

      // Get post tags
      const postTags = await queryDocs('post_tags', [
        { field: 'postId', op: '==', value: post.id },
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

      // Get approved comments
      const commentsRaw = await queryDocs('comments', [
        { field: 'postId', op: '==', value: post.id },
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
    }

    // Fetch all published posts
    const posts = await queryDocs('posts', [
      { field: 'published', op: '==', value: true },
    ], 'createdAt', 'desc')

    // Enrich each post
    const formattedPosts = await Promise.all(
      posts.map(async (post: any) => {
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

        // Get tags for this post
        const postTags = await queryDocs('post_tags', [
          { field: 'postId', op: '==', value: post.id },
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

        // Get approved comments
        const commentsRaw = await queryDocs('comments', [
          { field: 'postId', op: '==', value: post.id },
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

        return serializeFirestore({
          ...post,
          author,
          category,
          tags,
          comments,
        })
      })
    )

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
    const existing = await getDocByField('posts', 'slug', slug)
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
    const author = await getDoc('users', authorId)
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
    const postId = await createDoc('posts', {
      title,
      titleI18n: titleI18nValue ?? null,
      slug,
      excerpt: excerpt ?? null,
      excerptI18n: excerptI18nValue ?? null,
      content: content ?? null,
      contentI18n: contentI18nValue ?? null,
      featuredImage: featuredImage ?? null,
      published: published ?? false,
      authorId,
      categoryId: categoryId ?? null,
    })

    // Create tag connections
    if (tagIds && Array.isArray(tagIds) && tagIds.length > 0) {
      for (const tagId of tagIds) {
        await createDoc('post_tags', { postId, tagId })
      }
    }

    // Fetch and enrich the created post
    const createdPost = await getDoc('posts', postId)

    let postAuthor: any = null
    if (createdPost?.authorId) {
      const a = await getDoc('users', createdPost.authorId)
      if (a) {
        postAuthor = { id: a.id, name: a.name, email: a.email, avatar: a.avatar }
      }
    }

    let postCategory: any = null
    if (createdPost?.categoryId) {
      const c = await getDoc('categories', createdPost.categoryId)
      if (c) {
        postCategory = { id: c.id, name: c.name, slug: c.slug }
      }
    }

    // Get tags
    const postTags = await queryDocs('post_tags', [
      { field: 'postId', op: '==', value: postId },
    ])
    const postTagList = await Promise.all(
      postTags.map(async (pt: any) => {
        if (pt.tagId) {
          const t = await getDoc('tags', pt.tagId)
          if (t) return { id: t.id, name: t.name, slug: t.slug }
        }
        return null
      }).filter(Boolean)
    )

    const formattedPost = serializeFirestore({
      ...createdPost,
      author: postAuthor,
      category: postCategory,
      tags: postTagList,
    })

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
