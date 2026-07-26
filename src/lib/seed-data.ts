import { db } from '@/lib/db'

/**
 * Default password hash for admin registration.
 * This corresponds to the bcrypt hash of a default admin password.
 * When an admin registers, they should override this with their own password.
 */
export const DEFAULT_ADMIN_PASSWORD_HASH = ''

/**
 * Seeds the Carsai Mozambique database with minimal essential infrastructure.
 * No demo content is created — the database starts clean.
 * Only roles, permissions, and essential settings are populated.
 */
export async function seedDatabase() {
  console.log('🇲🇿 Starting Carsai Mozambique database seeding (clean mode)...')

  // Clear existing data in reverse dependency order
  console.log('Cleaning existing data...')
  await db.notification.deleteMany()
  await db.forumLike.deleteMany()
  await db.forumPost.deleteMany()
  await db.forumTopic.deleteMany()
  await db.forumCategory.deleteMany()
  await db.postTag.deleteMany()
  await db.comment.deleteMany()
  await db.post.deleteMany()
  await db.tag.deleteMany()
  await db.category.deleteMany()
  await db.subscriber.deleteMany()
  await db.testimonial.deleteMany()
  await db.project.deleteMany()
  await db.service.deleteMany()
  await db.invoiceItem.deleteMany()
  await db.invoice.deleteMany()
  await db.payment.deleteMany()
  await db.proposal.deleteMany()
  await db.quote.deleteMany()
  await db.affiliateCommission.deleteMany()
  await db.affiliateClick.deleteMany()
  await db.supportTicket.deleteMany()
  await db.ticketReply.deleteMany()
  await db.rolePermission.deleteMany()
  await db.setting.deleteMany()
  await db.log.deleteMany()
  await db.page.deleteMany()
  await db.user.deleteMany()
  await db.permission.deleteMany()
  await db.role.deleteMany()
  await db.fileAttachment.deleteMany()

  // === 1. Roles ===
  console.log('Creating roles...')
  const adminRole = await db.role.create({
    data: {
      name: 'admin',
      description: 'Administrador com acesso total ao sistema',
    },
  })

  const partnerRole = await db.role.create({
    data: {
      name: 'partner',
      description: 'Parceiro comercial com acesso a funcionalidades de gestão',
    },
  })

  const userRole = await db.role.create({
    data: {
      name: 'user',
      description: 'Utilizador padrão com acesso básico',
    },
  })

  // === 2. Permissions ===
  console.log('Creating permissions...')

  // Define all system permissions
  const permissionDefs = [
    // Content management
    { name: 'manage_posts', description: 'Create, edit, delete blog posts' },
    { name: 'manage_pages', description: 'Create, edit, delete site pages' },
    { name: 'manage_services', description: 'Create, edit, delete services' },
    { name: 'manage_projects', description: 'Create, edit, delete projects' },
    { name: 'manage_testimonials', description: 'Create, edit, delete testimonials' },

    // User management
    { name: 'manage_users', description: 'Create, edit, delete users and assign roles' },
    { name: 'view_users', description: 'View user profiles and lists' },

    // Financial
    { name: 'manage_quotes', description: 'Create, review, and manage quotes' },
    { name: 'manage_proposals', description: 'Create, edit, send proposals' },
    { name: 'manage_payments', description: 'Record, confirm, and manage payments' },
    { name: 'manage_invoices', description: 'Create, edit, and manage invoices' },

    // Forum
    { name: 'manage_forum', description: 'Create, edit, delete forum categories and moderate topics' },
    { name: 'post_in_forum', description: 'Create forum topics and reply to posts' },

    // Settings & System
    { name: 'manage_settings', description: 'Edit site settings and configuration' },
    { name: 'view_logs', description: 'View system audit logs' },
    { name: 'manage_roles', description: 'Create, edit roles and assign permissions' },
    { name: 'manage_permissions', description: 'Create, edit, delete permissions' },

    // Support
    { name: 'manage_support', description: 'Manage support tickets and replies' },
    { name: 'create_tickets', description: 'Create support tickets' },

    // Affiliate
    { name: 'manage_affiliates', description: 'Manage affiliate clicks and commissions' },
    { name: 'view_affiliates', description: 'View affiliate statistics' },

    // File management
    { name: 'manage_files', description: 'Upload, edit, delete file attachments' },

    // Newsletter
    { name: 'manage_subscribers', description: 'Manage newsletter subscribers' },
  ]

  const permissions = await Promise.all(
    permissionDefs.map((def) =>
      db.permission.create({ data: def })
    )
  )

  // === 3. Role-Permission mappings ===
  console.log('Assigning permissions to roles...')

  // Helper to find permission by name
  const findPerm = (name: string) => permissions.find((p) => p.name === name)!

  // Admin gets ALL permissions
  const adminPerms = permissions.map((p) => ({
    roleId: adminRole.id,
    permissionId: p.id,
  }))

  // Partner gets management permissions for content, forum posting, financial viewing, support, and affiliate viewing
  const partnerPermNames = [
    'manage_posts',
    'manage_pages',
    'manage_services',
    'manage_projects',
    'manage_testimonials',
    'view_users',
    'manage_quotes',
    'manage_proposals',
    'manage_payments',
    'manage_invoices',
    'post_in_forum',
    'create_tickets',
    'view_affiliates',
    'manage_files',
  ]
  const partnerPerms = partnerPermNames.map((name) => ({
    roleId: partnerRole.id,
    permissionId: findPerm(name).id,
  }))

  // User gets basic permissions: forum posting, ticket creation, file upload
  const userPermNames = [
    'post_in_forum',
    'create_tickets',
    'manage_files',
  ]
  const userPerms = userPermNames.map((name) => ({
    roleId: userRole.id,
    permissionId: findPerm(name).id,
  }))

  await db.rolePermission.createMany({
    data: [...adminPerms, ...partnerPerms, ...userPerms],
  })

  // === 4. Essential Settings ===
  console.log('Creating essential settings...')
  await Promise.all([
    db.setting.create({
      data: {
        key: 'company_name',
        value: 'Carsai Mozambique',
      },
    }),
    db.setting.create({
      data: {
        key: 'contact_email',
        value: 'info@carsai.mz',
      },
    }),
    db.setting.create({
      data: {
        key: 'contact_phone',
        value: '+258 21 123 456',
      },
    }),
    db.setting.create({
      data: {
        key: 'contact_address',
        value: 'Av. Julius Nyerere, 123, Maputo, Mozambique',
      },
    }),
    db.setting.create({
      data: {
        key: 'website_url',
        value: 'https://carsai.mz',
      },
    }),
  ])

  // === Summary ===
  console.log('🇲🇿 Carsai Mozambique seeding completed (clean mode)!')
  console.log(`  - Roles: 3 (admin, partner, user)`)
  console.log(`  - Permissions: ${permissions.length}`)
  console.log(`  - Admin permissions: ${adminPerms.length}`)
  console.log(`  - Partner permissions: ${partnerPerms.length}`)
  console.log(`  - User permissions: ${userPerms.length}`)
  console.log(`  - Settings: 5 (company_name, contact_email, contact_phone, contact_address, website_url)`)
  console.log(`  - No demo content created — database starts clean`)

  return {
    roles: 3,
    permissions: permissions.length,
    rolePermissions: adminPerms.length + partnerPerms.length + userPerms.length,
    settings: 5,
  }
}
