import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function GET(
  request: Request,
  { params }: { params: { token: string } }
) {
  const { token } = params

  if (!token) return errorResponse("Token is required", 400)

  try {
    const invite = await prisma.teamMember.findUnique({
      where: { token },
      include: {
        organization: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    })

    if (!invite) return errorResponse("Invalid or expired invitation", 404)

    return successResponse({
      id: invite.id,
      email: invite.inviteEmail,
      role: invite.role,
      organization: invite.organizationId
    })
  } catch (error) {
    console.error("Failed to fetch invite:", error)
    return errorResponse("Internal server error", 500)
  }
}
