import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { successResponse, errorResponse } from "@/lib/api-helpers"
import fs from 'fs'

const LOG_FILE = '/tmp/api_debug.log'
const log = (msg: string) => fs.appendFileSync(LOG_FILE, `[${new Date().toISOString()}] ${msg}\n`)

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  log(`[GET] Comments for task: ${params.id}`)
  const session = await auth()
  if (!session?.user) {
    log(`Unauthorized GET request`)
    return errorResponse("Unauthorized", 401)
  }

  try {
    const comments = await prisma.taskComment.findMany({
      where: { taskId: params.id },
      include: {
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { createdAt: 'desc' }
    })
    log(`Successfully fetched ${comments.length} comments`)
    return successResponse(comments)
  } catch (err: any) {
    log(`Error fetching comments: ${err.message}`)
    return errorResponse("Failed to fetch comments")
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  log(`[POST] Add comment to task: ${params.id}`)
  const session = await auth()
  if (!session?.user) {
    log(`Unauthorized POST request`)
    return errorResponse("Unauthorized", 401)
  }

  const body = await request.json()
  const { content } = body
  log(`Body content: ${content}`)

  if (!content) return errorResponse("Comment content is required")

  try {
    const comment = await prisma.taskComment.create({
      data: {
        content,
        taskId: params.id,
        userId: session.user.id!
      },
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    })
    log(`Successfully created comment: ${comment.id}`)
    return successResponse(comment, 201)
  } catch (err: any) {
    log(`Error creating comment: ${err.message}`)
    return errorResponse(err.message || "Failed to create comment")
  }
}
