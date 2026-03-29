import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { hours, description, date } = body

  try {
    const workLog = await prisma.workLog.findUnique({
      where: { id: params.id }
    })

    if (!workLog) return errorResponse("Work log not found", 404)
    if (workLog.userId !== session.user.id) return errorResponse("Forbidden", 403)

    const updatedWorkLog = await prisma.workLog.update({
      where: { id: params.id },
      data: {
        hours: hours !== undefined ? parseFloat(hours) : undefined,
        description: description !== undefined ? description : undefined,
        date: date ? new Date(date) : undefined,
      },
      include: { user: { select: { id: true, name: true, image: true } } }
    })

    return successResponse(updatedWorkLog)
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update work log")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  try {
    const workLog = await prisma.workLog.findUnique({
      where: { id: params.id }
    })

    if (!workLog) return errorResponse("Work log not found", 404)
    if (workLog.userId !== session.user.id) return errorResponse("Forbidden", 403)

    await prisma.workLog.delete({
      where: { id: params.id }
    })

    return successResponse({ message: "Work log deleted" })
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete work log")
  }
}
