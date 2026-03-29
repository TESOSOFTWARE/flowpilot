import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const userId = session.user.id!

  const memberships = await prisma.teamMember.findMany({
    where: { userId },
    include: {
      organization: true
    }
  })

  const workspaces = memberships.map(m => ({
    id: m.organization.id,
    name: m.organization.name,
    slug: m.organization.slug,
    role: m.role,
    isActive: m.organizationId === (session.user as any).organizationId
  }))

  return successResponse(workspaces)
}

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const body = await request.json()
  const { name } = body

  if (!name) return errorResponse("Workspace name is required", 400)

  const userId = session.user.id!
  const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 7)}`

  try {
    const org = await prisma.organization.create({
      data: {
        name,
        slug,
        plan: "free",
        teamMembers: {
          create: {
            userId: userId,
            role: "Owner",
            capacity: 100
          }
        }
      }
    })

    // Update user's active organization
    await prisma.user.update({
      where: { id: userId },
      data: { organizationId: org.id }
    })

    return successResponse(org, 201)
  } catch (error) {
    console.error("Failed to create workspace:", error)
    return errorResponse("Failed to create workspace", 500)
  }
}
