'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

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
    siteLocation: '',
    groundbreaking: '',
    sustainabilityTier: 'LEED Gold',
  })

  const fetchProjectData = useCallback(async () => {
    try {
      const [teamRes, projRes] = await Promise.all([
        fetch('/api/team'),
        fetch(`/api/projects/${params.id}`)
      ])
      
      const teamData = await teamRes.json()
      if (teamData.success) {
        setManagers(teamData.data.map((m: any) => m.user))
      }

      const projData = await projRes.json()
      if (projData.success) {
        const p = projData.data
        
        let siteLocation = ''
        let groundbreaking = ''
        let sustainabilityTier = 'LEED Gold'
        
        for (const cv of p.customValues) {
          if (cv.customField.name === 'siteLocation') siteLocation = cv.value
          if (cv.customField.name === 'groundbreaking') groundbreaking = cv.value
          if (cv.customField.name === 'sustainabilityTier') sustainabilityTier = cv.value
        }
        
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
          siteLocation,
          groundbreaking,
          sustainabilityTier,
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

        {/* Custom Attributes - Read only for now or missing API save */}
        <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10 opacity-70">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">tune</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Custom Attributes</h2>
                <p className="text-xs text-on-surface-variant mt-1">Editing custom values via API requires advanced schema support</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-lg border border-outline-variant/20">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Site Location</label>
              <input readOnly type="text" value={formData.siteLocation} className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm border-none outline-none text-on-surface-variant" />
            </div>
            <div className="bg-white p-5 rounded-lg border border-outline-variant/20">
              <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider block mb-2">Groundbreaking</label>
              <input readOnly type="text" value={formData.groundbreaking} className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm border-none outline-none text-on-surface-variant" />
            </div>
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
    </div>
  )
}
