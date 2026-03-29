import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return errorResponse("Organization not found", 404)

  const body = await request.json()
  const { name, label, fieldType, options, required } = body

  try {
    const customField = await prisma.customField.updateMany({
      where: { 
        id: params.id,
        organizationId,
      },
      data: {
        name: name || undefined,
        label: label || undefined,
        fieldType: fieldType || undefined,
        options: options !== undefined ? (options || null) : undefined,
        required: required !== undefined ? required : undefined,
      },
    })

    if (customField.count === 0) {
      return errorResponse("Custom field not found or unauthorized", 404)
    }

    // Since updateMany doesn't return the object, we fetch it
    const updatedField = await prisma.customField.findUnique({ where: { id: params.id } })
    return successResponse(updatedField)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update custom field", 500)
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const organizationId = (session.user as any).organizationId
  if (!organizationId) return errorResponse("Organization not found", 404)

  try {
    const result = await prisma.customField.deleteMany({
      where: { 
        id: params.id,
        organizationId,
      },
    })

    if (result.count === 0) {
      return errorResponse("Custom field not found or unauthorized", 404)
    }

    return successResponse({ message: "Custom field deleted" })
  } catch (error: any) {
    return errorResponse(error.message || "Failed to delete custom field", 500)
  }
}
