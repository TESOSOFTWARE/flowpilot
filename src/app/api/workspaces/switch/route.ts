import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { organizationId } = body

  if (!organizationId) return errorResponse("Organization ID is required", 400)

  const userId = session.user.id!

  // Check if user is a member of this organization
  const membership = await prisma.teamMember.findFirst({
    where: {
      userId: userId,
      organizationId: organizationId
    }
  })

  if (!membership) {
    return errorResponse("User is not a member of this organization", 403)
  }

  // Update user's active organizationId
  await prisma.user.update({
    where: { id: userId },
    data: { organizationId: organizationId }
  })

  return successResponse({ success: true })
}
