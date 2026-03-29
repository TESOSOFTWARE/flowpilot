import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  try {
    const task = await prisma.task.update({
      where: { id: params.id },
      data: {
        title: body.title,
        description: body.description,
        status: body.status,
        priority: body.priority,
        assigneeId: body.assigneeId,
        // Using !== undefined allows explicitly setting null for clearing fields
        dueDate: body.dueDate !== undefined ? (body.dueDate ? new Date(body.dueDate) : null) : undefined,
        estimatedHours: body.estimatedHours !== undefined ? (body.estimatedHours ? parseFloat(body.estimatedHours.toString()) : null) : undefined,
        completedAt: body.status === "DONE" ? new Date() : (body.status ? null : undefined),
      },
      include: {
        project: { select: { id: true, title: true } },
        assignee: { select: { id: true, name: true, image: true } },
      },
    })
    return successResponse(task)
  } catch (error: any) {
    console.error("Error updating task:", error)
    return errorResponse(error.message || "Failed to update task", 500)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  await prisma.task.delete({ where: { id: params.id } })
  return successResponse({ message: "Task deleted" })
}
