import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    })
    return successResponse(permissions)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch permissions")
  }
}
