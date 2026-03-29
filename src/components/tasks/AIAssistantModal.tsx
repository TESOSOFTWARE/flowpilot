'use client'

import { useState } from 'react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  projectId: string
  teamMembers: any[]
}

interface SuggestedTask {
  title: string
  description: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  estimatedHours: number
  assigneeId?: string
  assigneeName?: string
  selected?: boolean
}

export default function AIAssistantModal({ isOpen, onClose, onSuccess, projectId, teamMembers }: AIAssistantModalProps) {
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<SuggestedTask[]>([])
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [editingIdx, setEditingIdx] = useState<number | null>(null)

  const fetchSuggestions = async () => {
    setLoading(true)
    setError(null)
    setErrorCode(null)
    try {
      const res = await fetch('/api/ai/suggest-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      const data = await res.json()
      if (data.success) {
        setSuggestions(data.data.map((s: any) => ({ ...s, selected: true })))
      } else {
        setError(data.error)
        setErrorCode(data.code)
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch suggestions')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTasks = async () => {
    const selectedTasks = suggestions.filter(s => s.selected)
    if (selectedTasks.length === 0) return

    setCreating(true)
    try {
      // Create tasks sequentially or in bulk if supported. 
      // For simplicity, we'll hit the /api/tasks endpoint for each.
      for (const task of selectedTasks) {
        await fetch('/api/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: task.title,
            description: task.description,
            priority: task.priority,
            estimatedHours: task.estimatedHours,
            projectId,
            assigneeId: task.assigneeId || null,
            status: 'TODO'
          })
        })
      }
      toast.success(`Successfully created ${selectedTasks.length} tasks`)
      onSuccess()
    } catch (err) {
      toast.error('Failed to create some tasks')
    } finally {
      setCreating(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h2 className="text-xl font-bold text-on-surface">AI Task Assistant</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          {!loading && suggestions.length === 0 && !error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-primary text-3xl animate-pulse">auto_awesome</span>
              </div>
              <h3 className="text-lg font-bold mb-2">Need some inspiration?</h3>
              <p className="text-sm text-on-surface-variant mb-6 max-w-sm mx-auto">
                I can analyze your project details and team skills to suggest the next best steps for your team.
              </p>
              
              <div className="bg-primary/5 p-4 rounded-xl border border-primary/10 mb-8 max-w-md mx-auto text-left flex gap-3">
                <span className="material-symbols-outlined text-primary text-xl">lightbulb_outline</span>
                <p className="text-xs text-on-surface-variant leading-relaxed">
                  <span className="font-bold text-primary block mb-0.5">Pro Tip: Custom Instructions</span>
                  You can guide how I create tasks and assign team members by providing instructions in <b>Workspace AI Settings</b>.
                </p>
              </div>

              <button
                onClick={fetchSuggestions}
                className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all flex items-center gap-2 mx-auto"
              >
                Generate Suggestions
              </button>
            </div>
          )}

          {loading && (
            <div className="text-center py-20">
              <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
              <p className="text-sm font-bold text-primary animate-pulse">Consulting the AI brain...</p>
              <p className="text-xs text-on-surface-variant mt-2">Analyzing project context and team skills</p>
            </div>
          )}

          {error && (
            <div className="text-center py-12 bg-surface-container-low rounded-2xl border border-outline-variant/10 px-6">
              <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-error text-3xl">api_beam</span>
              </div>
              <h3 className="text-lg font-bold mb-2">
                {errorCode === 'AI_NOT_CONFIGURED' ? 'AI Assistant Setup' : 'Something went wrong'}
              </h3>
              <p className="text-sm text-on-surface-variant mb-8 max-w-md mx-auto leading-relaxed">
                {error}
              </p>
              {errorCode === 'AI_NOT_CONFIGURED' ? (
                <Link
                  href="/settings"
                  className="px-8 py-3 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all inline-flex items-center gap-2"
                >
                  Configure AI Provider
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              ) : (
                <button
                  onClick={fetchSuggestions}
                  className="px-8 py-3 bg-surface-container-high text-on-surface font-bold rounded-xl hover:bg-surface-container transition-all inline-flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Try Again
                </button>
              )}
            </div>
          )}

          {suggestions.length > 0 && !loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold text-on-surface-variant uppercase tracking-wider">Suggested Tasks</p>
                <button
                  onClick={() => setSuggestions(s => s.map(t => ({ ...t, selected: s.every(x => x.selected) ? false : true })))}
                  className="text-xs text-primary font-bold hover:underline"
                >
                  {suggestions.every(s => s.selected) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="space-y-3">
                {suggestions.map((task, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      task.selected ? 'border-primary bg-primary/5' : 'border-outline-variant/10 hover:border-primary/30'
                    }`}
                    onClick={() => {
                      const next = [...suggestions]
                      next[idx].selected = !next[idx].selected
                      setSuggestions(next)
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                        task.selected ? 'bg-primary border-primary' : 'border-outline-variant/40'
                      }`}>
                        {task.selected && <span className="material-symbols-outlined text-[14px] text-white">check</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        {editingIdx === idx ? (
                          <div className="space-y-3 pt-1" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Title</label>
                              <input
                                autoFocus
                                value={task.title}
                                onChange={(e) => {
                                  const next = [...suggestions]
                                  next[idx].title = e.target.value
                                  setSuggestions(next)
                                }}
                                className="w-full text-sm font-bold bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-on-surface-variant uppercase">Description</label>
                              <textarea
                                value={task.description}
                                onChange={(e) => {
                                  const next = [...suggestions]
                                  next[idx].description = e.target.value
                                  setSuggestions(next)
                                }}
                                rows={2}
                                className="w-full text-xs bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary resize-none"
                              />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Priority</label>
                                <select
                                  value={task.priority}
                                  onChange={(e) => {
                                    const next = [...suggestions]
                                    next[idx].priority = e.target.value as any
                                    setSuggestions(next)
                                  }}
                                  className="w-full text-xs bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                                >
                                  {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(p => (
                                    <option key={p} value={p}>{p}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Assignee</label>
                                <select
                                  value={task.assigneeId || ''}
                                  onChange={(e) => {
                                    const next = [...suggestions]
                                    next[idx].assigneeId = e.target.value || undefined
                                    // Update Name as well for display
                                    const member = teamMembers.find(m => m.user.id === e.target.value)
                                    next[idx].assigneeName = member?.user.name
                                    setSuggestions(next)
                                  }}
                                  className="w-full text-xs bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                                >
                                  <option value="">Unassigned</option>
                                  {teamMembers.map((m: any) => (
                                    <option key={m.user.id} value={m.user.id}>{m.user.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex-1 space-y-1">
                                <label className="text-[10px] font-bold text-on-surface-variant uppercase">Estimation (h)</label>
                                <input
                                  type="number"
                                  value={task.estimatedHours}
                                  onChange={(e) => {
                                    const next = [...suggestions]
                                    next[idx].estimatedHours = Number(e.target.value)
                                    setSuggestions(next)
                                  }}
                                  className="w-full text-xs bg-white border border-outline-variant/30 rounded-lg px-2 py-1.5 focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end gap-2 pt-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setEditingIdx(null)
                                }}
                                className="text-[10px] font-bold text-primary hover:underline px-2 py-1"
                              >
                                Done
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center justify-between mb-1">
                              <h4 className="font-bold text-on-surface truncate">{task.title}</h4>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">{task.priority}</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setEditingIdx(idx)
                                  }}
                                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[16px]">edit</span>
                                </button>
                              </div>
                            </div>
                            <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">{task.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="flex items-center gap-1 text-[10px] font-bold text-on-surface-variant">
                                <span className="material-symbols-outlined text-[12px]">schedule</span>
                                {task.estimatedHours}h estimated
                              </span>
                              {task.assigneeName && (
                                <span className="flex items-center gap-1 text-[10px] font-bold text-primary">
                                  <span className="material-symbols-outlined text-[12px] fill-current">person</span>
                                  Assign to {task.assigneeName}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low flex justify-between items-center">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            Cancel
          </button>
          
          <button
            onClick={handleCreateTasks}
            disabled={creating || suggestions.filter(s => s.selected).length === 0}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-lg shadow-primary/20 hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-2"
          >
            {creating ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">add_task</span>
                Create {suggestions.filter(s => s.selected).length} Tasks
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
