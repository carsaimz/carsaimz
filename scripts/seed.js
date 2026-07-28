#!/usr/bin/env node

/**
 * Carsai Mozambique - Database Seed Script (MySQL)
 * 
 * Seeds the MySQL database with essential roles, permissions,
 * super_admin user, and site settings.
 * 
 * Run: bun run db:seed
 */

const { PrismaClient } = require('@prisma/client')
const { createHash } = require('crypto')

const db = new PrismaClient()

function hashPassword(password) {
  return createHash('sha256').update(password).digest('hex')
}

async function seed() {
  console.log('[Seed] Starting MySQL database seed...')

  // ── 1. Create essential roles ──
  const roleDefs = [
    { name: 'super_admin', description: 'Super administrador com acesso total e irrestrito ao sistema' },
    { name: 'admin', description: 'Administrador com acesso total ao sistema' },
    { name: 'partner', description: 'Parceiro comercial com acesso a funcionalidades de gestão' },
    { name: 'user', description: 'Utilizador padrão com acesso básico' },
  ]
  
  const roles = {}
  for (const def of roleDefs) {
    const existing = await db.role.findFirst({ where: { name: def.name } })
    if (!existing) {
      const created = await db.role.create({ data: def })
      roles[def.name] = created
      console.log(`[Seed] Created role: ${def.name}`)
    } else {
      roles[def.name] = existing
      console.log(`[Seed] Role already exists: ${def.name}`)
    }
  }

  // ── 2. Create permissions ──
  const permissionDefs = [
    { name: 'manage_posts', description: 'Create, edit, delete blog posts' },
    { name: 'manage_pages', description: 'Create, edit, delete site pages' },
    { name: 'manage_services', description: 'Create, edit, delete services' },
    { name: 'manage_projects', description: 'Create, edit, delete projects' },
    { name: 'manage_testimonials', description: 'Create, edit, delete testimonials' },
    { name: 'manage_users', description: 'Create, edit, delete users and assign roles' },
    { name: 'view_users', description: 'View user profiles and lists' },
    { name: 'manage_quotes', description: 'Create, review, and manage quotes' },
    { name: 'manage_proposals', description: 'Create, edit, send proposals' },
    { name: 'manage_payments', description: 'Record, confirm, and manage payments' },
    { name: 'manage_invoices', description: 'Create, edit, and manage invoices' },
    { name: 'manage_forum', description: 'Moderate forum topics and replies' },
    { name: 'post_in_forum', description: 'Create forum topics and reply to posts' },
    { name: 'manage_settings', description: 'Edit site settings and configuration' },
    { name: 'view_logs', description: 'View system audit logs' },
    { name: 'manage_roles', description: 'Create, edit roles and assign permissions' },
    { name: 'manage_permissions', description: 'Create, edit, delete permissions' },
    { name: 'manage_support', description: 'Handle support tickets and replies' },
    { name: 'create_tickets', description: 'Create support tickets' },
    { name: 'manage_affiliates', description: 'Manage affiliate clicks and commissions' },
    { name: 'view_affiliates', description: 'View affiliate statistics' },
    { name: 'manage_files', description: 'Upload, edit, delete file attachments' },
    { name: 'manage_subscribers', description: 'Manage newsletter subscribers' },
  ]

  const permissions = {}
  for (const def of permissionDefs) {
    const existing = await db.permission.findFirst({ where: { name: def.name } })
    if (!existing) {
      const created = await db.permission.create({ data: def })
      permissions[def.name] = created
    } else {
      permissions[def.name] = existing
    }
  }
  console.log(`[Seed] Permissions ready: ${Object.keys(permissions).length}`)

  // ── 3. Assign permissions to roles ──
  // super_admin: all permissions
  for (const perm of Object.values(permissions)) {
    const existing = await db.rolePermission.findFirst({
      where: { roleId: roles.super_admin.id, permissionId: perm.id },
    })
    if (!existing) {
      await db.rolePermission.create({
        data: { roleId: roles.super_admin.id, permissionId: perm.id },
      })
    }
  }
  console.log('[Seed] Assigned all permissions to super_admin')

  // admin: all permissions
  for (const perm of Object.values(permissions)) {
    const existing = await db.rolePermission.findFirst({
      where: { roleId: roles.admin.id, permissionId: perm.id },
    })
    if (!existing) {
      await db.rolePermission.create({
        data: { roleId: roles.admin.id, permissionId: perm.id },
      })
    }
  }
  console.log('[Seed] Assigned all permissions to admin')

  // partner: specific permissions
  const partnerPermNames = [
    'manage_posts', 'manage_pages', 'manage_services', 'manage_projects',
    'manage_testimonials', 'view_users', 'manage_quotes', 'manage_proposals',
    'manage_payments', 'manage_invoices', 'post_in_forum', 'create_tickets',
    'view_affiliates', 'manage_files',
  ]
  for (const permName of partnerPermNames) {
    const perm = permissions[permName]
    if (perm) {
      const existing = await db.rolePermission.findFirst({
        where: { roleId: roles.partner.id, permissionId: perm.id },
      })
      if (!existing) {
        await db.rolePermission.create({
          data: { roleId: roles.partner.id, permissionId: perm.id },
        })
      }
    }
  }
  console.log('[Seed] Assigned partner permissions')

  // user: basic permissions
  const userPermNames = ['post_in_forum', 'create_tickets', 'manage_files']
  for (const permName of userPermNames) {
    const perm = permissions[permName]
    if (perm) {
      const existing = await db.rolePermission.findFirst({
        where: { roleId: roles.user.id, permissionId: perm.id },
      })
      if (!existing) {
        await db.rolePermission.create({
          data: { roleId: roles.user.id, permissionId: perm.id },
        })
      }
    }
  }
  console.log('[Seed] Assigned user permissions')

  // ── 4. Create super_admin user ──
  const superAdminEmail = 'carsaimozambique@gmail.com'
  const existingAdmin = await db.user.findUnique({ where: { email: superAdminEmail } })
  
  if (!existingAdmin) {
    await db.user.create({
      data: {
        name: 'Carsai Admin',
        email: superAdminEmail,
        passwordHash: hashPassword('Carnanda23'),
        phone: '847545020',
        company: 'Carsai Mozambique',
        bio: 'CEO & Founder of Carsai Mozambique',
        address: 'Montepuez, Cabo Delgado, Mozambique',
        roleId: roles.super_admin.id,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log('[Seed] Created super_admin user: carsaimozambique@gmail.com')
  } else {
    console.log('[Seed] super_admin user already exists')
  }

  // ── 5. Create admin user ──
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
        roleId: roles.admin.id,
        isActive: true,
        emailVerified: true,
      },
    })
    console.log('[Seed] Created admin user: suporte.carsaimz@gmail.com')
  } else {
    console.log('[Seed] admin user already exists')
  }

  // ── 6. Create site settings ──
  const settings = [
    { key: 'company_name', value: 'Carsai Mozambique' },
    { key: 'contact_email', value: 'carsaimozambique@gmail.com' },
    { key: 'support_email', value: 'suporte.carsaimz@gmail.com' },
    { key: 'developer_email', value: 'carsaideveloper@gmail.com' },
    { key: 'contact_phone', value: '847545020 / 874512581 / 84246463 / 835020143' },
    { key: 'contact_address', value: 'Montepuez, Cabo Delgado, Mozambique' },
    { key: 'website_url', value: 'https://carsai.mz' },
    { key: 'ceo_name', value: 'Carimo Saide Mpinda' },
    { key: 'developer_name', value: 'CarsaiDev' },
    { key: 'social_whatsapp', value: '847545020' },
    { key: 'social_facebook', value: 'carsaimz' },
    { key: 'social_instagram', value: 'carsaimz' },
    { key: 'social_tiktok', value: 'carsaimz' },
    { key: 'social_youtube', value: 'carsaimz' },
    { key: 'social_discord', value: 'carsaimz' },
    { key: 'social_github', value: 'carsaimz' },
    { key: 'mpesa_number', value: '847545020' },
  ]

  for (const setting of settings) {
    const existing = await db.setting.findFirst({ where: { key: setting.key } })
    if (!existing) {
      await db.setting.create({ data: setting })
    }
  }
  console.log('[Seed] Settings created')

  // ── Summary ──
  const userCount = await db.user.count()
  const roleCount = await db.role.count()
  const permCount = await db.permission.count()
  const settingCount = await db.setting.count()

  console.log('\n[Seed] ============================')
  console.log(`[Seed] Users:    ${userCount}`)
  console.log(`[Seed] Roles:    ${roleCount}`)
  console.log(`[Seed] Perms:    ${permCount}`)
  console.log(`[Seed] Settings: ${settingCount}`)
  console.log('[Seed] ============================')
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
