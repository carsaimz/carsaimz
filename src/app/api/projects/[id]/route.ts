import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { buildI18nJson } from '@/lib/i18n-content'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const project = await db.project.findUnique({
      where: { id },
    })

    if (!project) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Project fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch project',
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

    // Check that the project exists
    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

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

    // If slug is being changed, check for duplicates
    if (slug && slug !== existing.slug) {
      const duplicate = await db.project.findUnique({ where: { slug } })
      if (duplicate) {
        return NextResponse.json(
          {
            success: false,
            message: 'A project with this slug already exists',
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

    const descriptionI18nValue =
      typeof descriptionI18n === 'object' && descriptionI18n !== null
        ? buildI18nJson(descriptionI18n)
        : descriptionI18n

    // Build update data object with only provided fields
    const updateData: Record<string, unknown> = {}
    if (slug !== undefined) updateData.slug = slug
    if (title !== undefined) updateData.title = title
    if (titleI18nValue !== undefined) updateData.titleI18n = titleI18nValue
    if (description !== undefined) updateData.description = description
    if (descriptionI18nValue !== undefined) updateData.descriptionI18n = descriptionI18nValue
    if (client !== undefined) updateData.client = client
    if (technologies !== undefined) updateData.technologies = technologies
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl
    if (images !== undefined) updateData.images = images
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured
    if (isPublished !== undefined) updateData.isPublished = isPublished

    const project = await db.project.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update project',
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

    // Check that the project exists
    const existing = await db.project.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { success: false, message: 'Project not found' },
        { status: 404 }
      )
    }

    await db.project.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: 'Project deleted successfully',
    })
  } catch (error) {
    console.error('Project delete error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete project',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
