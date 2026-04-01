import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateProjectReport } from '@/lib/ai'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const orgId = (session.user as any).organizationId
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization' }, { status: 403 })

    const body = await request.json()
    const { botToken, chatId, remindersEnabled, reportType = 'DAILY' } = body

    if (!botToken || !chatId) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    // 1. Get Telegram config to check if AI is enabled
    const telConfig = await (prisma as any).telegramSettings.findUnique({
      where: { organizationId: orgId }
    })

    const isAIEnabled = remindersEnabled ?? telConfig?.remindersEnabled ?? false

    // 2. Get a sample project
    const project = await prisma.project.findFirst({
      where: { organizationId: orgId },
      orderBy: { updatedAt: 'desc' },
      include: { tasks: true }
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'No projects found to generate a report for.' }, { status: 400 })
    }

    let reportText = ''
    if (isAIEnabled) {
      // AI-Enhanced Report - Validate AI config only here
      const aiConfig = await prisma.aiConfig.findUnique({
        where: { organizationId: orgId }
      })

      if (!aiConfig) {
        return NextResponse.json({ success: false, error: 'Please configure AI Provider first to use AI-Enhanced reports.' }, { status: 400 })
      }

      const report = await generateProjectReport(aiConfig.provider, aiConfig.apiKey, {
        project,
        tasks: project.tasks,
        baseKnowledge: aiConfig.instructions || undefined
      })

      reportText = `🧪 *TEST ${reportType.toUpperCase()} AI REPORT: ${project.title}*\n\n` +
        `📝 *AI Summary:*\n${report.summary}\n\n` +
        `⚠️ *Anomalies:*\n${report.anomalies.map((a: string) => `• ${a}`).join('\n') || 'None.'}\n\n` +
        `🚀 *Next Steps:*\n${report.nextSteps.map((s: string) => `• ${s}`).join('\n')}`;
    } else {
      // Standard Report
      const activeTasks = (project.tasks as any[]).filter(t => t.status !== 'DONE')
      reportText = `🧪 *TEST ${reportType.toUpperCase()} STANDARD REPORT: ${project.title}*\n\n` +
        `📊 *Progress:* ${project.progress}%\n` +
        `✅ *Status:* ${project.status}\n\n` +
        `📋 *Active Tasks (${activeTasks.length}):*\n` +
        activeTasks.slice(0, 10).map(t => `• ${t.title} (${t.priority})`).join('\n') +
        (activeTasks.length > 10 ? `\n...and ${activeTasks.length - 10} more.` : '');
    }

    // 4. Send to Telegram
    const telRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: reportText,
        parse_mode: 'Markdown',
      }),
    })

    const telData = await telRes.json()
    if (!telData.ok) {
      return NextResponse.json({ success: false, error: telData.description || 'Telegram API Error' })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[TEST_REPORT_ERROR]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
