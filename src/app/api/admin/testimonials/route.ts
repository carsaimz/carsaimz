import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET all testimonials (including unpublished) for admin
export async function GET() {
  try {
    const testimonials = await db.testimonial.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ success: true, data: testimonials })
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

    const testimonial = await db.testimonial.create({
      data: {
        name,
        company: company || null,
        content,
        contentI18n: contentI18n || null,
        rating: rating || 5,
        isPublished: isPublished || false,
      },
    })
    return NextResponse.json({ success: true, data: testimonial })
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

    const testimonial = await db.testimonial.update({
      where: { id },
      data: {
        name,
        company: company || null,
        content,
        contentI18n: contentI18n || null,
        rating: rating || 5,
        isPublished: isPublished || false,
      },
    })
    return NextResponse.json({ success: true, data: testimonial })
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

    await db.testimonial.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin testimonial delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete testimonial' },
      { status: 500 }
    )
  }
}
