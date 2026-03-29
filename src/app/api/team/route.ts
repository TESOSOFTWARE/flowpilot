import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-helpers"
import { sendTeamInviteEmail } from "@/lib/mail"
import fs from 'fs'
import path from 'path'

const LOG_FILE = '/tmp/api_debug.log'

function log(message: string) {
  try {
    const timestamp = new Date().toISOString()
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
  } catch (err) {
    console.error('Failed to write to log file:', err)
  }
}
import bcrypt from "bcryptjs"

export async function GET(request: Request) {
  log(`[GET] Fetching team members`)
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const pageSize = parseInt(searchParams.get("pageSize") || "10")
  const search = searchParams.get("search")
  const orgId = (session.user as any).organizationId

  const where: any = { organizationId: orgId }
  if (search) {
    where.OR = [
      { user: { name: { contains: search } } },
      { user: { email: { contains: search } } },
      { inviteEmail: { contains: search } },
      { role: { contains: search } },
    ]
  }

  const [members, total] = await Promise.all([
    prisma.teamMember.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
        Role: true,
      },
      orderBy: { joinedAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.teamMember.count({ where }),
  ])

  return paginatedResponse(members, total, page, pageSize)
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return errorResponse("Unauthorized", 401)

    const body = await request.json()
    const { name, email, role, roleId } = body
    log(`[POST] Inviting member: ${email} (Role: ${role || roleId})`)
    
    if (!email || (!role && !roleId)) return errorResponse("Email and role are required", 400)

    const orgId = (session.user as any).organizationId
    if (!orgId) return errorResponse("No active organization found in session", 400)

    // Check if there's already a pending invite or active member with this email
    const existingMember = await prisma.teamMember.findFirst({ 
      where: { 
        organizationId: orgId,
        OR: [
          { user: { email: email } },
          { inviteEmail: email }
        ]
      } 
    })
    if (existingMember) return errorResponse("User is already in the team or invited", 400)

    // Find role name if roleId is provided
    let roleName = role;
    if (roleId) {
      const roleObj = await prisma.role.findUnique({ where: { id: roleId } });
      if (roleObj) roleName = roleObj.name;
    }

    // Create a placeholder TeamMember record without a userId
    const teamMember = await prisma.teamMember.create({
      data: {
        role: roleName || "Member",
        roleId: roleId || null,
        capacity: 100,
        inviteEmail: email, // Store email for late-binding
        organizationId: orgId
      },
      include: {
        user: { select: { id: true, name: true, email: true, image: true, createdAt: true } },
        Role: true
      }
    })

    // Log activity
    if (session.user.id) {
      await prisma.activity.create({
        data: {
          action: "invited team member",
          target: name || email,
          targetType: "TEAM",
          userId: session.user.id,
        }
      }).catch(err => {
        console.error("Failed to log activity:", err)
        log(`Failed to log activity: ${err.message}`)
      })
    }

    // Send an invitation email
    try {
      const inviteLink = `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/login`
      const orgName = (session.user as any).organizationName || "Your Organization"
      await sendTeamInviteEmail({
        email,
        role: roleName || "Member",
        orgName,
        inviteLink
      })
      log(`Successfully sent invitation email to ${email}`)
    } catch (error: any) {
      const errorMessage = error.message || String(error)
      console.error("Failed to send invitation email:", error)
      log(`Failed to send invitation email to ${email}: ${errorMessage}`)
    }

    return successResponse(teamMember, 201)
  } catch (error: any) {
    const errorMessage = error.message || String(error)
    console.error("Critical error in POST /api/team:", error)
    log(`CRITICAL ERROR in POST /api/team: ${errorMessage}`)
    return errorResponse(`Failed to invite member: ${errorMessage}`, 500)
  }
}
