import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import bcrypt from "bcryptjs"

export async function POST(request: Request) {
  const body = await request.json()
  const { name, email, password, organizationName } = body

  if (!name || !email || !password || !organizationName) {
    return errorResponse("All fields are required")
  }

  const existingUser = await prisma.user.findUnique({ where: { email } })
  const hashedPassword = await bcrypt.hash(password, 12)

  if (existingUser) {
    return errorResponse("Email already in use", 409)
  }

  const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-')
  const existingOrg = await prisma.organization.findUnique({ where: { slug } })
  const finalSlug = existingOrg ? `${slug}-${Date.now()}` : slug

  const org = await prisma.organization.create({
    data: {
      name: organizationName,
      slug: finalSlug,
      plan: "free",
    },
  })

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: "ADMIN",
      organizationId: org.id,
    },
  })

  await prisma.teamMember.create({
    data: {
      role: "Administrator",
      capacity: 0,
      userId: user.id,
      organizationId: org.id,
    },
  })

  return successResponse({
    message: "Account created successfully",
    userId: user.id,
  }, 201)
}
