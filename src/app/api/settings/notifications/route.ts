import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    let orgId = (session.user as any).organizationId
    
    // Verify organization existence and fallback if needed
    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } })
      if (!org) {
        console.warn(`[SETTINGS_GET] Stale OrgId detected: ${orgId}. Attempting fallback.`)
        const membership = await prisma.teamMember.findFirst({
          where: { userId: session.user.id },
          include: { organization: true }
        })
        orgId = membership?.organizationId
      }
    }

    if (!orgId) return NextResponse.json({ success: true, data: null })

    const config = await (prisma as any).telegramSettings.findUnique({
      where: { organizationId: orgId }
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error: any) {
    console.error('[SETTINGS_GET_ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    let orgId = (session.user as any).organizationId
    
    // Verify organization existence and fallback if needed
    if (orgId) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } })
      if (!org) {
        console.warn(`[SETTINGS_POST] Stale OrgId detected: ${orgId}. Attempting fallback.`)
        const membership = await prisma.teamMember.findFirst({
          where: { userId: session.user.id },
          orderBy: { joinedAt: 'asc' }
        })
        orgId = membership?.organizationId
      }
    }

    if (!orgId) {
      return NextResponse.json({ success: false, error: 'No valid organization found for user.' }, { status: 404 })
    }

    const body = await request.json()
    const { 
      botToken, chatId, dailyReport, dailyTime, 
      weeklyReport, weeklyDay, weeklyTime, 
      monthlyReport, monthlyDay, monthlyTime, 
      remindersEnabled 
    } = body

    const data = {
      botToken,
      chatId,
      dailyReport: !!dailyReport,
      dailyTime: dailyTime || "09:00",
      weeklyReport: !!weeklyReport,
      weeklyDay: parseInt(weeklyDay) || 1,
      weeklyTime: weeklyTime || "09:00",
      monthlyReport: !!monthlyReport,
      monthlyDay: parseInt(monthlyDay) || 1,
      monthlyTime: monthlyTime || "09:00",
      remindersEnabled: remindersEnabled ?? true,
    }

    try {
      const p = prisma as any
      const config = await p.telegramSettings.upsert({
        where: { organizationId: orgId },
        update: data,
        create: {
          ...data,
          organizationId: orgId
        }
      })

      console.log(`[DEBUG] Save success for Org: ${orgId}`)
      return NextResponse.json({ success: true, data: config })
    } catch (dbError: any) {
      console.error('[SETTINGS_DB_ERROR]', dbError)
      return NextResponse.json({ success: false, error: dbError.message }, { status: 500 })
    }
  } catch (error: any) {
    console.error('[SETTINGS_POST_ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
