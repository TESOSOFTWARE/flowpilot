import { GoogleGenerativeAI } from '@google/generative-ai'
import OpenAI from 'openai'

interface TaskSuggestion {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedHours: number
  assigneeId?: string
  assigneeName?: string
}

export async function generateTaskSuggestions(
  provider: string,
  apiKey: string,
  context: {
    project: any
    existingTasks: any[]
    teamMembers: any[]
    baseKnowledge?: string
  }
): Promise<TaskSuggestion[]> {
  const prompt = `
    You are an expert project manager assistant.
    Suggest 3-5 new tasks for the following project:
    
    PROJECT:
    Title: ${context.project.title}
    Description: ${context.project.description || 'No description'}
    Category: ${context.project.category || 'General'}
    Deadline: ${context.project.deadline ? new Date(context.project.deadline).toLocaleDateString() : 'None'}
    
    EXISTING TASKS:
    ${context.existingTasks.length > 0 
      ? context.existingTasks.map(t => `- ${t.title} (${t.status})`).join('\n')
      : 'No tasks yet.'
    }
    
    TEAM MEMBERS & SKILLS:
    ${context.teamMembers.map(m => `- ${m.user.name}: ${m.skills || 'General skills'}`).join('\n')}
    
    INSTRUCTIONS:
    - Suggest tasks that are logical next steps or missing gaps based on the current project status and existing tasks.
    - If there are no tasks, suggest initial planning and setup tasks.
    - If there are tasks, suggest implementation, testing, or follow-up tasks that don't duplicate existing work.
    - Consider team member skills when suggesting tasks and assign the most suitable person.
    - Format yours response as a JSON object with a "tasks" key containing an array of objects with: 
      title, description, priority (LOW, MEDIUM, HIGH, CRITICAL), estimatedHours (number), and assigneeName (matching one of the names provided above, or leave null).
    - Return ONLY the JSON object.
    
    ${context.baseKnowledge ? `ADDITIONAL INSTRUCTIONS (Follow these strictly):\n${context.baseKnowledge}` : ''}
  `

  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const text = result.response.text()
    return parseAIResponse(text)
  }

  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    const text = response.choices[0].message.content || '[]'
    return parseAIResponse(text)
  }

  throw new Error(`Unsupported AI provider: ${provider}`)
}

function parseAIResponse(text: string): TaskSuggestion[] {
  try {
    // Basic cleanup of AI response (remove markdown code blocks)
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonString)
    
    // Handle both { tasks: [...] } and [...] formats
    const suggestions = Array.isArray(parsed) ? parsed : (parsed.tasks || [])
    
    return suggestions.map((s: any) => ({
      title: s.title || 'New Task',
      description: s.description || '',
      priority: s.priority || 'MEDIUM',
      estimatedHours: s.estimatedHours || 4,
      assigneeName: s.assigneeName || null,
    }))
  } catch (err) {
    console.error('Failed to parse AI response:', err, text)
    return []
  }
}
