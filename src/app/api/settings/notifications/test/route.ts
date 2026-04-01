import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

  const { botToken, chatId } = await request.json()
  if (!botToken || !chatId) {
    return NextResponse.json({ success: false, error: 'Bot Token and Chat ID are required' }, { status: 400 })
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: '🚀 *TinyBee Connection Test*\n\nYour Telegram bot is successfully connected to TinyBee! You will now receive project reports and reminders here.',
        parse_mode: 'Markdown',
      }),
    })

    const data = await response.json()
    if (!data.ok) {
      return NextResponse.json({ success: false, error: data.description || 'Telegram API Error' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ success: false, error: 'Failed to connect to Telegram' }, { status: 500 })
  }
}
