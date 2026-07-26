import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all projects (including unpublished) for admin
export async function GET() {
  try {
    const projects = await db.project.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: projects })
  } catch (error) {
    console.error('Admin projects fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch projects' },
      { status: 500 }
    )
  }
}

// POST create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, titleI18n, slug, description, descriptionI18n, client, technologies, demoUrl, isFeatured, isPublished } = body

    const existing = await db.project.findUnique({ where: { slug } })
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const project = await db.project.create({
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        description: description || null,
        descriptionI18n: descriptionI18n || null,
        client: client || null,
        technologies: technologies || null,
        demoUrl: demoUrl || null,
        isFeatured: isFeatured || false,
        isPublished: isPublished || false,
      },
    })
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Admin project create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create project' },
      { status: 500 }
    )
  }
}

// PUT update a project
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, title, titleI18n, slug, description, descriptionI18n, client, technologies, demoUrl, isFeatured, isPublished } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (slug) {
      const existing = await db.project.findUnique({ where: { slug } })
      if (existing && existing.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Slug already exists' },
          { status: 400 }
        )
      }
    }

    const project = await db.project.update({
      where: { id },
      data: {
        title,
        titleI18n: titleI18n || null,
        slug,
        description: description || null,
        descriptionI18n: descriptionI18n || null,
        client: client || null,
        technologies: technologies || null,
        demoUrl: demoUrl || null,
        isFeatured: isFeatured || false,
        isPublished: isPublished || false,
      },
    })
    return NextResponse.json({ success: true, data: project })
  } catch (error) {
    console.error('Admin project update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update project' },
      { status: 500 }
    )
  }
}

// DELETE a project
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

    await db.project.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin project delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
