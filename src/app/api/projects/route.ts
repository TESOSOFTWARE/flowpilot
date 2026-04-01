import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-helpers"
import fs from 'fs'
import path from 'path'

const LOG_FILE = '/tmp/api_debug.log'

function log(message: string) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const isExport = searchParams.get("export") === "true"
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = isExport ? 1000 : parseInt(searchParams.get("pageSize") || "10")
  const status = searchParams.get("status")
  const search = searchParams.get("search")
  const managerId = searchParams.get("managerId")
  const priority = searchParams.get("priority")

  const orgId = (session.user as any).organizationId
  const where: any = { organizationId: orgId }
  if (status && status !== "ALL") where.status = status
  if (managerId && managerId !== "ALL") where.managerId = managerId
  if (priority && priority !== "ALL") where.priority = priority
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { category: { contains: search } },
    ]
  }

  log(`[GET] Fetching projects with params: ${JSON.stringify({ page, pageSize, status, search, managerId, priority })}`)
  const [projects, total] = await Promise.all([
    prisma.project.findMany({
      where,
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        _count: { select: { tasks: true } },
        tasks: {
          select: {
            estimatedHours: true,
            workLogs: {
              select: { hours: true }
            }
          }
        }
      } as any,
      orderBy: { createdAt: "desc" },
      skip: isExport ? 0 : (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.project.count({ where }),
  ])

  // Calculate totalLoggedHours and totalEstimatedHours
  const enrichedProjects = (projects as any[]).map(p => {
    const totalLoggedHours = p.tasks.reduce((sum: number, t: any) => {
      return sum + t.workLogs.reduce((tsum: number, l: any) => tsum + l.hours, 0)
    }, 0)

    const totalEstimatedHours = p.tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0)
    
    // Remove the nested tasks object to keep response clean
    const { tasks, ...projectData } = p
    return { ...projectData, totalLoggedHours, estimatedHours: totalEstimatedHours }
  })

  return paginatedResponse(enrichedProjects, total, isExport ? 1 : page, pageSize)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { title, description, managerId, status, priority, budget, deadline, category, startDate, customValues } = body
  
  log(`[POST] Creating project: ${title}`)
  log(`Body: ${JSON.stringify(body)}`)
  const orgId = (session.user as any).organizationId

  if (!title) return errorResponse("Project title is required")

  try {
    const project = await prisma.project.create({
      data: {
        title,
        description,
        managerId,
        status: status || "ACTIVE",
        priority: priority || "MEDIUM",
        budget: budget && budget !== "" ? parseFloat(String(budget)) : null,
        startDate: startDate && startDate !== "" ? new Date(startDate) : null,
        deadline: deadline && deadline !== "" ? new Date(deadline) : null,
        category,
        organizationId: orgId,
        customValues: customValues && Array.isArray(customValues) ? {
          create: customValues.map((cv: any) => ({
            value: String(cv.value),
            customFieldId: cv.fieldId
          }))
        } : undefined
      },
      include: {
        manager: { select: { id: true, name: true, email: true, image: true } },
        customValues: { include: { customField: true } }
      },
    })

    // Log activity
    await prisma.activity.create({
      data: {
        action: "created project",
        target: title,
        targetType: "PROJECT",
        userId: session.user.id!,
        projectId: project.id,
      },
    })

    log(`Project created: ${project.id}`)
    return successResponse(project, 201)
  } catch (err: any) {
    log(`Create Error: ${err.message}`)
    return errorResponse(err.message)
  }
}
