import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import fs from 'fs'
import path from 'path'

const LOG_FILE = '/tmp/api_debug.log'

function log(message: string) {
  const timestamp = new Date().toISOString()
  fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId
  log(`[GET] Project ${params.id}`)
  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: orgId },
    include: {
      manager: { select: { id: true, name: true, email: true, image: true } },
      tasks: {
        include: {
          workLogs: { select: { hours: true } },
          assignee: { select: { id: true, name: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      customValues: {
        include: { customField: true },
      },
      activities: {
        include: {
          user: { select: { id: true, name: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    } as any,
  })

  if (!(project as any)) return errorResponse("Project not found", 404)

  // Calculate totalLoggedHours and totalEstimatedHours
  const totalLoggedHours = (project as any).tasks.reduce((sum: number, t: any) => {
    return sum + (t.workLogs?.reduce((tsum: number, l: any) => tsum + l.hours, 0) || 0)
  }, 0)

  const totalEstimatedHours = (project as any).tasks.reduce((sum: number, t: any) => sum + (t.estimatedHours || 0), 0)

  return successResponse({ ...(project as any), totalLoggedHours, estimatedHours: totalEstimatedHours })
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId
  const body = await request.json()
  
  log(`[PATCH] Project ${params.id}`)
  log(`Body: ${JSON.stringify(body)}`)

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: orgId },
  })
  if (!project) return errorResponse("Project not found", 404)

  try {
    const updated = await prisma.project.update({
    where: { id: params.id },
    data: {
      title: body.title,
      description: body.description,
      status: body.status,
      priority: body.priority,
      progress: body.progress !== undefined ? parseInt(String(body.progress)) : undefined,
      budget: body.budget && body.budget !== "" ? parseFloat(String(body.budget)) : null,
      startDate: body.startDate && body.startDate !== "" ? new Date(body.startDate) : null,
      deadline: body.deadline && body.deadline !== "" ? new Date(body.deadline) : null,
      category: body.category,
      managerId: body.managerId,
    },
    include: {
      manager: { select: { id: true, name: true, email: true, image: true } },
    },
  })

    log(`Project updated: ${params.id}`)
    return successResponse(updated)
  } catch (err: any) {
    log(`Update Error: ${err.message}`)
    return errorResponse(err.message)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId
  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: orgId },
  })
  if (!project) return errorResponse("Project not found", 404)

  await prisma.project.delete({ where: { id: params.id } })
  return successResponse({ message: "Project deleted" })
}
