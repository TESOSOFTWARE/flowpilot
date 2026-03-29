import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Roles & Permissions...')

  // 1. Define Permissions
  const permissions = [
    { key: 'project:read', name: 'View Projects', description: 'Can view all projects' },
    { key: 'project:create', name: 'Create Projects', description: 'Can create new projects' },
    { key: 'project:update', name: 'Update Projects', description: 'Can edit project details' },
    { key: 'project:delete', name: 'Delete Projects', description: 'Can delete projects' },
    { key: 'task:read', name: 'View Tasks', description: 'Can view all tasks' },
    { key: 'task:create', name: 'Create Tasks', description: 'Can create new tasks' },
    { key: 'task:update', name: 'Update Tasks', description: 'Can edit tasks' },
    { key: 'task:delete', name: 'Delete Tasks', description: 'Can delete tasks' },
    { key: 'team:read', name: 'View Team', description: 'Can view team member directory' },
    { key: 'team:invite', name: 'Invite Members', description: 'Can invite new members to the org' },
    { key: 'team:manage', name: 'Manage Roles', description: 'Can manage roles and permissions' },
    { key: 'settings:manage', name: 'Manage Settings', description: 'Can manage organization settings' },
  ]

  for (const p of permissions) {
    await prisma.permission.upsert({
      where: { key: p.key },
      update: { name: p.name, description: p.description },
      create: p,
    })
  }

  // 2. Get the organization
  const org = await prisma.organization.findFirst()
  if (!org) {
    console.log('❌ No organization found. Please run main seed first.')
    return
  }

  // 3. Define Roles
  const roles = [
    {
      name: 'Admin',
      description: 'Full workspace access with administrative privileges',
      permissions: permissions.map(p => p.key)
    },
    {
      name: 'Project Manager',
      description: 'Can manage projects, tasks and view team',
      permissions: ['project:read', 'project:create', 'project:update', 'task:read', 'task:create', 'task:update', 'task:delete', 'team:read']
    },
    {
      name: 'Developer',
      description: 'Can view projects and manage tasks',
      permissions: ['project:read', 'task:read', 'task:create', 'task:update', 'team:read']
    },
    {
      name: 'Viewer',
      description: 'Read-only access to projects and tasks',
      permissions: ['project:read', 'task:read', 'team:read']
    }
  ]

  for (const r of roles) {
    await prisma.role.upsert({
      where: { name_organizationId: { name: r.name, organizationId: org.id } },
      update: {
        description: r.description,
        permissions: {
          set: [], // Clear existing
          connect: r.permissions.map(key => ({ key }))
        }
      },
      create: {
        name: r.name,
        description: r.description,
        organizationId: org.id,
        permissions: {
          connect: r.permissions.map(key => ({ key }))
        }
      }
    })
  }

  // 4. Update existing team members with their initial roles if possible
  const adminRole = await prisma.role.findFirst({ where: { name: 'Admin', organizationId: org.id } })
  const managerRole = await prisma.role.findFirst({ where: { name: 'Project Manager', organizationId: org.id } })
  const developerRole = await prisma.role.findFirst({ where: { name: 'Developer', organizationId: org.id } })

  const members = await prisma.teamMember.findMany({ include: { user: true } })
  for (const m of members) {
    let roleToAssign = developerRole
    const userRole = m.user?.role?.toUpperCase()
    
    if (userRole === 'ADMIN') roleToAssign = adminRole
    else if (userRole === 'MANAGER') roleToAssign = managerRole
    
    if (roleToAssign) {
      await prisma.teamMember.update({
        where: { id: m.id },
        data: { roleId: roleToAssign.id }
      })
    }
  }

  console.log('✅ Roles & Permissions seeded successfully!')
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
