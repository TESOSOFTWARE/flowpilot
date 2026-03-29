'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string | null
  email: string
}

export default function NewProjectPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
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
    siteLocation: '',
    groundbreaking: '',
    sustainabilityTier: 'LEED Gold',
  })

  useEffect(() => {
    fetch('/api/team')
      .then(r => r.json())
      .then(d => { if (d.success) setManagers(d.data.map((m: any) => m.user)) })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          managerId: formData.managerId || undefined,
          status: formData.status,
          priority: formData.priority,
          budget: formData.budget || undefined,
          deadline: formData.deadline || undefined,
          category: formData.category,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Project created successfully!')
        router.push('/projects')
      } else {
        toast.error(data.error || 'Failed to create project')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  const update = (key: string, value: string) => setFormData(f => ({ ...f, [key]: value }))

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-2">
        <Link href="/projects" className="hover:text-primary transition-colors">Projects</Link>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-medium text-on-surface">New Project</span>
      </nav>
      <h1 className="text-3xl font-extrabold tracking-tight text-on-surface mb-1">Initialize New Project</h1>
      <p className="text-on-surface-variant text-lg mb-8">Define the scope, leadership, and attributes for your new workspace.</p>

      <form onSubmit={handleSubmit} className="space-y-8 pb-20">
        {/* Core Details */}
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
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Deadline</label>
              <input
                type="date"
                value={formData.deadline}
                onChange={e => update('deadline', e.target.value)}
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
        <section className="bg-surface-container-low rounded-xl p-8 border border-outline-variant/10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-secondary/10 text-secondary flex items-center justify-center">
                <span className="material-symbols-outlined text-sm">tune</span>
              </div>
              <div>
                <h2 className="text-xl font-bold">Custom Attributes</h2>
                <p className="text-xs text-on-surface-variant mt-1">Admin defined dynamic fields</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Site Location */}
            <div className="bg-white p-5 rounded-lg border border-outline-variant/20">
              <div className="flex justify-between items-start mb-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Site Location</label>
                <span className="px-2 py-0.5 rounded text-[10px] bg-secondary/10 text-secondary font-bold">TEXT</span>
              </div>
              <input
                type="text"
                value={formData.siteLocation}
                onChange={e => update('siteLocation', e.target.value)}
                placeholder="GPS or Address"
                className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-secondary/40"
              />
            </div>
            {/* Groundbreaking */}
            <div className="bg-white p-5 rounded-lg border border-outline-variant/20">
              <div className="flex justify-between items-start mb-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Groundbreaking</label>
                <span className="px-2 py-0.5 rounded text-[10px] bg-secondary/10 text-secondary font-bold">DATE</span>
              </div>
              <input
                type="date"
                value={formData.groundbreaking}
                onChange={e => update('groundbreaking', e.target.value)}
                className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm border-none outline-none focus:ring-1 focus:ring-secondary/40"
              />
            </div>
            {/* Sustainability Tier */}
            <div className="bg-white p-5 rounded-lg border border-outline-variant/20">
              <div className="flex justify-between items-start mb-3">
                <label className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">Sustainability Tier</label>
                <span className="px-2 py-0.5 rounded text-[10px] bg-secondary/10 text-secondary font-bold">ENUM</span>
              </div>
              <select
                value={formData.sustainabilityTier}
                onChange={e => update('sustainabilityTier', e.target.value)}
                className="w-full bg-surface-container-low rounded-lg py-2 px-3 text-sm border-none outline-none appearance-none"
              >
                <option>LEED Platinum</option>
                <option>LEED Gold</option>
                <option>Zero Carbon</option>
                <option>Standard</option>
              </select>
            </div>
            {/* Add New Attribute */}
            <button
              type="button"
              className="border-2 border-dashed border-outline-variant/40 rounded-lg flex flex-col items-center justify-center p-5 group hover:border-secondary hover:bg-secondary/5 cursor-pointer transition-all"
            >
              <span className="material-symbols-outlined text-outline-variant group-hover:text-secondary transition-colors">add_circle</span>
              <span className="text-xs font-bold text-on-surface-variant mt-2">Add New Attribute</span>
            </button>
          </div>
        </section>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4 pt-2">
          <Link href="/projects" className="px-8 py-3 text-sm font-bold text-on-surface-variant hover:bg-surface-container-high rounded-lg transition-all">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-gradient-to-br from-primary to-primary-container text-white px-10 py-3 rounded-lg font-bold text-sm shadow-[0_4px_14px_rgba(71,68,229,0.39)] hover:opacity-90 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Creating...' : 'Create Project'}
          </button>
        </div>
      </form>
    </div>
  )
}
