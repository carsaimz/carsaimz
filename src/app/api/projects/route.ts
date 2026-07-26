import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET() {
  try {
    const projects = await db.project.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      success: true,
      data: projects,
      count: projects.length,
    })
  } catch (error) {
    console.error('Projects fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch projects',
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
    const existing = await db.project.findUnique({ where: { slug } })
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

    const project = await db.project.create({
      data: {
        slug,
        title,
        titleI18n: titleI18nValue ?? undefined,
        description: description ?? undefined,
        descriptionI18n: descriptionI18nValue ?? undefined,
        client: client ?? undefined,
        technologies: technologies ?? undefined,
        demoUrl: demoUrl ?? undefined,
        images: images ?? undefined,
        isFeatured: isFeatured ?? false,
        isPublished: isPublished ?? true,
      },
    })

    return NextResponse.json({
      success: true,
      data: project,
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
