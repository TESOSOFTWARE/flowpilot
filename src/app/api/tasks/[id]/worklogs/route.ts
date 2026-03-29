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
  log(`[GET] Work logs for task: ${params.id}`)
  const session = await auth()
  if (!session?.user) {
    log(`Unauthorized GET request`)
    return errorResponse("Unauthorized", 401)
  }

  try {
    const workLogs = await prisma.workLog.findMany({
      where: { taskId: params.id },
      include: {
        user: { select: { id: true, name: true, image: true } }
      },
      orderBy: { date: 'desc' }
    })
    log(`Successfully fetched ${workLogs.length} work logs`)
    return successResponse(workLogs)
  } catch (err: any) {
    log(`Error fetching work logs: ${err.message}`)
    return errorResponse("Failed to fetch work logs")
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  log(`[POST] Log work for task: ${params.id}`)
  const session = await auth()
  if (!session?.user) {
    log(`Unauthorized POST request`)
    return errorResponse("Unauthorized", 401)
  }

  const body = await request.json()
  const { hours, description, date } = body
  log(`Body: hours=${hours}, desc=${description}, date=${date}`)

  if (!hours) return errorResponse("Hours are required")

  try {
    const workLog = await prisma.workLog.create({
      data: {
        hours: parseFloat(hours),
        description,
        date: date ? new Date(date) : new Date(),
        taskId: params.id,
        userId: session.user.id!
      },
      include: {
        user: { select: { id: true, name: true, image: true } }
      }
    })
    log(`Successfully created work log: ${workLog.id}`)
    return successResponse(workLog, 201)
  } catch (err: any) {
    log(`Error creating work log: ${err.message}`)
    return errorResponse(err.message || "Failed to log work")
  }
}
