import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getDocByField, createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all projects (including unpublished) for admin
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const projects = await safeQueryDocs('projects', [], 'createdAt', 'desc')
    return NextResponse.json({ success: true, data: serializeFirestore(projects) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { title, titleI18n, slug, description, descriptionI18n, client, technologies, demoUrl, isFeatured, isPublished } = body

    const existing = await getDocByField('projects', 'slug', slug)
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Slug already exists' },
        { status: 400 }
      )
    }

    const projectId = await createDoc('projects', {
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
    })

    const project = await safeGetDoc('projects', projectId)
    return NextResponse.json({ success: true, data: serializeFirestore(project) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { id, title, titleI18n, slug, description, descriptionI18n, client, technologies, demoUrl, isFeatured, isPublished } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    if (slug) {
      const existing = await getDocByField('projects', 'slug', slug)
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
    if (description !== undefined) updateData.description = description || null
    if (descriptionI18n !== undefined) updateData.descriptionI18n = descriptionI18n || null
    if (client !== undefined) updateData.client = client || null
    if (technologies !== undefined) updateData.technologies = technologies || null
    if (demoUrl !== undefined) updateData.demoUrl = demoUrl || null
    if (isFeatured !== undefined) updateData.isFeatured = isFeatured || false
    if (isPublished !== undefined) updateData.isPublished = isPublished || false

    await updateDoc('projects', id, updateData)
    const project = await safeGetDoc('projects', id)
    return NextResponse.json({ success: true, data: serializeFirestore(project) })
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
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    await deleteDoc('projects', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin project delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete project' },
      { status: 500 }
    )
  }
}
