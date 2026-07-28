#!/usr/bin/env node

/**
 * Carsai Mozambique - Database Seed Script
 * 
 * Seeds the local SQLite database with essential roles, permissions,
 * super_admin user, and site settings.
 * 
 * Run: node scripts/seed.js
 */

const { PrismaClient } = require('@prisma/client')
const { createHash } = require('crypto')

const db = new PrismaClient()

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

async function seed() {
  console.log('[Seed] Starting database seed...')

  // ── 1. Create essential roles ──
  const roles = ['super_admin', 'admin', 'partner', 'user']
  for (const roleName of roles) {
    const existing = await db.role.findFirst({ where: { name: roleName } })
    if (!existing) {
      await db.role.create({
        data: { name: roleName, description: `${roleName} role` },
      })
      console.log(`[Seed] Created role: ${roleName}`)
    } else {
      console.log(`[Seed] Role already exists: ${roleName}`)
    }
  }

  // ── 2. Create super_admin user ──
  const superAdminRole = await db.role.findFirst({ where: { name: 'super_admin' } })
  
  const superAdminEmail = 'carsaimozambique@gmail.com'
  const existingAdmin = await db.user.findUnique({ where: { email: superAdminEmail } })
  
  if (!existingAdmin) {
    await db.user.create({
      data: {
        name: 'Carimo Saide Mpinda',
        email: superAdminEmail,
        passwordHash: hashPassword('Carnanda23'),
        phone: '847545020',
        company: 'Carsai Mozambique',
        bio: 'CEO & Founder of Carsai Mozambique',
        address: 'Montepuez, Cabo Delgado, Mozambique',
        roleId: superAdminRole.id,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log('[Seed] Created super_admin user: carsaimozambique@gmail.com')
  } else {
    console.log('[Seed] super_admin user already exists')
  }

  // ── 3. Create admin user ──
  const adminRole = await db.role.findFirst({ where: { name: 'admin' } })
  
  const adminEmail = 'suporte.carsaimz@gmail.com'
  const existingAdminUser = await db.user.findUnique({ where: { email: adminEmail } })
  
  if (!existingAdminUser) {
    await db.user.create({
      data: {
        name: 'Carsai Support',
        email: adminEmail,
        passwordHash: hashPassword('CarsaiAdmin2025'),
        phone: '874512581',
        company: 'Carsai Mozambique',
        roleId: adminRole.id,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log('[Seed] Created admin user: suporte.carsaimz@gmail.com')
  } else {
    console.log('[Seed] admin user already exists')
  }

  // ── 4. Create site settings ──
  const settings = [
    { key: 'site_name', value: 'Carsai Mozambique' },
    { key: 'site_email', value: 'carsaimozambique@gmail.com' },
    { key: 'support_email', value: 'suporte.carsaimz@gmail.com' },
    { key: 'phone_mpesa', value: '847545020' },
    { key: 'phone_support', value: '874512581' },
    { key: 'whatsapp', value: 'https://wa.me/258847545020' },
    { key: 'address', value: 'Montepuez, Cabo Delgado, Mozambique' },
    { key: 'currency', value: 'MT (Mozambican Metical)' },
    { key: 'website', value: 'https://carsai.mz' },
    { key: 'github', value: 'https://github.com/carsaimz' },
    { key: 'facebook', value: 'https://facebook.com/carsaimz' },
    { key: 'instagram', value: 'https://instagram.com/carsaimz' },
    { key: 'twitter', value: 'https://twitter.com/carsaimz' },
    { key: 'linkedin', value: 'https://linkedin.com/company/carsaimz' },
    { key: 'youtube', value: 'https://youtube.com/@carsaimz' },
    { key: 'tiktok', value: 'https://tiktok.com/@carsaimz' },
  ]

  for (const setting of settings) {
    const existing = await db.setting.findFirst({ where: { key: setting.key } })
    if (!existing) {
      await db.setting.create({ data: setting })
      console.log(`[Seed] Created setting: ${setting.key}`)
    }
  }

  // ── 5. Create basic permissions ──
  const permissions = [
    { name: 'manage_users', description: 'Create, edit, delete users' },
    { name: 'manage_content', description: 'Create, edit, delete content (posts, pages, services)' },
    { name: 'manage_settings', description: 'Edit site settings' },
    { name: 'manage_financial', description: 'View and manage quotes, proposals, invoices, payments' },
    { name: 'manage_forum', description: 'Moderate forum topics and replies' },
    { name: 'manage_support', description: 'Handle support tickets' },
    { name: 'view_analytics', description: 'View dashboard analytics and stats' },
    { name: 'manage_ai_providers', description: 'Configure AI providers for chatbot' },
  ]

  for (const perm of permissions) {
    const existing = await db.permission.findFirst({ where: { name: perm.name } })
    if (!existing) {
      await db.permission.create({ data: perm })
    }
  }

  // ── 6. Assign all permissions to super_admin ──
  const allPermissions = await db.permission.findMany()
  const superAdminRoleWithPerms = await db.role.findFirst({ where: { name: 'super_admin' } })
  
  for (const perm of allPermissions) {
    const existing = await db.rolePermission.findFirst({
      where: { roleId: superAdminRoleWithPerms.id, permissionId: perm.id },
    })
    if (!existing) {
      await db.rolePermission.create({
        data: { roleId: superAdminRoleWithPerms.id, permissionId: perm.id },
      })
    }
  }
  console.log('[Seed] Assigned all permissions to super_admin')

  // ── 7. Assign basic permissions to admin ──
  const adminRoleWithPerms = await db.role.findFirst({ where: { name: 'admin' } })
  const adminPermNames = ['manage_users', 'manage_content', 'manage_settings', 'manage_financial', 'manage_forum', 'manage_support', 'view_analytics']
  
  for (const permName of adminPermNames) {
    const perm = await db.permission.findFirst({ where: { name: permName } })
    if (perm) {
      const existing = await db.rolePermission.findFirst({
        where: { roleId: adminRoleWithPerms.id, permissionId: perm.id },
      })
      if (!existing) {
        await db.rolePermission.create({
          data: { roleId: adminRoleWithPerms.id, permissionId: perm.id },
        })
      }
    }
  }
  console.log('[Seed] Assigned permissions to admin')

  // ── Summary ──
  const userCount = await db.user.count()
  const roleCount = await db.role.count()
  const permCount = await db.permission.count()
  const settingCount = await db.setting.count()

  console.log('\n[Seed] ========================================')
  console.log(`[Seed] Users:    ${userCount}`)
  console.log(`[Seed] Roles:    ${roleCount}`)
  console.log(`[Seed] Perms:    ${permCount}`)
  console.log(`[Seed] Settings: ${settingCount}`)
  console.log('[Seed] ========================================')
  console.log('[Seed] super_admin: carsaimozambique@gmail.com / Carnanda23')
  console.log('[Seed] admin:       suporte.carsaimz@gmail.com / CarsaiAdmin2025')
  console.log('[Seed] Done!')

  await db.$disconnect()
}

seed().catch((e) => {
  console.error('[Seed] Fatal error:', e)
  db.$disconnect()
  process.exit(1)
})
