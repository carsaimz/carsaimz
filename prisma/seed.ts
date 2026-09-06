/**
 * Carsai Mozambique — Database Seed Script
 * Seeds the MySQL database with minimal essential infrastructure:
 * roles, permissions, essential settings, and a super_admin user.
 */

import { PrismaClient } from '@prisma/client'
import { createHash } from 'crypto'

const prisma = new PrismaClient()

function hashPassword(password: string): string {
  return createHash('sha256').update(password).digest('hex')
}

async function main() {
  console.log('🇲🇿 Starting Carsai Mozambique database seeding (MySQL)...')

  // Clear existing data in reverse dependency order
  console.log('Cleaning existing data...')
  await prisma.notification.deleteMany()
  await prisma.forumLike.deleteMany()
  await prisma.forumPost.deleteMany()
  await prisma.forumTopic.deleteMany()
  await prisma.forumCategory.deleteMany()
  await prisma.postTag.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.tag.deleteMany()
  await prisma.category.deleteMany()
  await prisma.subscriber.deleteMany()
  await prisma.testimonial.deleteMany()
  await prisma.project.deleteMany()
  await prisma.service.deleteMany()
  await prisma.invoiceItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.payment.deleteMany()
  await prisma.proposal.deleteMany()
  await prisma.quote.deleteMany()
  await prisma.affiliateCommission.deleteMany()
  await prisma.affiliateClick.deleteMany()
  await prisma.supportTicket.deleteMany()
  await prisma.ticketReply.deleteMany()
  await prisma.rolePermission.deleteMany()
  await prisma.setting.deleteMany()
  await prisma.log.deleteMany()
  await prisma.page.deleteMany()
  await prisma.user.deleteMany()
  await prisma.permission.deleteMany()
  await prisma.role.deleteMany()
  await prisma.fileAttachment.deleteMany()

  // === 1. Roles ===
  console.log('Creating roles...')
  const superAdminRole = await prisma.role.create({
    data: {
      name: 'super_admin',
      description: 'Super administrador com acesso total e irrestrito ao sistema',
    },
  })

  const adminRole = await prisma.role.create({
    data: {
      name: 'admin',
      description: 'Administrador com acesso total ao sistema',
    },
  })

  const partnerRole = await prisma.role.create({
    data: {
      name: 'partner',
      description: 'Parceiro comercial com acesso a funcionalidades de gestão',
    },
  })

  const userRole = await prisma.role.create({
    data: {
      name: 'user',
      description: 'Utilizador padrão com acesso básico',
    },
  })

  // === 2. Permissions ===
  console.log('Creating permissions...')

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
    { name: 'manage_forum', description: 'Create, edit, delete forum categories and moderate topics' },
    { name: 'post_in_forum', description: 'Create forum topics and reply to posts' },
    { name: 'manage_settings', description: 'Edit site settings and configuration' },
    { name: 'view_logs', description: 'View system audit logs' },
    { name: 'manage_roles', description: 'Create, edit roles and assign permissions' },
    { name: 'manage_permissions', description: 'Create, edit, delete permissions' },
    { name: 'manage_support', description: 'Manage support tickets and replies' },
    { name: 'create_tickets', description: 'Create support tickets' },
    { name: 'manage_affiliates', description: 'Manage affiliate clicks and commissions' },
    { name: 'view_affiliates', description: 'View affiliate statistics' },
    { name: 'manage_files', description: 'Upload, edit, delete file attachments' },
    { name: 'manage_subscribers', description: 'Manage newsletter subscribers' },
  ]

  const permissions = await Promise.all(
    permissionDefs.map((def) =>
      prisma.permission.create({ data: def })
    )
  )

  // === 3. Role-Permission mappings ===
  console.log('Assigning permissions to roles...')

  const findPerm = (name: string) => permissions.find((p: any) => p.name === name)!

  const superAdminPerms = permissions.map((p: any) => ({
    roleId: superAdminRole.id,
    permissionId: p.id,
  }))

  const adminPerms = permissions.map((p: any) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }))

  const partnerPermNames = [
    'manage_posts', 'manage_pages', 'manage_services', 'manage_projects',
    'manage_testimonials', 'view_users', 'manage_quotes', 'manage_proposals',
    'manage_payments', 'manage_invoices', 'post_in_forum', 'create_tickets',
    'view_affiliates', 'manage_files',
  ]
  const partnerPerms = partnerPermNames.map((name) => ({
    roleId: partnerRole.id,
    permissionId: findPerm(name).id,
  }))

  const userPermNames = ['post_in_forum', 'create_tickets', 'manage_files']
  const userPerms = userPermNames.map((name) => ({
    roleId: userRole.id,
    permissionId: findPerm(name).id,
  }))

  await prisma.rolePermission.createMany({
    data: [...superAdminPerms, ...adminPerms, ...partnerPerms, ...userPerms],
  })

  // === 4. Create super_admin user ===
  console.log('Creating super_admin user...')
  const superAdminUser = await prisma.user.create({
    data: {
      name: 'Carsai Admin',
      email: 'carsaimozambique@gmail.com',
      passwordHash: hashPassword('Carnanda23'),
      roleId: superAdminRole.id,
      isActive: true,
    },
  })

  // === 5. Essential Settings ===
  console.log('Creating essential settings...')
  const settingDefs = [
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

  await Promise.all(
    settingDefs.map((def) => prisma.setting.create({ data: def }))
  )

  // === Summary ===
  console.log('🇲🇿 Carsai Mozambique seeding completed!')
  console.log(`  - Roles: 4 (super_admin, admin, partner, user)`)
  console.log(`  - Permissions: ${permissions.length}`)
  console.log(`  - Super_admin user: ${superAdminUser.email}`)
  console.log(`  - Settings: ${settingDefs.length}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
