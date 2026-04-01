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

export interface ProjectReport {
  summary: string
  anomalies: string[]
  nextSteps: string[]
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

export async function generateProjectReport(
  provider: string,
  apiKey: string,
  context: {
    project: any
    tasks: any[]
    baseKnowledge?: string
  }
): Promise<ProjectReport> {
  const prompt = `
    You are an expert construction and architectural project manager.
    Generate a concise project report for:
    
    PROJECT: ${context.project.title}
    Status: ${context.project.status}
    Progress: ${context.project.progress}%
    Category: ${context.project.category || 'General'}
    
    TASKS SUMMARY:
    Total: ${context.tasks.length}
    Done: ${context.tasks.filter(t => t.status === 'DONE').length}
    Overdue: ${context.tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'DONE').length}
    
    INSTRUCTIONS:
    - Provide a professional 2-3 sentence summary of the current state.
    - Identify 1-3 "anomalies" or risks (e.g. overdue tasks, stagnant progress, budget concerns).
    - Suggest 2 immediate next steps.
    - Format as a JSON object with: summary, anomalies (array), nextSteps (array).
    - Return ONLY JSON.
    
    ${context.baseKnowledge ? `ADDITIONAL CONTEXT:\n${context.baseKnowledge}` : ''}
  `

  let text = ''
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    text = result.response.text()
  } else if (provider === 'openai') {
    const openai = new OpenAI({ apiKey })
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    })
    text = response.choices[0].message.content || '{}'
  }

  try {
    const jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonString)
    return {
      summary: parsed.summary || 'Summary unavailable.',
      anomalies: parsed.anomalies || [],
      nextSteps: parsed.nextSteps || [],
    }
  } catch (err) {
    return { summary: 'Error generating report.', anomalies: [], nextSteps: [] }
  }
}

export async function parseBotCommand(
  provider: string,
  apiKey: string,
  text: string
): Promise<{ command: 'REPORT' | 'TIMELINE' | 'NONE'; target?: string }> {
  const prompt = `
    Analyze this message from a project management telegram bot and identify the user's intent.
    MESSAGE: "${text}"
    
    INTENTS:
    - REPORT: User wants a summary or status report.
    - TIMELINE: User wants to see the project timeline or deadlines.
    - NONE: Unrelated or greeting.
    
    Format as JSON: { "command": "REPORT" | "TIMELINE" | "NONE", "target": "project name or id if found, else null" }
  `
  
  let responseText = ''
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    responseText = result.response.text()
  } else {
     const openai = new OpenAI({ apiKey })
     const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
     })
     responseText = response.choices[0].message.content || '{}'
  }

  try {
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim()
    return JSON.parse(jsonString)
  } catch {
    return { command: 'NONE' }
  }
}
