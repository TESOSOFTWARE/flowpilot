import { prisma } from "./prisma"
import { Session } from "next-auth"

/**
 * Checks if a user has administrative privileges for their organization.
 */
export function isAdmin(session: Session | null): boolean {
  const role = (session?.user as any)?.role?.toUpperCase()
  return role === "ADMIN" || role === "OWNER"
}

/**
 * Verifies that a project belongs to the user's organization.
 * Throws an error or returns null if access is denied.
 */
export async function checkProjectAccess(projectId: string, organizationId: string) {
  if (!projectId || !organizationId) return null
  return await prisma.project.findFirst({
    where: { id: projectId, organizationId }
  })
}

/**
 * Verifies that a task belongs to the user's organization.
 */
export async function checkTaskAccess(taskId: string, organizationId: string) {
  if (!taskId || !organizationId) return null
  return await prisma.task.findFirst({
    where: { 
      id: taskId,
      project: { organizationId }
    },
    include: { project: true }
  })
}

/**
 * Verifies that a comment belongs to the user's organization.
 */
export async function checkCommentAccess(commentId: string, organizationId: string) {
  if (!commentId || !organizationId) return null
  return await prisma.taskComment.findFirst({
    where: {
      id: commentId,
      task: {
        project: { organizationId }
      }
    }
  })
}

/**
 * Verifies that a worklog belongs to the user's organization.
 */
export async function checkWorkLogAccess(workLogId: string, organizationId: string) {
  if (!workLogId || !organizationId) return null
  return await prisma.workLog.findFirst({
    where: {
      id: workLogId,
      task: {
        project: { organizationId }
      }
    }
  })
}
