import { prisma } from '@/lib/prisma'
import { generateProjectReport } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  // Security: Check for Vercel Cron Secret or just a simple API Key
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  if (key !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const configs = await (prisma as any).telegramSettings.findMany({
      include: { organization: { include: { aiConfig: true, projects: { include: { tasks: true } } } } }
    })

    const now = new Date()
    const currentHour = now.getHours().toString().padStart(2, '0')
    const currentMinute = now.getMinutes().toString().padStart(2, '0')
    const currentTime = `${currentHour}:${currentMinute}`
    const currentDayOfWeek = now.getDay()
    const currentDayOfMonth = now.getDate()
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()

    const results = []

    for (const config of configs) {
      if (!config.botToken || !config.chatId) continue
      
      const org = config.organization
      const ai = org.aiConfig
      const projects = org.projects

      // 1. Automated Reports Trigger Logic
      let reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null = null

      const isMonthlyTime = config.monthlyTime === currentTime
      const isMonthlyDay = config.monthlyDay === currentDayOfMonth || (config.monthlyDay > lastDayOfMonth && currentDayOfMonth === lastDayOfMonth)

      if (config.dailyReport && config.dailyTime === currentTime) {
        reportType = 'DAILY'
      } else if (config.weeklyReport && config.weeklyDay === currentDayOfWeek && config.weeklyTime === currentTime) {
        reportType = 'WEEKLY'
      } else if (config.monthlyReport && isMonthlyDay && isMonthlyTime) {
        reportType = 'MONTHLY'
      }

      if (reportType) {
        
        for (const project of projects) {
          if (project.status === 'ARCHIVED' || project.status === 'COMPLETED') continue

          let reportText = ''
          if (config.remindersEnabled && ai) {
            // AI-Enhanced Report
            const report = await generateProjectReport(ai.provider, ai.apiKey, {
              project,
              tasks: project.tasks,
              baseKnowledge: ai.instructions || undefined
            })

            reportText = `📅 *${reportType} REPORT: ${project.title}*\n\n` +
              `📝 *AI Summary:*\n${report.summary}\n\n` +
              `⚠️ *Anomalies:*\n${report.anomalies.map(a => `• ${a}`).join('\n') || 'None.'}\n\n` +
              `🚀 *Next Steps:*\n${report.nextSteps.map(s => `• ${s}`).join('\n')}`;
          } else {
            // Standard Report (Fallback if AI missing or disabled)
            const activeTasks = (project.tasks as any[]).filter(t => t.status !== 'DONE')
            reportText = `📅 *${reportType} REPORT: ${project.title}*\n\n` +
              `📊 *Progress:* ${project.progress}%\n` +
              `✅ *Status:* ${project.status}\n\n` +
              (config.remindersEnabled && !ai ? `💡 *Note:* AI Summary skipped (AI Config missing).\n\n` : '') +
              `📋 *Active Tasks (${activeTasks.length}):*\n` +
              activeTasks.slice(0, 10).map(t => `• ${t.title} (${t.priority})`).join('\n') +
              (activeTasks.length > 10 ? `\n...and ${activeTasks.length - 10} more.` : '');
          }

          await sendTelegramMessage(config.botToken, config.chatId, reportText)
        }
      }

      // 2. reminders & "Abnormal Things"
      if (config.remindersEnabled) {
         for (const project of projects) {
            const overdueTasks = (project.tasks as any[]).filter(t => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE')
            if (overdueTasks.length > 0) {
              const reminderText = `🔔 *DEADLINE REMINDER: ${project.title}*\n\n` +
                `The following tasks are overdue:\n` +
                overdueTasks.map(t => `• ${t.title} (${new Date(t.dueDate!).toLocaleDateString()})`).join('\n') +
                `\n\nPlease check the dashboard to update status.`;
              
              await sendTelegramMessage(config.botToken, config.chatId, reminderText)
            }
         }
      }

      results.push({ orgId: org.id, status: 'processed' })
    }

    return NextResponse.json({ success: true, processed: results.length })
  } catch (err) {
    console.error('Cron Error:', err)
    return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
  }
}

async function sendTelegramMessage(botToken: string, chatId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text: text,
      parse_mode: 'Markdown',
    }),
  })
}
