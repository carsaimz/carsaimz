import { NextRequest, NextResponse } from 'next/server'
import { queryDocs, getDocs, countDocs, getDoc, getDocByField, updateDoc, createDocWithId } from '@/lib/db'
import { safeGetDocs, safeGetDoc, safeCountDocs, safeQueryDocs, checkFirebaseAdmin } from '@/lib/db-helpers'
import { getAdminAuth } from '@/lib/firebase-admin'
import { serializeFirestore } from '@/lib/serialize'

// ─── Helper: resolve roleId from role name ───

async function resolveRoleId(roleNameOrId: string): Promise<string | null> {
  // If it looks like a Firestore doc ID (not a plain name), check if it exists directly
  const directRole = await getDoc('roles', roleNameOrId)
  if (directRole) return roleNameOrId

  // Otherwise look up by name
  const roleByName = await getDocByField('roles', 'name', roleNameOrId)
  return roleByName?.id || null
}

// ─── Helper: build a clean user response object ───

async function buildUserResponse(userData: any): Promise<any> {
  const roles = await getDocs('roles')
  const roleMap = new Map(roles.map(r => [r.id, r]))

  const userRole = userData.roleId ? roleMap.get(userData.roleId) : null
  const roleName = userRole?.name || 'user'
  const createdAt = userData.createdAt
    ? (typeof userData.createdAt === 'string' ? userData.createdAt : userData.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString())
    : new Date().toISOString()

  return {
    id: userData.id,
    name: userData.name || '',
    email: userData.email,
    phone: userData.phone,
    role: roleName,
    roleId: userData.roleId,
    avatar: userData.avatar,
    isActive: userData.isActive,
    bio: userData.bio || '',
    company: userData.company || '',
    address: userData.address || '',
    createdAt,
  }
}

// ─── GET — List users (paginated, searchable) ───

export async function GET(request: NextRequest) {
  try {
    // Check if Firebase Admin SDK is configured
    const adminError = checkFirebaseAdmin()
    if (adminError) {
      return NextResponse.json({ success: false, message: adminError }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search') || ''

    // Fetch all users (Firestore doesn't support relation-based filtering)
    const allUsers = await safeGetDocs('users')

    // Fetch all roles so we can join them
    const roles = await safeGetDocs('roles')
    const roleMap = new Map(roles.map(r => [r.id, r]))

    // Filter out super_admin users and apply search
    let filteredUsers = allUsers.filter((u: any) => {
      const userRole = u.roleId ? roleMap.get(u.roleId) : null
      const roleName = userRole?.name || 'user'
      return roleName !== 'super_admin'
    })

    if (search) {
      const searchLower = search.toLowerCase()
      filteredUsers = filteredUsers.filter((u: any) =>
        (u.name && u.name.toLowerCase().includes(searchLower)) ||
        (u.email && u.email.toLowerCase().includes(searchLower)) ||
        (u.phone && u.phone.toLowerCase().includes(searchLower))
      )
    }

    // Sort by createdAt descending
    filteredUsers.sort((a: any, b: any) => {
      try {
        const aTime = a.createdAt ? new Date(typeof a.createdAt === 'string' ? a.createdAt : a.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        const bTime = b.createdAt ? new Date(typeof b.createdAt === 'string' ? b.createdAt : b.createdAt?.toDate?.()?.toISOString?.() || 0).getTime() : 0
        return bTime - aTime
      } catch {
        return 0
      }
    })

    // Paginate
    const total = filteredUsers.length
    const start = (page - 1) * limit
    const paginatedUsers = filteredUsers.slice(start, start + limit)

    // Map users to clean format
    const mappedUsers = paginatedUsers.map((u: any) => {
      const userRole = u.roleId ? roleMap.get(u.roleId) : null
      const roleName = userRole?.name || 'user'
      const createdAt = u.createdAt
        ? (typeof u.createdAt === 'string' ? u.createdAt : u.createdAt?.toDate?.()?.toISOString?.() || new Date().toISOString())
        : new Date().toISOString()

      return {
        id: u.id,
        name: u.name || '',
        email: u.email,
        phone: u.phone,
        role: roleName,
        roleId: u.roleId,
        avatar: u.avatar,
        isActive: u.isActive,
        bio: u.bio || '',
        company: u.company || '',
        address: u.address || '',
        createdAt,
      }
    })

    return NextResponse.json({
      success: true,
      data: mappedUsers,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Users fetch error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch users',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── POST — Create a new user ───

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, phone, password, role, bio, company, address } = body

    // Validate required fields
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: 'Name, email, and password are required' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if user already exists in Firestore
    const existingUser = await getDocByField('users', 'email', email)
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists' },
        { status: 409 }
      )
    }

    // Resolve role
    const roleName = role || 'user'
    const roleId = await resolveRoleId(roleName)
    if (!roleId) {
      return NextResponse.json(
        { success: false, message: `Role "${roleName}" not found` },
        { status: 400 }
      )
    }

    // Create Firebase Auth user
    const adminAuth = getAdminAuth()
    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: name,
      phoneNumber: phone || undefined,
    })

    const uid = userRecord.uid

    // Create Firestore profile
    await createDocWithId('users', uid, {
      name,
      email,
      phone: phone || '',
      roleId,
      avatar: '',
      bio: bio || '',
      company: company || '',
      address: address || '',
      isActive: true,
    })

    // Fetch the created profile to return
    const createdUser = await getDoc('users', uid)
    const responseData = await buildUserResponse(createdUser)

    return NextResponse.json(
      { success: true, data: responseData, message: 'User created successfully' },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('User creation error:', error)

    // Handle Firebase Auth specific errors
    if (error?.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { success: false, message: 'A user with this email already exists in Firebase Auth' },
        { status: 409 }
      )
    }
    if (error?.code === 'auth/invalid-email') {
      return NextResponse.json(
        { success: false, message: 'Invalid email address' },
        { status: 400 }
      )
    }
    if (error?.code === 'auth/weak-password') {
      return NextResponse.json(
        { success: false, message: 'Password is too weak (minimum 6 characters)' },
        { status: 400 }
      )
    }
    if (error?.code === 'auth/invalid-phone-number') {
      return NextResponse.json(
        { success: false, message: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── PUT — Update an existing user ───

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required (?id=userId)' },
        { status: 400 }
      )
    }

    // Fetch existing user
    const existingUser = await getDoc('users', userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    const body = await request.json()
    const { name, email, phone, role, bio, company, address, isActive } = body

    // Build the Firestore update object (only include fields that were provided)
    const updateData: Record<string, any> = {}

    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone
    if (bio !== undefined) updateData.bio = bio
    if (company !== undefined) updateData.company = company
    if (address !== undefined) updateData.address = address
    if (isActive !== undefined) updateData.isActive = isActive

    // Handle role change
    if (role !== undefined) {
      const roleId = await resolveRoleId(role)
      if (!roleId) {
        return NextResponse.json(
          { success: false, message: `Role "${role}" not found` },
          { status: 400 }
        )
      }
      updateData.roleId = roleId
    }

    // Update Firestore profile
    await updateDoc('users', userId, updateData)

    // Update Firebase Auth properties if needed
    const authUpdate: Record<string, any> = {}
    if (name !== undefined) authUpdate.displayName = name
    if (email !== undefined && email !== existingUser.email) {
      authUpdate.email = email
    }
    if (phone !== undefined) {
      authUpdate.phoneNumber = phone || undefined
    }

    if (Object.keys(authUpdate).length > 0) {
      try {
        const adminAuth = getAdminAuth()
        await adminAuth.updateUser(userId, authUpdate)
      } catch (authError: any) {
        console.error('Firebase Auth update error:', authError)
        // Roll back Firestore update if Auth update fails critically
        if (authError?.code === 'auth/user-not-found') {
          // User doesn't exist in Auth — this is fine, Firestore is the source of truth
          console.warn(`User ${userId} not found in Firebase Auth, skipping Auth update`)
        } else if (authError?.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { success: false, message: 'A user with this email already exists in Firebase Auth' },
            { status: 409 }
          )
        } else if (authError?.code === 'auth/invalid-email') {
          return NextResponse.json(
            { success: false, message: 'Invalid email address' },
            { status: 400 }
          )
        } else if (authError?.code === 'auth/invalid-phone-number') {
          return NextResponse.json(
            { success: false, message: 'Invalid phone number format' },
            { status: 400 }
          )
        } else {
          // Other Auth errors — log but don't block the Firestore update
          console.warn('Firebase Auth update failed, but Firestore profile was updated:', authError.message)
        }
      }
    }

    // Fetch the updated user and return
    const updatedUser = await getDoc('users', userId)
    const responseData = await buildUserResponse(updatedUser)

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'User updated successfully',
    })
  } catch (error) {
    console.error('User update error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

// ─── DELETE — Deactivate a user (soft delete) ───

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('id')

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID is required (?id=userId)' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await getDoc('users', userId)
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      )
    }

    // Already deactivated?
    if (existingUser.isActive === false) {
      return NextResponse.json(
        { success: false, message: 'User is already deactivated' },
        { status: 400 }
      )
    }

    // Soft delete: set isActive to false
    await updateDoc('users', userId, { isActive: false })

    // Optionally disable the Firebase Auth account as well
    try {
      const adminAuth = getAdminAuth()
      await adminAuth.updateUser(userId, { disabled: true })
    } catch (authError: any) {
      // If the user doesn't exist in Auth, just skip
      if (authError?.code === 'auth/user-not-found') {
        console.warn(`User ${userId} not found in Firebase Auth, skipping Auth disable`)
      } else {
        console.warn('Firebase Auth disable failed, but Firestore profile was deactivated:', authError.message)
      }
    }

    // Fetch the updated user and return
    const updatedUser = await getDoc('users', userId)
    const responseData = await buildUserResponse(updatedUser)

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'User deactivated successfully',
    })
  } catch (error) {
    console.error('User deactivation error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to deactivate user',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
