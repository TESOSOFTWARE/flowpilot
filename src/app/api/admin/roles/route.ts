import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const orgId = (session.user as any).organizationId
  if (!orgId) return errorResponse("No organization found", 400)

  try {
    const roles = await prisma.role.findMany({
      where: { organizationId: orgId },
      include: {
        permissions: true,
        _count: { select: { teamMembers: true } }
      },
      orderBy: { name: 'asc' }
    })
    return successResponse(roles)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch roles")
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const orgId = (session.user as any).organizationId
  if (!orgId) return errorResponse("No organization found", 400)

  try {
    const body = await request.json()
    const { name, description, permissionKeys } = body

    if (!name) return errorResponse("Role name is required", 400)

    const role = await prisma.role.create({
      data: {
        name,
        description,
        organizationId: orgId,
        permissions: {
          connect: (permissionKeys || []).map((key: string) => ({ key }))
        }
      },
      include: {
        permissions: true
      }
    })

    return successResponse(role, 201)
  } catch (error: any) {
    if (error.code === 'P2002') return errorResponse("Role already exists in this organization", 400)
    return errorResponse(error.message || "Failed to create role")
  }
}
