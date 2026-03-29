import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"

export async function GET() {
  const session = await auth()
  if (!session?.user) return errorResponse("Unauthorized", 401)

  const orgId = (session.user as any).organizationId

  const [
    totalProjects,
    activeProjects,
    pendingProjects,
    completedProjects,
    totalTasks,
    doneTasks,
    teamCount,
    recentActivity,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.project.count({ where: { organizationId: orgId, status: "ACTIVE" } }),
    prisma.project.count({ where: { organizationId: orgId, status: "PENDING" } }),
    prisma.project.count({ where: { organizationId: orgId, status: "COMPLETED" } }),
    prisma.task.count({ where: { project: { organizationId: orgId } } }),
    prisma.task.count({ where: { project: { organizationId: orgId }, status: "DONE" } }),
    prisma.teamMember.count({ where: { organizationId: orgId } }),
    prisma.activity.findMany({
      where: { user: { organizationId: orgId } },
      include: {
        user: { select: { id: true, name: true, image: true } },
        project: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
  ])

  const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100 * 10) / 10 : 0

  const recentProjects = await prisma.project.findMany({
    where: { organizationId: orgId },
    include: {
      manager: { select: { id: true, name: true, image: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { updatedAt: "desc" },
    take: 6,
  })

  return successResponse({
    stats: {
      totalProjects,
      activeProjects,
      pendingProjects,
      completedProjects,
      completionRate,
      onTrackTasks: doneTasks,
      totalTasks,
      teamCount,
      budgetUtilization: 72,
    },
    recentActivity,
    recentProjects,
  })
}
