import { NextRequest, NextResponse } from 'next/server'
import { safeQueryDocs, safeGetDoc, checkFirebaseAdmin } from '@/lib/db-helpers'
import { createDoc, updateDoc, deleteDoc } from '@/lib/db'
import { serializeFirestore } from '@/lib/serialize'
import { buildI18nJson } from '@/lib/i18n-content'
import { invalidateKnowledgeCache } from '@/lib/chat-knowledge'

// GET all members (including unpublished) for admin
export async function GET() {
  try {
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json(
        { success: false, message: adminError },
        { status: 503 }
      )
    }

    const members = await safeQueryDocs('members', [], 'order', 'asc')
    return NextResponse.json({ success: true, data: serializeFirestore(members) })
  } catch (error) {
    console.error('Admin members fetch error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to fetch members' },
      { status: 500 }
    )
  }
}

// POST create a new member
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
    const {
      name,
      nameI18n,
      role,
      roleI18n,
      description,
      descriptionI18n,
      image,
      email,
      phone,
      whatsapp,
      linkedin,
      github,
      twitter,
      facebook,
      website,
      order,
      isPublished,
    } = body

    if (!name || !role) {
      return NextResponse.json(
        { success: false, message: 'Name and role are required' },
        { status: 400 }
      )
    }

    // Build i18n JSON strings if provided as objects, otherwise use as-is
    const nameI18nValue =
      typeof nameI18n === 'object' && nameI18n !== null
        ? buildI18nJson(nameI18n)
        : nameI18n
    const roleI18nValue =
      typeof roleI18n === 'object' && roleI18n !== null
        ? buildI18nJson(roleI18n)
        : roleI18n
    const descriptionI18nValue =
      typeof descriptionI18n === 'object' && descriptionI18n !== null
        ? buildI18nJson(descriptionI18n)
        : descriptionI18n

    const memberId = await createDoc('members', {
      name,
      nameI18n: nameI18nValue || null,
      role,
      roleI18n: roleI18nValue || null,
      description: description || null,
      descriptionI18n: descriptionI18nValue || null,
      image: image || null,
      email: email || null,
      phone: phone || null,
      whatsapp: whatsapp || null,
      linkedin: linkedin || null,
      github: github || null,
      twitter: twitter || null,
      facebook: facebook || null,
      website: website || null,
      order: order ?? 0,
      isPublished: isPublished ?? false,
    })

    const member = await safeGetDoc('members', memberId)
    try { invalidateKnowledgeCache() } catch { /* ignore */ }
    return NextResponse.json({ success: true, data: serializeFirestore(member) }, { status: 201 })
  } catch (error) {
    console.error('Admin member create error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to create member' },
      { status: 500 }
    )
  }
}

// PUT update a member
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
    const {
      id,
      name,
      nameI18n,
      role,
      roleI18n,
      description,
      descriptionI18n,
      image,
      email,
      phone,
      whatsapp,
      linkedin,
      github,
      twitter,
      facebook,
      website,
      order,
      isPublished,
    } = body

    if (!id) {
      return NextResponse.json(
        { success: false, message: 'ID is required' },
        { status: 400 }
      )
    }

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (nameI18n !== undefined) {
      updateData.nameI18n = (typeof nameI18n === 'object' && nameI18n !== null)
        ? buildI18nJson(nameI18n)
        : (nameI18n || null)
    }
    if (role !== undefined) updateData.role = role
    if (roleI18n !== undefined) {
      updateData.roleI18n = (typeof roleI18n === 'object' && roleI18n !== null)
        ? buildI18nJson(roleI18n)
        : (roleI18n || null)
    }
    if (description !== undefined) updateData.description = description || null
    if (descriptionI18n !== undefined) {
      updateData.descriptionI18n = (typeof descriptionI18n === 'object' && descriptionI18n !== null)
        ? buildI18nJson(descriptionI18n)
        : (descriptionI18n || null)
    }
    if (image !== undefined) updateData.image = image || null
    if (email !== undefined) updateData.email = email || null
    if (phone !== undefined) updateData.phone = phone || null
    if (whatsapp !== undefined) updateData.whatsapp = whatsapp || null
    if (linkedin !== undefined) updateData.linkedin = linkedin || null
    if (github !== undefined) updateData.github = github || null
    if (twitter !== undefined) updateData.twitter = twitter || null
    if (facebook !== undefined) updateData.facebook = facebook || null
    if (website !== undefined) updateData.website = website || null
    if (order !== undefined) updateData.order = order ?? 0
    if (isPublished !== undefined) updateData.isPublished = isPublished ?? false

    await updateDoc('members', id, updateData)
    const member = await safeGetDoc('members', id)
    try { invalidateKnowledgeCache() } catch { /* ignore */ }
    return NextResponse.json({ success: true, data: serializeFirestore(member) })
  } catch (error) {
    console.error('Admin member update error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to update member' },
      { status: 500 }
    )
  }
}

// DELETE a member
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

    await deleteDoc('members', id)
    try { invalidateKnowledgeCache() } catch { /* ignore */ }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin member delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Failed to delete member' },
      { status: 500 }
    )
  }
}
