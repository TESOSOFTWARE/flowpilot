import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function POST(
  request: Request,
  { params }: { params: { token: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const { token } = params
  const userId = session.user.id!

  try {
    const invite = await prisma.teamMember.findUnique({
      where: { token },
    })

    if (!invite) return errorResponse("Invitation not found", 404)

    // Link the user to the team member record
    await prisma.teamMember.update({
      where: { id: invite.id },
      data: {
        userId: userId,
        inviteEmail: null,
        token: null, // Consume the token
      },
    })

    // Update user's active organizationId
    await prisma.user.update({
      where: { id: userId },
      data: { 
        organizationId: invite.organizationId,
        // If user has no role yet, set to Member (they were invited)
        role: (session.user as any).role === "ADMIN" ? undefined : "MEMBER"
      },
    })

    return successResponse({ success: true, organizationId: invite.organizationId })
  } catch (error) {
    console.error("Failed to accept invite:", error)
    return errorResponse("Internal server error", 500)
  }
}
