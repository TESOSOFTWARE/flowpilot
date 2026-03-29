import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { generateTaskSuggestions } from '@/lib/ai'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const orgId = (session.user as any).organizationId
    if (!orgId) return NextResponse.json({ success: false, error: 'No organization' }, { status: 400 })

    const { projectId } = await req.json()
    if (!projectId) return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })

    // 1. Get AI Config
    const aiConfig = await prisma.aiConfig.findUnique({
      where: { organizationId: orgId }
    })

    if (!aiConfig || !aiConfig.apiKey || !aiConfig.isEnabled) {
      return NextResponse.json({ 
        success: false, 
        error: 'AI assistant is not configured yet. Please set up your API key in Workspace Settings to enable smart task suggestions.',
        code: 'AI_NOT_CONFIGURED'
      }, { status: 400 })
    }

    // 2. Get Project Details
    const project = await prisma.project.findUnique({
      where: { id: projectId, organizationId: orgId }
    })
    if (!project) return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })

    // 3. Get Existing Tasks
    const existingTasks = await prisma.task.findMany({
      where: { projectId },
      select: { title: true, status: true }
    })

    // 4. Get Team Members (Skills)
    const teamMembers = await prisma.teamMember.findMany({
      where: { organizationId: orgId },
      include: { user: { select: { id: true, name: true } } }
    })

    // 5. Generate Suggestions
    const suggestions = await generateTaskSuggestions(
      aiConfig.provider,
      aiConfig.apiKey,
      {
        project,
        existingTasks,
        teamMembers,
        baseKnowledge: aiConfig.instructions || undefined
      }
    )

    // 6. Map assignee names back to IDs
    const enrichedSuggestions = suggestions.map(s => {
      if (s.assigneeName) {
        const member = teamMembers.find(m => m.user?.name === s.assigneeName)
        if (member && member.user) {
          return { ...s, assigneeId: member.user.id }
        }
      }
      return s
    })

    return NextResponse.json({ success: true, data: enrichedSuggestions })
  } catch (err: any) {
    console.error('AI Suggestion Error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
