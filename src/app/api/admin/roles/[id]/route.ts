import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId
  if (!orgId) return errorResponse("No organization found", 400)

  try {
    const body = await request.json()
    const { name, description, permissionKeys } = body

    const role = await prisma.role.update({
      where: { 
        id: params.id,
        organizationId: orgId // Ensure the role belongs to the user's org
      },
      data: {
        name: name || undefined,
        description: description,
        permissions: permissionKeys ? {
          set: [], // Clear existing
          connect: permissionKeys.map((key: string) => ({ key }))
        } : undefined
      },
      include: {
        permissions: true
      }
    })

    return successResponse(role)
  } catch (error: any) {
    if (error.code === 'P2002') return errorResponse("Role name already exists", 400)
    return errorResponse(error.message || "Failed to update role")
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId
  
  try {
    // Check if there are members assigned to this role
    const membersCount = await prisma.teamMember.count({
      where: { roleId: params.id }
    })

    if (membersCount > 0) {
      return errorResponse(`Cannot delete role: ${membersCount} members are currently assigned to it.`, 400)
    }

    await prisma.role.delete({
      where: { 
        id: params.id,
        organizationId: orgId
      }
    })

    return successResponse({ message: "Role deleted successfully" })
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete role")
  }
}
