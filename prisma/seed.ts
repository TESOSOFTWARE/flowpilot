import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create organization
  const org = await prisma.organization.upsert({
    where: { slug: 'architect-pro' },
    update: {},
    create: {
      name: 'Architect Pro',
      slug: 'architect-pro',
      plan: 'pro',
    },
  })

  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@architectpro.io' },
    update: {},
    create: {
      name: 'Alex Chen',
      email: 'admin@architectpro.io',
      password: hashedPassword,
      role: 'ADMIN',
      image: 'https://i.pravatar.cc/150?u=alex',
      organizationId: org.id,
    },
  })

  const sarah = await prisma.user.upsert({
    where: { email: 's.connor@architectpro.io' },
    update: {},
    create: {
      name: 'Sarah Connor',
      email: 's.connor@architectpro.io',
      password: hashedPassword,
      role: 'MANAGER',
      image: 'https://i.pravatar.cc/150?u=sarah',
      organizationId: org.id,
    },
  })

  const marcus = await prisma.user.upsert({
    where: { email: 'm.thorne@architectpro.io' },
    update: {},
    create: {
      name: 'Marcus Thorne',
      email: 'm.thorne@architectpro.io',
      password: hashedPassword,
      role: 'MEMBER',
      image: 'https://i.pravatar.cc/150?u=marcus',
      organizationId: org.id,
    },
  })

  const elena = await prisma.user.upsert({
    where: { email: 'e.lopez@architectpro.io' },
    update: {},
    create: {
      name: 'Elena Lopez',
      email: 'e.lopez@architectpro.io',
      password: hashedPassword,
      role: 'MANAGER',
      image: 'https://i.pravatar.cc/150?u=elena',
      organizationId: org.id,
    },
  })

  const jordan = await prisma.user.upsert({
    where: { email: 'j.smith@architectpro.io' },
    update: {},
    create: {
      name: 'Jordan Smith',
      email: 'j.smith@architectpro.io',
      password: hashedPassword,
      role: 'MEMBER',
      image: 'https://i.pravatar.cc/150?u=jordan',
      organizationId: org.id,
    },
  })

  // Create team members
  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: adminUser.id, organizationId: org.id } },
    update: {},
    create: {
      role: 'Lead Architect',
      capacity: 60,
      isActive: true,
      skills: JSON.stringify(['Revit', 'Project Management', 'Civil Engineering']),
      userId: adminUser.id,
      organizationId: org.id,
    },
  })

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: sarah.id, organizationId: org.id } },
    update: {},
    create: {
      role: 'Senior Architect',
      capacity: 85,
      isActive: true,
      skills: JSON.stringify(['AutoCAD', 'Revit', 'Sustainability']),
      userId: sarah.id,
      organizationId: org.id,
    },
  })

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: marcus.id, organizationId: org.id } },
    update: {},
    create: {
      role: 'BIM Specialist',
      capacity: 10,
      isActive: false,
      skills: JSON.stringify(['BIM', 'Revit', '3D Modeling']),
      userId: marcus.id,
      organizationId: org.id,
    },
  })

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: elena.id, organizationId: org.id } },
    update: {},
    create: {
      role: 'Design Lead',
      capacity: 95,
      isActive: true,
      skills: JSON.stringify(['Design', 'Sustainability', 'Project Management']),
      userId: elena.id,
      organizationId: org.id,
    },
  })

  await prisma.teamMember.upsert({
    where: { userId_organizationId: { userId: jordan.id, organizationId: org.id } },
    update: {},
    create: {
      role: 'Structural Analyst',
      capacity: 60,
      isActive: true,
      skills: JSON.stringify(['Civil Engineering', 'Structural Analysis']),
      userId: jordan.id,
      organizationId: org.id,
    },
  })

  // Create custom fields
  const siteLocationField = await prisma.customField.upsert({
    where: { id: 'site-location-field' },
    update: {},
    create: {
      id: 'site-location-field',
      name: 'siteLocation',
      label: 'Site Location',
      fieldType: 'TEXT',
      required: false,
      organizationId: org.id,
    },
  })

  const groundbreakingField = await prisma.customField.upsert({
    where: { id: 'groundbreaking-field' },
    update: {},
    create: {
      id: 'groundbreaking-field',
      name: 'groundbreaking',
      label: 'Groundbreaking',
      fieldType: 'DATE',
      required: false,
      organizationId: org.id,
    },
  })

  const sustainabilityField = await prisma.customField.upsert({
    where: { id: 'sustainability-field' },
    update: {},
    create: {
      id: 'sustainability-field',
      name: 'sustainabilityTier',
      label: 'Sustainability Tier',
      fieldType: 'ENUM',
      options: JSON.stringify(['LEED Platinum', 'LEED Gold', 'Zero Carbon', 'Standard']),
      required: false,
      organizationId: org.id,
    },
  })

  // Create projects
  const project1 = await prisma.project.upsert({
    where: { id: 'skyline-residences' },
    update: {},
    create: {
      id: 'skyline-residences',
      title: 'Skyline Residences Phase I',
      description: 'Urban residential development featuring modern luxury apartments with sustainable design principles in the heart of downtown.',
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 65,
      budget: 2400000,
      category: 'Urban Development',
      deadline: new Date('2024-12-31'),
      organizationId: org.id,
      managerId: sarah.id,
    },
  })

  const project2 = await prisma.project.upsert({
    where: { id: 'green-valley-eco' },
    update: {},
    create: {
      id: 'green-valley-eco',
      title: 'Green Valley Eco-Park',
      description: 'Eco-friendly community park with sustainable landscaping, solar power integration, and green infrastructure.',
      status: 'PENDING',
      priority: 'MEDIUM',
      progress: 10,
      budget: 850000,
      category: 'Environmental',
      deadline: new Date('2025-06-30'),
      organizationId: org.id,
      managerId: marcus.id,
    },
  })

  const project3 = await prisma.project.upsert({
    where: { id: 'harbor-bridge' },
    update: {},
    create: {
      id: 'harbor-bridge',
      title: 'Harbor Bridge Renovation',
      description: 'Structural renovation and modernization of the historic harbor bridge with new safety systems.',
      status: 'COMPLETED',
      priority: 'CRITICAL',
      progress: 100,
      budget: 5600000,
      category: 'Infrastructure',
      deadline: new Date('2024-03-31'),
      organizationId: org.id,
      managerId: elena.id,
    },
  })

  const project4 = await prisma.project.upsert({
    where: { id: 'grand-museum' },
    update: {},
    create: {
      id: 'grand-museum',
      title: 'Grand Museum Extension',
      description: 'Design and construction of a new east wing extension for the grand municipal museum.',
      status: 'ACTIVE',
      priority: 'HIGH',
      progress: 32,
      budget: 3200000,
      category: 'Institutional',
      deadline: new Date('2025-09-30'),
      organizationId: org.id,
      managerId: sarah.id,
    },
  })

  const project5 = await prisma.project.upsert({
    where: { id: 'skyline-urban-center' },
    update: {},
    create: {
      id: 'skyline-urban-center',
      title: 'Skyline Urban Center',
      description: 'Structural design and environmental impact assessment for the new downtown mixed-use development phase.',
      status: 'ACTIVE',
      priority: 'CRITICAL',
      progress: 68,
      budget: 1240000,
      category: 'Urban Development',
      deadline: new Date('2024-12-31'),
      organizationId: org.id,
      managerId: adminUser.id,
    },
  })

  // Add custom values
  await prisma.projectCustomValue.upsert({
    where: { projectId_customFieldId: { projectId: project1.id, customFieldId: siteLocationField.id } },
    update: {},
    create: {
      value: 'North Michigan Ave, Chicago',
      projectId: project1.id,
      customFieldId: siteLocationField.id,
    },
  })

  await prisma.projectCustomValue.upsert({
    where: { projectId_customFieldId: { projectId: project1.id, customFieldId: groundbreakingField.id } },
    update: {},
    create: {
      value: '2024-01-15',
      projectId: project1.id,
      customFieldId: groundbreakingField.id,
    },
  })

  await prisma.projectCustomValue.upsert({
    where: { projectId_customFieldId: { projectId: project1.id, customFieldId: sustainabilityField.id } },
    update: {},
    create: {
      value: 'LEED Platinum',
      projectId: project1.id,
      customFieldId: sustainabilityField.id,
    },
  })

  // Create tasks
  const tasks = [
    {
      id: 'task-1',
      title: 'Finalize Blueprint Approval',
      description: 'Complete and submit structural blueprint for client approval.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date('2024-10-24'),
      projectId: project1.id,
      assigneeId: adminUser.id,
    },
    {
      id: 'task-2',
      title: 'Sustainability Compliance Report',
      description: 'Prepare environmental compliance documentation for LEED certification.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-10-28'),
      projectId: project1.id,
      assigneeId: marcus.id,
    },
    {
      id: 'task-3',
      title: 'Client Feedback Synthesis',
      description: 'Consolidate and respond to phase II residential feedback.',
      status: 'DONE',
      priority: 'LOW',
      dueDate: new Date('2024-10-15'),
      completedAt: new Date('2024-10-14'),
      projectId: project4.id,
      assigneeId: adminUser.id,
    },
    {
      id: 'task-4',
      title: 'Foundation Integrity Audit',
      description: 'Complete structural integrity audit for Skyline tower foundation.',
      status: 'IN_PROGRESS',
      priority: 'HIGH',
      dueDate: new Date(),
      projectId: project1.id,
      assigneeId: adminUser.id,
    },
    {
      id: 'task-5',
      title: 'Material Vendor Meeting',
      description: 'Finalize material procurement contracts with approved vendors.',
      status: 'TODO',
      priority: 'MEDIUM',
      dueDate: new Date('2024-11-02'),
      projectId: project5.id,
      assigneeId: adminUser.id,
    },
  ]

  for (const task of tasks) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: task,
    })
  }
  
  // Create permissions
  const permissionsData = [
    { name: 'View Projects', key: 'projects:view', description: 'Can view project dashboard and details' },
    { name: 'Create Projects', key: 'projects:create', description: 'Can create new projects' },
    { name: 'Edit Projects', key: 'projects:edit', description: 'Can edit existing projects' },
    { name: 'Delete Projects', key: 'projects:delete', description: 'Can remove projects from the workspace' },
    { name: 'View Tasks', key: 'tasks:view', description: 'Can view tasks in Kanban and List views' },
    { name: 'Create Tasks', key: 'tasks:create', description: 'Can create new tasks' },
    { name: 'Edit Tasks', key: 'tasks:edit', description: 'Can modify task details and status' },
    { name: 'Delete Tasks', key: 'tasks:delete', description: 'Can remove tasks' },
    { name: 'Invite Members', key: 'team:invite', description: 'Can invite new members to the organization' },
    { name: 'Manage Roles', key: 'roles:manage', description: 'Can create and modify workspace roles' },
  ]

  console.log('🔐 Seeding permissions...')
  for (const permission of permissionsData) {
    await prisma.permission.upsert({
      where: { key: permission.key },
      update: permission,
      create: permission,
    })
  }

  // Create activities
  const activities = [
    {
      action: 'updated',
      target: 'Q4 Roadmaps',
      targetType: 'PROJECT',
      userId: marcus.id,
      projectId: project5.id,
    },
    {
      action: 'uploaded 4 assets to',
      target: 'Urban Sprawl Project',
      targetType: 'PROJECT',
      userId: sarah.id,
      projectId: project1.id,
    },
    {
      action: 'completed milestone',
      target: 'Phase 1 Design',
      targetType: 'TASK',
      userId: elena.id,
      projectId: project4.id,
    },
    {
      action: 'joined',
      target: 'Architect Pro Team',
      targetType: 'TEAM',
      userId: jordan.id,
    },
  ]

  for (let i = 0; i < activities.length; i++) {
    const act = activities[i]
    await prisma.activity.upsert({
      where: { id: `activity-${i + 1}` },
      update: {},
      create: {
        id: `activity-${i + 1}`,
        ...act,
        createdAt: new Date(Date.now() - i * 3600000),
      },
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log(`📧 Admin login: admin@architectpro.io / password123`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
