import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { checkCommentAccess } from "@/lib/auth-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { content } = body

  if (!content) return errorResponse("Content is required")

  try {
    const orgId = (session.user as any).organizationId
    const commentAccess = await checkCommentAccess(params.id, orgId)

    if (!commentAccess) return errorResponse("Comment not found or access denied", 404)
    if (commentAccess.userId !== session.user.id) return errorResponse("Forbidden", 403)

    const updatedComment = await prisma.taskComment.update({
      where: { id: params.id },
      data: { content },
      include: { user: { select: { id: true, name: true, image: true } } }
    })

    return successResponse(updatedComment)
  } catch (err: any) {
    return errorResponse(err.message || "Failed to update comment")
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  try {
    const orgId = (session.user as any).organizationId
    const commentAccess = await checkCommentAccess(params.id, orgId)

    if (!commentAccess) return errorResponse("Comment not found or access denied", 404)
    if (commentAccess.userId !== session.user.id) return errorResponse("Forbidden", 403)

    await prisma.taskComment.delete({
      where: { id: params.id }
    })

    return successResponse({ message: "Comment deleted" })
  } catch (err: any) {
    return errorResponse(err.message || "Failed to delete comment")
  }
}
