import { prisma } from '@/lib/prisma'
import { generateProjectReport, parseBotCommand } from '@/lib/ai'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { message } = body

    if (!message || !message.text || !message.chat) {
      return NextResponse.json({ ok: true })
    }

    const chatId = String(message.chat.id)
    const text = message.text

    // Find the organization associated with this chatId
    const telegramConfig = await (prisma as any).telegramSettings.findFirst({
      where: { chatId },
      include: { organization: { include: { aiConfig: true } } }
    })

    if (!telegramConfig || !telegramConfig.organization.aiConfig) {
      // If not found, we don't know who this is. 
      // We could prompt them to set up their chatId in the app.
      return NextResponse.json({ ok: true })
    }

    const org = telegramConfig.organization
    const ai = org.aiConfig

    // Use AI to parse the intent
    const intent = await parseBotCommand(ai.provider, ai.apiKey, text)

    if (intent.command === 'REPORT') {
      // Find the project. If intent.target is provided, try to match it.
      // Else, get the most recently updated project.
      const project = await prisma.project.findFirst({
        where: { 
          organizationId: org.id,
          ...(intent.target ? { title: { contains: intent.target, mode: 'insensitive' } } : {})
        },
        orderBy: { updatedAt: 'desc' },
        include: { tasks: true }
      })

      if (!project) {
        await sendTelegramMessage(telegramConfig.botToken, chatId, "🔍 I couldn't find a project matching that name in your workspace.")
        return NextResponse.json({ ok: true })
      }

      const report = await generateProjectReport(ai.provider, ai.apiKey, {
        project,
        tasks: project.tasks,
        baseKnowledge: ai.instructions || undefined
      })

      const responseText = `📊 *Project Report: ${project.title}*\n\n` +
        `📝 *Summary:*\n${report.summary}\n\n` +
        `⚠️ *Anomalies/Risks:*\n${report.anomalies.map(a => `• ${a}`).join('\n') || 'None detected.'}\n\n` +
        `🚀 *Next Steps:*\n${report.nextSteps.map(s => `• ${s}`).join('\n')}`;

      await sendTelegramMessage(telegramConfig.botToken, chatId, responseText)
    } else if (intent.command === 'TIMELINE') {
       // Similar logic for timeline (Simplified for now)
       await sendTelegramMessage(telegramConfig.botToken, chatId, "⏳ Timeline feature is coming soon! For now, I can only provide project reports. Try asking for a 'report'.")
    } else if (text.startsWith('/start')) {
       await sendTelegramMessage(telegramConfig.botToken, chatId, "👋 *Hello!* I am your FlowPilot Assistant.\n\nYou are connected to *" + org.name + "*.\n\nYou can ask me for a 'project report' or just say 'give me an update on [project name]'.")
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Telegram Webhook Error:', err)
    return NextResponse.json({ ok: true }) // Always return OK to Telegram
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
