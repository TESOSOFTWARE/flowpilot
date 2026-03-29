'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import toast from 'react-hot-toast'

interface Project {
  id: string
  title: string
  description: string | null
  status: string
  priority: string
  progress: number
  budget: number | null
  category: string | null
  deadline: string | null
  startDate: string | null
  estimatedHours: number | null
  totalLoggedHours: number
  manager: { id: string; name: string | null; image: string | null } | null
  tasks: { id: string; status: string }[]
}

type ViewMode = 'table' | 'grid'
type TabFilter = 'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'ARCHIVED'

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [tab, setTab] = useState<TabFilter>('ALL')
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [managerFilter, setManagerFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [team, setTeam] = useState<any[]>([])
  const pageSize = 10

  useEffect(() => {
    fetch('/api/team').then(r => r.json()).then(data => {
      if (data.success) setTeam(data.data.map((m: any) => m.user))
    })
  }, [])

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(tab !== 'ALL' && { status: tab }),
        ...(managerFilter !== 'ALL' && { managerId: managerFilter }),
        ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
        ...(search && { search }),
      })
      const res = await fetch(`/api/projects?${params}`)
      const data = await res.json()
      if (data.success) {
        setProjects(data.data)
        setTotal(data.pagination.total)
      }
    } catch { toast.error('Failed to load projects') }
    finally { setLoading(false) }
  }, [page, tab, search, managerFilter, priorityFilter])

  useEffect(() => { fetchProjects() }, [fetchProjects])

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        export: 'true',
        ...(tab !== 'ALL' && { status: tab }),
        ...(managerFilter !== 'ALL' && { managerId: managerFilter }),
        ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
        ...(search && { search }),
      })
      const res = await fetch(`/api/projects?${params}`)
      const data = await res.json()
      if (data.success) {
        const projects = data.data
        const csvRows = []
        csvRows.push(['ID', 'Title', 'Status', 'Priority', 'Progress', 'Manager', 'Tasks Count'].join(','))
        for (const p of projects) {
          csvRows.push([
            p.id,
            `"${p.title.replace(/"/g, '""')}"`,
            p.status,
            p.priority,
            `${p.progress}%`,
            p.manager?.name || 'Unassigned',
            p.tasks?.length || 0
          ].join(','))
        }
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `flowpilot_projects_${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        toast.success('Projects exported successfully')
      } else {
        toast.error('Failed to export projects')
      }
    } catch {
      toast.error('An error occurred while exporting')
    }
  }

  const stats = {
    active: projects.filter(p => p.status === 'ACTIVE').length,
    pending: projects.filter(p => p.status === 'PENDING').length,
    completed: projects.filter(p => p.status === 'COMPLETED').length,
  }

  const tabs: { label: string; value: TabFilter }[] = [
    { label: 'All Projects', value: 'ALL' },
    { label: 'Active', value: 'ACTIVE' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Archived', value: 'ARCHIVED' },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Active Portfolio</h1>
          <p className="text-on-surface-variant mt-1">Managing {total} ongoing construction and design projects.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 font-semibold rounded-lg text-sm transition-colors ${showFilters ? 'bg-primary/10 text-primary hover:bg-primary/20' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}
          >
            <span className="material-symbols-outlined text-lg">filter_list</span> Filters
          </button>
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-container text-on-surface-variant font-semibold rounded-lg text-sm hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-lg">file_download</span> Export
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded-xl shadow-sm border border-outline-variant/10">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1) }}
                className="w-full bg-surface-container-low rounded-lg py-2 pl-10 pr-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/20 text-on-surface"
              />
            </div>
          </div>
          
          <select 
            value={managerFilter} 
            onChange={e => {setManagerFilter(e.target.value); setPage(1)}} 
            className="bg-surface-container-low rounded-lg text-sm px-3 py-2 cursor-pointer font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 border-none outline-none"
          >
            <option value="ALL">All Managers</option>
            {team.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
          </select>

          <select 
            value={priorityFilter} 
            onChange={e => {setPriorityFilter(e.target.value); setPage(1)}} 
            className="bg-surface-container-low rounded-lg text-sm px-3 py-2 cursor-pointer font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20 border-none outline-none"
          >
            <option value="ALL">Any Priority</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      )}

      {/* Stats Bento */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Active', value: stats.active, icon: 'bolt', color: 'text-primary bg-primary/10', sub: '+2 this week', subColor: 'text-green-600' },
          { label: 'Pending Approval', value: stats.pending, icon: 'hourglass_empty', color: 'text-secondary bg-secondary/10', sub: 'Across teams', subColor: 'text-on-surface-variant' },
          { label: 'Completed', value: stats.completed, icon: 'check_circle', color: 'text-green-600 bg-green-100', sub: '98% on-time', subColor: 'text-on-surface-variant' },
          { label: 'Budget Utilization', value: '72%', icon: 'payments', color: 'text-orange-600 bg-orange-100', sub: 'Over budget (2)', subColor: 'text-orange-600' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{s.label}</span>
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold">{s.value}</span>
              <span className={`text-xs font-bold ${s.subColor}`}>{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Table / Grid Container */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Tab Bar */}
        <div className="px-6 py-0 border-b border-outline-variant/10 flex items-center justify-between">
          <div className="flex gap-6">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => { setTab(t.value); setPage(1) }}
                className={`text-sm py-4 border-b-2 transition-all ${
                  tab === t.value
                    ? 'text-primary font-bold border-primary'
                    : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          {/* View toggle */}
          <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-lg">table_rows</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant'}`}
            >
              <span className="material-symbols-outlined text-lg">grid_view</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
            <p className="mt-2 text-sm">Loading projects...</p>
          </div>
        ) : viewMode === 'table' ? (
          <ProjectTable projects={projects} />
        ) : (
          <ProjectGrid projects={projects} />
        )}

        {/* Pagination */}
        <div className="px-6 py-4 bg-white border-t border-outline-variant/5 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Showing {(page-1)*pageSize+1}–{Math.min(page*pageSize, total)} of {total} results</p>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(1, p-1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            {Array.from({ length: Math.ceil(total/pageSize) }, (_, i) => i+1).slice(0, 5).map(p => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${
                  p === page ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage(p => p+1)}
              disabled={page >= Math.ceil(total/pageSize)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProjectTable({ projects }: { projects: Project[] }) {
  if (projects.length === 0) return (
    <div className="p-16 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-5xl text-outline mb-3">folder_off</span>
      <p className="font-semibold">No projects found</p>
      <p className="text-sm mt-1">Create your first project to get started</p>
      <Link href="/projects/new" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90">
        <span className="material-symbols-outlined text-lg">add</span> New Project
      </Link>
    </div>
  )
  return (
    <table className="w-full text-left border-collapse">
      <thead>
        <tr className="text-on-surface-variant text-xs font-bold uppercase tracking-widest border-b border-outline-variant/10">
          <th className="px-6 py-4">Project Title</th>
          <th className="px-6 py-4">Manager</th>
          <th className="px-6 py-4">Status</th>
          <th className="px-6 py-4">Timeline</th>
          <th className="px-6 py-4">Effort</th>
          <th className="px-6 py-4 text-right">Action</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-outline-variant/5">
        {projects.map(p => (
          <tr key={p.id} className="group hover:bg-surface-container-low transition-all cursor-pointer">
            <td className="px-6 py-4">
              <Link href={`/projects/${p.id}`} className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                </div>
                <div>
                  <p className="font-bold text-on-surface hover:text-primary transition-colors">{p.title}</p>
                  <p className="text-xs text-on-surface-variant">{p.category || 'General'} · ID: {p.id.slice(0,6).toUpperCase()}</p>
                </div>
              </Link>
            </td>
            <td className="px-6 py-4">
              {p.manager ? (
                <div className="flex items-center gap-2">
                  <Avatar src={p.manager.image} name={p.manager.name} size={24} />
                  <span className="text-sm font-medium text-on-surface">{p.manager.name}</span>
                </div>
              ) : <span className="text-sm text-on-surface-variant">Unassigned</span>}
            </td>
            <td className="px-6 py-4"><StatusBadge status={p.status} /></td>
            <td className="px-6 py-4">
              <div className="w-32">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Tasks</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>
            </td>
            <td className="px-6 py-4">
              <div className="w-32">
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase">Effort</span>
                  <span className="text-[10px] font-bold text-on-surface-variant">{p.totalLoggedHours}h / {p.estimatedHours || 0}h</span>
                </div>
                <ProgressBar 
                  value={p.estimatedHours ? Math.min(100, (p.totalLoggedHours / p.estimatedHours) * 100) : 0} 
                  color={p.estimatedHours && p.totalLoggedHours > p.estimatedHours ? 'error' : 'primary'}
                />
              </div>
            </td>
            <td className="px-6 py-4 text-right">
              <Link href={`/projects/${p.id}`} className="p-2 text-on-surface-variant opacity-0 group-hover:opacity-100 hover:text-primary transition-all inline-flex">
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {projects.map(p => (
        <Link key={p.id} href={`/projects/${p.id}`}>
          <div className="bg-surface-container-low rounded-xl p-6 hover:bg-surface-container transition-all cursor-pointer h-full border border-outline-variant/5">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
              </div>
              <StatusBadge status={p.status} />
            </div>
            <h3 className="text-base font-bold text-on-surface mb-1 hover:text-primary">{p.title}</h3>
            <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{p.description || 'No description'}</p>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between mb-1 text-[10px] font-bold text-on-surface-variant uppercase">
                  <span>Task Progress</span>
                  <span>{p.progress}%</span>
                </div>
                <ProgressBar value={p.progress} />
              </div>
              <div>
                <div className="flex justify-between mb-1 text-[10px] font-bold text-on-surface-variant uppercase">
                  <span>Effort ({p.totalLoggedHours}h / {p.estimatedHours || 0}h)</span>
                  <span>{p.estimatedHours ? Math.round((p.totalLoggedHours / p.estimatedHours) * 100) : 0}%</span>
                </div>
                <ProgressBar 
                  value={p.estimatedHours ? Math.min(100, (p.totalLoggedHours / p.estimatedHours) * 100) : 0}
                  color={p.estimatedHours && p.totalLoggedHours > p.estimatedHours ? 'error' : 'primary'}
                />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-outline-variant/10">
              <div className="flex items-center gap-2">
                <Avatar src={p.manager?.image} name={p.manager?.name} size={22} />
                <span className="text-xs font-semibold">{p.manager?.name || 'Unassigned'}</span>
              </div>
              <span className="text-xs text-on-surface-variant">{p.tasks.length} tasks</span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}
