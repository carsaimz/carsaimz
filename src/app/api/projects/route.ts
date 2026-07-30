import { NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { queryDocs, getDocByField, createDoc, getDoc } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    // Try indexed query first (requires Firestore composite index)
    let projects = await safeQueryDocs('projects', [
      { field: 'isPublished', op: '==', value: true },
    ], 'createdAt', 'desc')

    // Fallback: if indexed query returns empty, try fetching all and filtering client-side
    if (projects.length === 0) {
      const allProjects = await safeGetDocs('projects')
      projects = allProjects
        .filter((p: any) => p.isPublished === true)
        .sort((a: any, b: any) => {
          const toMs = (val: any) => {
            if (!val) return 0
            // Firestore Timestamp objects have .seconds and .nanoseconds
            if (val.seconds !== undefined) return val.seconds * 1000 + (val.nanoseconds || 0) / 1e6
            return new Date(val).getTime()
          }
          return toMs(b.createdAt) - toMs(a.createdAt)
        })
    }

    return NextResponse.json({
      success: true,
      data: serializeFirestore(projects),
      count: projects.length,
    })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects', error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const {
      slug,
      title,
      titleI18n,
      description,
      descriptionI18n,
      client,
      technologies,
      demoUrl,
      images,
      isFeatured,
      isPublished,
    } = body

    // Validate required fields
    if (!slug || !title) {
      return NextResponse.json(
        {
          success: false,
          message: 'slug and title are required fields',
        },
        { status: 400 }
      )
    }

    // Check for duplicate slug
    const existing = await getDocByField('projects', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        {
          success: false,
          message: 'A project with this slug already exists',
        },
        { status: 409 }
      )
    }

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const titleI18nValue =
      typeof titleI18n === 'object' && titleI18n !== null
        ? buildI18nJson(titleI18n)
        : titleI18n

    const descriptionI18nValue =
      typeof descriptionI18n === 'object' && descriptionI18n !== null
        ? buildI18nJson(descriptionI18n)
        : descriptionI18n

    const projectId = await createDoc('projects', {
      slug,
      title,
      titleI18n: titleI18nValue ?? null,
      description: description ?? null,
      descriptionI18n: descriptionI18nValue ?? null,
      client: client ?? null,
      technologies: Array.isArray(technologies) ? technologies.join(', ') : (technologies ?? null),
      demoUrl: demoUrl ?? null,
      images: images ?? null,
      isFeatured: isFeatured ?? false,
      isPublished: isPublished ?? true,
    })

    const project = await getDoc('projects', projectId)

    return NextResponse.json({
      success: true,
      data: serializeFirestore(project),
    }, { status: 201 })
  } catch (error) {
    console.error('Project creation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
