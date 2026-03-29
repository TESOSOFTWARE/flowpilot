import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const orgId = (session.user as any).organizationId
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 })

    const config = await prisma.aiConfig.findUnique({
      where: { organizationId: orgId }
    })

    return NextResponse.json({ success: true, data: config })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const orgId = (session.user as any).organizationId
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 })

    const { provider, apiKey, isEnabled, instructions } = await req.json()

    const config = await prisma.aiConfig.upsert({
      where: { organizationId: orgId },
      update: { provider, apiKey, isEnabled, instructions },
      create: { provider, apiKey, isEnabled, instructions, organizationId: orgId }
    })

    return NextResponse.json({ success: true, data: config })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
