import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  
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

  await prisma.teamMember.delete({ where: { id: params.id } })
  return successResponse({ message: "Team member removed" })
}
