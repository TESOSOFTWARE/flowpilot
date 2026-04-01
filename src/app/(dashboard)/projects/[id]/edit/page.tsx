'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'
import ConfirmationModal from '@/components/ui/ConfirmationModal'

interface CustomField {
  id: string
  name: string
  label: string
  fieldType: string
  options: string | null
  required: boolean
}

interface User {
  id: string
  name: string | null
  email: string
}

export default function EditProjectPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [managers, setManagers] = useState<User[]>([])
  const [customFields, setCustomFields] = useState<CustomField[]>([])
  const [customValues, setCustomValues] = useState<Record<string, string>>({})
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    managerId: '',
    status: 'ACTIVE',
    priority: 'MEDIUM',
    budget: '',
    deadline: '',
    category: '',
    startDate: '',
    estimatedHours: '',
  })

  const fetchProjectData = useCallback(async () => {
    try {
      const [teamRes, projRes, fieldsRes] = await Promise.all([
        fetch('/api/team'),
        fetch(`/api/projects/${params.id}`),
        fetch('/api/organization/custom-fields')
      ])
      
      const teamData = await teamRes.json()
      if (teamData.success) {
        setManagers(teamData.data.map((m: any) => m.user))
      }

      const fieldsData = await fieldsRes.json()
      if (fieldsData.success) {
        setCustomFields(fieldsData.data)
      }

      const projData = await projRes.json()
      if (projData.success) {
        const p = projData.data
        
        const initialCustomValues: Record<string, string> = {}
        for (const cv of p.customValues || []) {
          initialCustomValues[cv.customField.id] = cv.value
        }
        setCustomValues(initialCustomValues)
        
        setFormData({
          title: p.title || '',
          description: p.description || '',
          managerId: p.managerId || '',
          status: p.status || 'ACTIVE',
          priority: p.priority || 'MEDIUM',
          budget: p.budget ? String(p.budget) : '',
          deadline: p.deadline ? new Date(p.deadline).toISOString().split('T')[0] : '',
          category: p.category || '',
          startDate: p.startDate ? new Date(p.startDate).toISOString().split('T')[0] : '',
          estimatedHours: p.estimatedHours ? String(p.estimatedHours) : '',
        })
      } else {
        toast.error('Project not found')
        router.push('/projects')
      }
    } catch {
      toast.error('Failed to load project details')
    } finally {
      setInitialLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchProjectData()
  }, [fetchProjectData])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          managerId: formData.managerId || null,
          status: formData.status,
          priority: formData.priority,
          budget: formData.budget && formData.budget !== "" ? parseFloat(formData.budget) : null,
          deadline: formData.deadline && formData.deadline !== "" ? formData.deadline : null,
          startDate: formData.startDate && formData.startDate !== "" ? formData.startDate : null,
          category: formData.category,
          customValues: Object.entries(customValues).map(([fieldId, value]) => ({
            fieldId,
            value
          }))
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Project updated successfully!')
        router.push(`/projects/${params.id}`)
      } else {
        toast.error(data.error || 'Failed to update project')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/projects/${params.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Project deleted successfully')
        router.push('/projects')
      } else {
        toast.error(data.error || 'Failed to delete project')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setIsDeleting(false)
      setIsConfirmOpen(false)
    }
  }

  const update = (key: string, value: string) => setFormData(f => ({ ...f, [key]: value }))

  if (initialLoading) {
    return (
      <div className="p-16 text-center text-on-surface-variant">
        <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
        <p className="mt-2 text-sm">Loading project details...</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
        <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <Link href={`/projects/${params.id}`} className="hover:text-primary transition-colors">{formData.title || 'Project'}</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-medium text-on-surface">Edit</span>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Manage Project</h1>
      <p className="text-on-surface-variant text-lg mb-8">Update the details and attributes for this workspace.</p>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        <section className="bg-white rounded-xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-sm">info</span>
            </div>
            <h2 className="text-xl font-bold">Core Details</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">
                Project Title <span className="text-error">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={e => update('title', e.target.value)}
                placeholder="e.g. Skyline Residential Complex"
                required
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={e => update('startDate', e.target.value)}
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => update('deadline', e.target.value)}
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2 relative group">
              <label className="block text-sm font-semibold text-on-surface flex items-center gap-1">
                Estimated Effort (Hours)
                <span className="material-symbols-outlined text-xs text-on-surface-variant cursor-help" title="Total estimated hours is the sum of all task estimations in this project.">info</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={formData.estimatedHours}
                  readOnly
                  disabled
                  placeholder="0"
                  className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none opacity-70 cursor-not-allowed transition-all"
                />
                <div className="absolute left-0 -top-10 hidden group-hover:block bg-on-surface text-surface text-[11px] py-1.5 px-3 rounded-lg shadow-xl z-20 whitespace-nowrap animate-in fade-in slide-in-from-bottom-1 underline-offset-4 font-medium">
                   <div className="flex items-center gap-1.5">
                     <span className="material-symbols-outlined text-xs">info</span>
                     Calculated automatically from tasks
                   </div>
                   <div className="absolute left-4 bottom-[-4px] w-2 h-2 bg-on-surface rotate-45"></div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Project Manager</label>
              <div className="relative">
                <select
                  value={formData.managerId}
                  onChange={e => update('managerId', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                >
                  <option value="">Select a manager</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>{m.name || m.email}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Category</label>
              <input
                type="text"
                value={formData.category}
                onChange={e => update('category', e.target.value)}
                placeholder="e.g. Urban Development"
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Status</label>
              <div className="relative">
                <select
                  value={formData.status}
                  onChange={e => update('status', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                >
                  <option value="ACTIVE">Active</option>
                  <option value="PENDING">Pending</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Priority</label>
              <div className="relative">
                <select
                  value={formData.priority}
                  onChange={e => update('priority', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
              </div>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Budget (USD)</label>
              <input
                type="number"
                value={formData.budget}
                onChange={e => update('budget', e.target.value)}
                placeholder="e.g. 1500000"
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Project Description</label>
              <textarea
                value={formData.description}
                onChange={e => update('description', e.target.value)}
                placeholder="Brief overview of the architectural scope and milestones..."
                rows={4}
                className="w-full bg-surface-container-low rounded-lg py-3 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
              />
            </div>
          </div>
        </section>

        {/* Custom Attributes */}
        <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/20 to-secondary/5 text-secondary flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-lg">tune</span>
              </div>
              <div>
                <h2 className="text-xl font-bold tracking-tight">Custom Attributes</h2>
                <p className="text-[11px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-0.5">Workspace-defined Project Metadata</p>
              </div>
            </div>
            <Link 
              href="/settings"
              className="text-[10px] font-bold text-primary hover:text-primary-container bg-primary/5 px-3 py-1.5 rounded-full transition-all flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[14px]">settings</span>
              Configure Fields
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customFields.length === 0 ? (
              <div className="col-span-full py-16 text-center border-2 border-dashed border-outline-variant/20 rounded-2xl bg-white/40 ring-4 ring-surface-container-low/50">
                <span className="material-symbols-outlined text-4xl text-outline-variant opacity-25 mb-3 block scale-110">format_list_bulleted_add</span>
                <p className="text-sm font-bold text-on-surface-variant/70 italic tracking-tight">No custom attributes defined yet.</p>
                <Link href="/settings" className="text-xs text-primary font-extrabold hover:underline mt-3 inline-block transition-all hover:scale-105">Initialize attributes in Settings</Link>
              </div>
            ) : (
              customFields.map((field) => (
                <div key={field.id} className="bg-white p-5 rounded-2xl border border-outline-variant/20 shadow-[0_4px_12px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_20px_rgba(0,0,0,0.06)] hover:border-secondary/20 transition-all group">
                  <div className="flex justify-between items-center mb-4">
                    <label className="text-[10px] font-extrabold text-on-surface-variant/80 uppercase tracking-[0.15em]">{field.label}</label>
                    <div className="px-2 py-0.5 rounded-md text-[8px] bg-secondary/5 text-secondary font-black tracking-tighter ring-1 ring-secondary/10 uppercase group-hover:bg-secondary/10 transition-colors">
                      {field.fieldType}
                    </div>
                  </div>
                  
                  {field.fieldType === 'ENUM' ? (
                    <div className="relative">
                      <select
                        value={customValues[field.id] || ''}
                        onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                        required={field.required}
                        className="w-full bg-surface-container-low rounded-xl py-3 px-4 text-sm border-2 border-transparent outline-none focus:border-secondary/30 focus:bg-white transition-all appearance-none cursor-pointer font-medium"
                      >
                        <option value="">Select option</option>
                        {(field.options || '').split(',').map(opt => (
                          <option key={opt.trim()} value={opt.trim()}>{opt.trim()}</option>
                        ))}
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant/50 text-sm group-hover:text-secondary/60 transition-colors">unfold_more</span>
                    </div>
                  ) : field.fieldType === 'BOOLEAN' ? (
                    <label className={`flex items-center justify-between gap-3 cursor-pointer p-3 rounded-xl border-2 transition-all ${customValues[field.id] === 'true' ? 'bg-secondary/5 border-secondary/20' : 'bg-surface-container-low border-transparent hover:border-outline-variant/30'}`}>
                      <div className="flex items-center gap-3">
                         <div className={`w-5 h-5 rounded-md flex items-center justify-center transition-all ${customValues[field.id] === 'true' ? 'bg-secondary text-white' : 'bg-white border-2 border-outline-variant/30'}`}>
                            {customValues[field.id] === 'true' && <span className="material-symbols-outlined text-[14px] font-black">check</span>}
                         </div>
                         <span className="text-[13px] font-bold text-on-surface">Enable Feature</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={customValues[field.id] === 'true'}
                        onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: String(e.target.checked) }))}
                        className="hidden"
                      />
                      <span className={`text-[10px] font-black uppercase tracking-wider ${customValues[field.id] === 'true' ? 'text-secondary' : 'text-on-surface-variant/40'}`}>
                        {customValues[field.id] === 'true' ? 'Active' : 'Off'}
                      </span>
                    </label>
                  ) : (
                    <input
                      type={field.fieldType === 'NUMBER' ? 'number' : field.fieldType === 'DATE' ? 'date' : 'text'}
                      value={customValues[field.id] || ''}
                      onChange={e => setCustomValues(prev => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder={`Enter ${field.label.toLowerCase()}...`}
                      required={field.required}
                      className="w-full bg-surface-container-low rounded-xl py-3 px-4 text-sm border-2 border-transparent outline-none focus:border-secondary/30 focus:bg-white transition-all font-medium placeholder:text-on-surface-variant/30"
                    />
                  )}
                  {field.required && !customValues[field.id] && (
                    <p className="text-[9px] text-error font-bold mt-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="material-symbols-outlined text-[12px]">warning</span>
                      This attribute is mandatory
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-error/5 rounded-xl p-8 border border-error/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <span className="material-symbols-outlined text-8xl text-error">delete_forever</span>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-error flex items-center gap-2 mb-1">
                <span className="material-symbols-outlined text-lg">warning</span>
                Danger Zone
              </h2>
              <p className="text-sm text-on-surface-variant font-medium">
                Deleting this project is irreversible. All tasks, progress, and work logs associated with it will be permanently removed.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsConfirmOpen(true)}
              className="px-8 py-3 bg-white text-error border border-error/20 hover:bg-error hover:text-white font-bold rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              Delete Project
            </button>
          </div>
        </section>

        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href={`/projects/${params.id}`} className="px-8 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-3 rounded-lg font-bold text-sm shadow-[0_4px_14px_rgba(71,68,229,0.39)] hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>

      <ConfirmationModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleDelete}
        title="Delete Project?"
        message={`Are you sure you want to delete "${formData.title}"? This action cannot be undone and will permanently remove all related tasks, activities, and logs.`}
        confirmText="Yes, Delete Project"
        isDanger
        isLoading={isDeleting}
      />
    </div>
  )
}
