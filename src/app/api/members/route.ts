import { NextResponse } from 'next/server'
import { queryDocs } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'

export async function GET() {
  try {
    const members = await queryDocs('members', [
      { field: 'isPublished', op: '==', value: true },
    ], 'order', 'asc')

    // Select only public-safe fields
    const publicMembers = members.map((m: any) => ({
      id: m.id,
      name: m.name,
      nameI18n: m.nameI18n,
      role: m.role,
      roleI18n: m.roleI18n,
      description: m.description,
      descriptionI18n: m.descriptionI18n,
      image: m.image,
      email: m.email,
      phone: m.phone,
      whatsapp: m.whatsapp,
      linkedin: m.linkedin,
      github: m.github,
      twitter: m.twitter,
      facebook: m.facebook,
      website: m.website,
      order: m.order,
      createdAt: serializeFirestore(m.createdAt),
    }))

    return NextResponse.json({
      success: true,
      data: publicMembers,
      count: publicMembers.length,
    })
  } catch (error) {
    console.error('Members fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch members',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
