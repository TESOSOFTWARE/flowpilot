import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import bcrypt from "bcryptjs"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { name, image } = body

  try {
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name || undefined,
        image: image || undefined,
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
      }
    })

    return successResponse(updatedUser)
  } catch (error: any) {
    return errorResponse(error.message || "Failed to update profile", 500)
  }
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { currentPassword, newPassword } = body

  if (!currentPassword || !newPassword) {
    return errorResponse("Current and new password are required")
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  })

  if (!user) return errorResponse("User not found", 404)

  // If user has a password, verify it
  if (user.password) {
    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return errorResponse("Invalid current password", 400)
  } else {
    // If user doesn't have a password (e.g. signed up via OAuth), they can set one
    // but we might want them to confirm their email first (omitting for brevity now)
  }

  const hashedPassword = await bcrypt.hash(newPassword, 12)

  await prisma.user.update({
    where: { id: session.user.id },
    data: { password: hashedPassword }
  })

  return successResponse({ message: "Password updated successfully" })
}
