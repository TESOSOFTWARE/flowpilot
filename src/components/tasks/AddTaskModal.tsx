'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface AddTaskModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  defaultProjectId?: string
}

export default function AddTaskModal({ isOpen, onClose, onSuccess, defaultProjectId }: AddTaskModalProps) {
  const [loading, setLoading] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    projectId: defaultProjectId || '',
    assigneeId: '',
    priority: 'MEDIUM',
    dueDate: '',
    estimatedHours: '',
  })

  useEffect(() => {
    if (isOpen) {
      Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/team').then(r => r.json())
      ]).then(([projData, teamData]) => {
        if (projData.success) setProjects(projData.data)
        if (teamData.success) setTeam(teamData.data.map((m: any) => m.user).filter(Boolean))
        
        // Auto-select if there's only one project or default is provided
        if (!formData.projectId && projData.success && projData.data.length > 0) {
           setFormData(f => ({ ...f, projectId: defaultProjectId || projData.data[0].id }))
        }
      })
    }
  }, [isOpen, defaultProjectId, formData.projectId])

  if (!isOpen) return null

  const update = (key: string, value: string) => setFormData(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.title || !formData.projectId) {
      toast.error('Title and Project are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Task created successfully')
        setFormData({ title: '', description: '', projectId: defaultProjectId || projects[0]?.id || '', assigneeId: '', priority: 'MEDIUM', dueDate: '', estimatedHours: '' })
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to create task')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Create New Task</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="add-task-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Task Title <span className="text-error">*</span></label>
              <input
                type="text"
                value={formData.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Finalize architectural blueprints"
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Project <span className="text-error">*</span></label>
              <div className="relative">
                <select
                  value={formData.projectId}
                  onChange={e => update('projectId', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                  required
                >
                  <option value="" disabled>Select a project</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.title}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
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

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Description (Optional)</label>
              <textarea
                value={formData.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Add more details about this task..."
                rows={3}
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-task-form"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
          >
            {loading ? 'Saving...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  )
}
