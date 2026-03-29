import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  try {
    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    })
    return successResponse(permissions)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch permissions")
  }
}
