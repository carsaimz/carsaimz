import { NextRequest, NextResponse } from 'next/server'
import { queryDocs, createDoc, updateDoc, getDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

// GET all testimonials (including unpublished) for admin
export async function GET() {
  try {
    const testimonials = await queryDocs('testimonials', [], 'createdAt', 'desc')
    return NextResponse.json({ success: true, data: serializeFirestore(testimonials) })
  } catch (error) {
    console.error('Admin testimonials fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch testimonials' },
      { status: 500 }
    )
  }
}

// POST create a new testimonial
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, company, content, contentI18n, rating, isPublished } = body

    if (!name || !content) {
      return NextResponse.json(
        { success: false, message: 'Name and content are required' },
        { status: 400 }
      )
    }

    const testimonialId = await createDoc('testimonials', {
      name,
      company: company || null,
      content,
      contentI18n: contentI18n || null,
      rating: rating || 5,
      isPublished: isPublished || false,
    })

    const testimonial = await getDoc('testimonials', testimonialId)
    return NextResponse.json({ success: true, data: serializeFirestore(testimonial) })
  } catch (error) {
    console.error('Admin testimonial create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create testimonial' },
      { status: 500 }
    )
  }
}

// PUT update a testimonial
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, company, content, contentI18n, rating, isPublished } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (company !== undefined) updateData.company = company || null
    if (content !== undefined) updateData.content = content
    if (contentI18n !== undefined) updateData.contentI18n = contentI18n || null
    if (rating !== undefined) updateData.rating = rating || 5
    if (isPublished !== undefined) updateData.isPublished = isPublished || false

    await updateDoc('testimonials', id, updateData)
    const testimonial = await getDoc('testimonials', id)
    return NextResponse.json({ success: true, data: serializeFirestore(testimonial) })
  } catch (error) {
    console.error('Admin testimonial update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update testimonial' },
      { status: 500 }
    )
  }
}

// DELETE a testimonial
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

    await deleteDoc('testimonials', id)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin testimonial delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
}
