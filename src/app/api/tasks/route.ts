import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-helpers"
import { checkProjectAccess } from "@/lib/auth-helpers"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "10")
  const projectId = searchParams.get("projectId")
  const assigneeId = searchParams.get("assigneeId")
  const status = searchParams.get("status")
  const priority = searchParams.get("priority")
  const orgId = (session.user as any).organizationId

  const where: any = {
    project: { organizationId: orgId },
  }
  if (projectId) where.projectId = projectId
  if (assigneeId) where.assigneeId = assigneeId
  if (status) where.status = status
  if (priority) where.priority = priority

  const [tasks, total] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        project: { select: { id: true, title: true, category: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
        workLogs: { select: { hours: true } },
      },
      orderBy: [{ priority: "asc" }, { dueDate: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.task.count({ where }),
  ])

  const tasksWithEffort = tasks.map((task: any) => {
    const loggedEffort = task.workLogs.reduce((sum: number, log: any) => sum + log.hours, 0)
    const { workLogs, ...taskData } = task
    return { ...taskData, loggedEffort }
  })

  return paginatedResponse(tasksWithEffort, total, page, pageSize)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { title, description, projectId, assigneeId, priority, status, dueDate, estimatedHours } = body

  if (!title || !projectId) return errorResponse("Title and project ID are required")

  const orgId = (session.user as any).organizationId
  const project = await checkProjectAccess(projectId, orgId)
  if (!project) return errorResponse("Project not found or access denied", 404)

  try {
    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        assigneeId: assigneeId || session.user.id,
        priority: priority || "MEDIUM",
        status: status || "TODO",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        estimatedHours: estimatedHours ? parseFloat(estimatedHours.toString()) : null,
      },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, email: true, image: true } },
      },
    })

    await prisma.activity.create({
      data: {
        action: "created task",
        target: title,
        targetType: "TASK",
        userId: session.user.id!,
        projectId,
        taskId: task.id,
      },
    })

    return successResponse(task, 201)
  } catch (error: any) {
    console.error("Error creating task:", error)
    return errorResponse(error.message || "Failed to create task", 500)
  }
}
