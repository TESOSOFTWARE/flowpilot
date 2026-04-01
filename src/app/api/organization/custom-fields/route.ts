import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import { isAdmin } from "@/lib/auth-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return errorResponse("Organization not found", 404)

  try {
    const customFields = await prisma.customField.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'asc' },
    })

    return successResponse(customFields)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to fetch custom fields", 500)
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)
  if (!isAdmin(session)) return errorResponse("Forbidden: Admins only", 403)

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return errorResponse("Organization not found", 404)

  const body = await request.json()
  const { name, label, fieldType, options, required } = body

  if (!name || !label || !fieldType) {
    return errorResponse("Name, label, and field type are required")
  }

  try {
    const customField = await prisma.customField.create({
      data: {
        name,
        label,
        fieldType,
        options: options || null,
        required: required || false,
        organizationId,
      },
    })

    return successResponse(customField, 201)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to create custom field", 500)
  }
}
