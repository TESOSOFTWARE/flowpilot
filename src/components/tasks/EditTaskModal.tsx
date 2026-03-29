'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface EditTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  task: any | null
}

export default function EditTaskModal({ isOpen, onClose, onSuccess, task }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'details' | 'comments' | 'worklogs'>('details')
  const [comments, setComments] = useState<any[]>([])
  const [workLogs, setWorkLogs] = useState<any[]>([])
  const [newComment, setNewComment] = useState('')
  const [newWorkLog, setNewWorkLog] = useState({ hours: '', description: '', date: new Date().toISOString().split('T')[0] })
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingWorkLogs, setLoadingWorkLogs] = useState(false)
  
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editCommentContent, setEditCommentContent] = useState('')
  const [editingWorkLogId, setEditingWorkLogId] = useState<string | null>(null)
  const [editWorkLogData, setEditWorkLogData] = useState<any>(null)
  const [hasChanged, setHasChanged] = useState(false)

  const { data: session } = useSession()
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: '',
    assigneeId: '',
    priority: 'MEDIUM',
    status: 'TODO',
    dueDate: '',
    estimatedHours: '',
  })

  const fetchComments = async () => {
    if (!task?.id) return
    setLoadingComments(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`)
      const data = await res.json()
      if (data.success) {
        setComments(data.data)
      } else {
        toast.error(`Load Comments Error: ${data.error || res.statusText}`)
      }
    } catch (err: any) {
      toast.error(`Fetch Comments Exception: ${err.message}`)
    } finally { setLoadingComments(false) }
  }

  const fetchWorkLogs = async () => {
    if (!task?.id) return
    setLoadingWorkLogs(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}/worklogs`)
      const data = await res.json()
      if (data.success) {
        setWorkLogs(data.data)
      } else {
        toast.error(`Load Logs Error: ${data.error || res.statusText}`)
      }
    } catch (err: any) {
      toast.error(`Fetch Logs Exception: ${err.message}`)
    } finally { setLoadingWorkLogs(false) }
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    try {
      const res = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      })
      const data = await res.json()
      if (data.success) {
        setComments([data.data, ...comments])
        setNewComment('')
        setHasChanged(true)
      } else {
        toast.error(`Comment API Error: ${data.error || res.statusText}`)
      }
    } catch (err: any) { toast.error(`Comment Fetch Exception: ${err.message}`) }
  }

  const handleLogWork = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkLog.hours) return
    try {
      const res = await fetch(`/api/tasks/${task.id}/worklogs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorkLog)
      })
      const data = await res.json()
      if (data.success) {
        setWorkLogs([data.data, ...workLogs])
        setNewWorkLog({ hours: '', description: '', date: new Date().toISOString().split('T')[0] })
        setHasChanged(true)
        toast.success('Work logged successfully')
      } else {
        toast.error(`Log Work API Error: ${data.error || res.statusText}`)
      }
    } catch (err: any) { toast.error(`Log Work Fetch Exception: ${err.message}`) }
  }

  const handleUpdateComment = async (id: string) => {
    if (!editCommentContent.trim()) return
    try {
      const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editCommentContent })
      })
      const data = await res.json()
      if (data.success) {
        setComments(comments.map(c => c.id === id ? data.data : c))
        setEditingCommentId(null)
        setHasChanged(true)
        toast.success('Comment updated')
      } else { toast.error(data.error || 'Failed to update comment') }
    } catch { toast.error('Failed to update comment') }
  }

  const handleDeleteComment = async (id: string) => {
    if (!confirm('Delete this comment?')) return
    try {
      const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setComments(comments.filter(c => c.id !== id))
        setHasChanged(true)
        toast.success('Comment deleted')
      } else { toast.error(data.error || 'Failed to delete comment') }
    } catch { toast.error('Failed to delete comment') }
  }

  const handleUpdateWorkLog = async (id: string) => {
    if (!editWorkLogData.hours) return
    try {
      const res = await fetch(`/api/worklogs/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editWorkLogData)
      })
      const data = await res.json()
      if (data.success) {
        setWorkLogs(workLogs.map(l => l.id === id ? data.data : l))
        setEditingWorkLogId(null)
        setHasChanged(true)
        toast.success('Work log updated')
      } else { toast.error(data.error || 'Failed to update work log') }
    } catch { toast.error('Failed to update work log') }
  }

  const handleDeleteWorkLog = async (id: string) => {
    if (!confirm('Delete this work log entry?')) return
    try {
      const res = await fetch(`/api/worklogs/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        setWorkLogs(workLogs.filter(l => l.id !== id))
        setHasChanged(true)
        toast.success('Work log deleted')
      } else { toast.error(data.error || 'Failed to delete work log') }
    } catch { toast.error('Failed to delete work log') }
  }

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/team').then(r => r.json())
      ]).then(([projData, teamData]) => {
        if (projData.success) setProjects(projData.data)
        if (teamData.success) setTeam(teamData.data.map((m: any) => m.user).filter(Boolean))
      })
      fetchComments()
      fetchWorkLogs()
    }
  }, [isOpen, task?.id])

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        description: task.description || '',
        projectId: task.projectId || task.project?.id || '',
        assigneeId: task.assigneeId || task.assignee?.id || '',
        priority: task.priority || 'MEDIUM',
        status: task.status || 'TODO',
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
        estimatedHours: task.estimatedHours || '',
      })
    }
  }, [task])

  const handleClose = () => {
    if (hasChanged) {
      onSuccess()
    } else {
      onClose()
    }
  }

  if (!isOpen || !task) return null

  const update = (key: string, value: string) => setFormData(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Task updated successfully')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to update task')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this task?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/tasks/${task.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Task deleted')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to delete task')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Edit Task</h2>
          <button onClick={handleClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-outline-variant/5 bg-surface-container-low px-6">
          {[
            { id: 'details', label: 'Details', icon: 'info' },
            { id: 'comments', label: 'Comments', icon: 'chat' },
            { id: 'worklogs', label: 'Work Logs', icon: 'timer' },
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold transition-all border-b-2 ${
                activeTab === t.id 
                  ? 'text-primary border-primary' 
                  : 'text-on-surface-variant border-transparent hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-lg">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <form id="edit-task-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Existing Form Fields */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Task Title <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => update('title', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Description</label>
                <textarea
                  value={formData.description}
                  onChange={e => update('description', e.target.value)}
                  placeholder="Add more details about this task..."
                  rows={4}
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Project</label>
                  <div className="relative">
                    <select
                      value={formData.projectId}
                      onChange={e => update('projectId', e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select a project</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.title}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Status</label>
                  <div className="relative">
                    <select
                      value={formData.status}
                      onChange={e => update('status', e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer font-bold"
                    >
                      <option value="TODO">To Do</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DONE">Done</option>
                      <option value="BLOCKED">Blocked</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Assignee</label>
                  <div className="relative">
                    <select
                      value={formData.assigneeId}
                      onChange={e => update('assigneeId', e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                    >
                      <option value="">Unassigned</option>
                      {team.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.email}</option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Priority</label>
                  <div className="relative">
                    <select
                      value={formData.priority}
                      onChange={e => update('priority', e.target.value)}
                      className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High</option>
                      <option value="CRITICAL">Critical</option>
                    </select>
                    <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Due Date</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={e => update('dueDate', e.target.value)}
                    className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-on-surface">Estimated Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    value={formData.estimatedHours}
                    onChange={e => update('estimatedHours', e.target.value)}
                    placeholder="e.g. 8.5"
                    className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                  />
                </div>
              </div>
            </form>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-6">
              <form onSubmit={handleAddComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Ask a question or post an update..."
                  className="w-full bg-surface-container-low rounded-xl py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 min-h-[100px] resize-none transition-all"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">send</span>
                    Send
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {loadingComments ? (
                  <p className="text-center text-xs text-on-surface-variant py-4 animate-pulse">Loading comments...</p>
                ) : comments.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant py-8">No comments yet. Be the first to start the conversation!</p>
                ) : (
                  comments.map(c => (
                    <div key={c.id} className="flex gap-3 items-start group">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0 overflow-hidden">
                        {c.user?.image ? <img src={c.user.image} alt="" className="w-full h-full object-cover" /> : (c.user?.name?.[0] || '?')}
                      </div>
                      <div className="flex-1 bg-surface-container-low rounded-2xl p-4 group-hover:bg-surface-container transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-on-surface">{c.user?.name || 'Unknown User'}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-on-surface-variant">{new Date(c.createdAt).toLocaleString()}</span>
                            {session?.user?.id === c.userId && !editingCommentId && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingCommentId(c.id); setEditCommentContent(c.content); }} className="p-1 text-primary hover:bg-primary/10 rounded">
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                </button>
                                <button onClick={() => handleDeleteComment(c.id)} className="p-1 text-error hover:bg-error/10 rounded">
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                        {editingCommentId === c.id ? (
                          <div className="space-y-2 mt-2">
                            <textarea
                              value={editCommentContent}
                              onChange={e => setEditCommentContent(e.target.value)}
                              className="w-full bg-white rounded-lg p-2 text-sm border border-primary/20 outline-none focus:ring-2 focus:ring-primary/20 min-h-[60px] resize-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingCommentId(null)} className="px-2 py-1 text-[10px] font-bold text-on-surface-variant hover:bg-surface-container-high rounded">Cancel</button>
                              <button onClick={() => handleUpdateComment(c.id)} className="px-2 py-1 text-[10px] font-bold bg-primary text-white rounded hover:opacity-90">Save</button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-on-surface-variant whitespace-pre-wrap">{c.content}</p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'worklogs' && (
            <div className="space-y-6">
              <form onSubmit={handleLogWork} className="bg-surface-container-low p-4 rounded-xl space-y-4 border border-outline-variant/5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Hours Spent</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      placeholder="e.g. 2.5"
                      value={newWorkLog.hours}
                      onChange={e => setNewWorkLog({ ...newWorkLog, hours: e.target.value })}
                      className="w-full bg-white rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      value={newWorkLog.date}
                      onChange={e => setNewWorkLog({ ...newWorkLog, date: e.target.value })}
                      className="w-full bg-white rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Description (Optional)</label>
                  <input
                    type="text"
                    placeholder="Briefly describe what you did..."
                    value={newWorkLog.description}
                    onChange={e => setNewWorkLog({ ...newWorkLog, description: e.target.value })}
                    className="w-full bg-white rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-secondary text-white text-xs font-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">add_task</span>
                  Log Work
                </button>
              </form>

              <div className="space-y-3">
                <h4 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest px-1">Log History</h4>
                {loadingWorkLogs ? (
                  <p className="text-center text-xs text-on-surface-variant py-4">Loading logs...</p>
                ) : workLogs.length === 0 ? (
                  <p className="text-center text-xs text-on-surface-variant py-8 bg-surface-container-low rounded-xl">No hours logged yet.</p>
                ) : (
                  <div className="divide-y divide-outline-variant/10">
                    {workLogs.map(l => (
                      <div key={l.id} className="py-3 group border-b border-outline-variant/10 last:border-0">
                        {editingWorkLogId === l.id ? (
                          <div className="bg-white p-3 rounded-lg space-y-3 mt-2 border border-primary/20 shadow-sm">
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                type="number"
                                step="0.5"
                                value={editWorkLogData.hours}
                                onChange={e => setEditWorkLogData({ ...editWorkLogData, hours: e.target.value })}
                                className="bg-surface-container-low rounded p-2 text-xs outline-none"
                              />
                              <input
                                type="date"
                                value={editWorkLogData.date}
                                onChange={e => setEditWorkLogData({ ...editWorkLogData, date: e.target.value })}
                                className="bg-surface-container-low rounded p-2 text-xs outline-none"
                              />
                            </div>
                            <input
                              type="text"
                              value={editWorkLogData.description}
                              onChange={e => setEditWorkLogData({ ...editWorkLogData, description: e.target.value })}
                              className="w-full bg-surface-container-low rounded p-2 text-xs outline-none"
                            />
                            <div className="flex justify-end gap-2">
                              <button onClick={() => setEditingWorkLogId(null)} className="px-2 py-1 text-[10px] font-bold text-on-surface-variant hover:bg-surface-container-high rounded">Cancel</button>
                              <button onClick={() => handleUpdateWorkLog(l.id)} className="px-2 py-1 text-[10px] font-bold bg-secondary text-white rounded hover:opacity-90">Update</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary font-bold text-xs">
                                {l.hours}h
                              </div>
                              <div>
                                <p className="text-sm font-bold text-on-surface">{l.description || 'General Work'}</p>
                                <p className="text-[10px] text-on-surface-variant">{new Date(l.date).toLocaleDateString()} · {l.user?.name}</p>
                              </div>
                            </div>
                            {session?.user?.id === l.userId && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => { setEditingWorkLogId(l.id); setEditWorkLogData({ hours: l.hours, description: l.description || '', date: l.date.split('T')[0] }); }} className="p-1 text-primary hover:bg-primary/10 rounded">
                                  <span className="material-symbols-outlined text-xs">edit</span>
                                </button>
                                <button onClick={() => handleDeleteWorkLog(l.id)} className="p-1 text-error hover:bg-error/10 rounded">
                                  <span className="material-symbols-outlined text-xs">delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low flex justify-between items-center mt-auto">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-bold text-error hover:bg-error-container rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
          
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-task-form"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
