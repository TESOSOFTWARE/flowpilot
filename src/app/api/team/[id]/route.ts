import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth-helpers"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const orgId = (session.user as any).organizationId
  const body = await request.json()

  // First verify the member exists in the same organization
  const existingMember = await prisma.teamMember.findFirst({
    where: { id: params.id, organizationId: orgId }
  })

  if (!existingMember) {
    return errorResponse("Member not found or access denied", 404)
  }
  
  const member = await prisma.teamMember.update({
    where: { id: params.id },
    data: {
      role: body.role,
      roleId: body.roleId,
      capacity: body.capacity !== undefined ? parseInt(body.capacity) : undefined,
      isActive: body.isActive,
      skills: body.skills ? JSON.stringify(body.skills) : undefined,
    },
    include: {
      user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
      Role: true
    },
  })

  return successResponse(member)
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const orgId = (session.user as any).organizationId
  const existingMember = await prisma.teamMember.findFirst({
    where: { id: params.id, organizationId: orgId }
  })

  if (!existingMember) {
    return errorResponse("Member not found or access denied", 404)
  }

  await prisma.teamMember.delete({ where: { id: params.id } })
  return successResponse({ message: "Team member removed" })
}
