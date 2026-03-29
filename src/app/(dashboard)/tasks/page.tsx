'use client'

import { useState, useEffect, useCallback } from 'react'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import AddTaskModal from '@/components/tasks/AddTaskModal'
import EditTaskModal from '@/components/tasks/EditTaskModal'
import TaskKanbanBoard from '@/components/tasks/TaskKanbanBoard'

interface Task {
  id: string
  title: string
  status: string
  priority: string
  dueDate: string | null
  project: { id: string; title: string; category: string | null }
  assignee: { id: string; name: string | null; image: string | null } | null
  estimatedHours: number | null
  loggedEffort: number
}

type StatusFilter = 'ALL' | 'TODO' | 'IN_PROGRESS' | 'DONE' | 'BLOCKED'

function isOverdue(dueDate: string | null) {
  if (!dueDate) return false
  return new Date(dueDate) < new Date()
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ALL')
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('kanban')
  const pageSize = viewMode === 'kanban' ? 50 : 10
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  
  const [projectFilter, setProjectFilter] = useState<string>('ALL')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('ALL')
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL')

  const [projects, setProjects] = useState<any[]>([])
  const [team, setTeam] = useState<any[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/team').then(r => r.json())
    ]).then(([projData, teamData]) => {
      if (projData.success) setProjects(projData.data)
      if (teamData.success) setTeam(teamData.data.map((m: any) => m.user).filter(Boolean))
    })
  }, [])

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(projectFilter !== 'ALL' && { projectId: projectFilter }),
        ...(assigneeFilter !== 'ALL' && { assigneeId: assigneeFilter }),
        ...(priorityFilter !== 'ALL' && { priority: priorityFilter }),
      })
      const res = await fetch(`/api/tasks?${params}`)
      const data = await res.json()
      if (data.success) {
        setTasks(data.data)
        setTotal(data.pagination.total)
      }
    } catch { toast.error('Failed to load tasks') }
    finally { setLoading(false) }
  }, [page, statusFilter, viewMode, projectFilter, assigneeFilter, priorityFilter])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function updateTaskStatus(taskId: string, status: string) {
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setTasks(t => t.map(task => task.id === taskId ? { ...task, status } : task))
        toast.success('Task updated')
      } else {
        toast.error(data.error || 'Failed to update task')
      }
    } catch { toast.error('An unexpected error occurred') }
  }

  const todoCount = tasks.filter(t => t.status === 'TODO').length
  const inProgressCount = tasks.filter(t => t.status === 'IN_PROGRESS').length
  const doneCount = tasks.filter(t => t.status === 'DONE').length
  const overdueCount = tasks.filter(t => isOverdue(t.dueDate) && t.status !== 'DONE').length

  const tabs: { label: string; value: StatusFilter; count?: number }[] = [
    { label: 'All Tasks', value: 'ALL', count: total },
    { label: 'To Do', value: 'TODO', count: todoCount },
    { label: 'In Progress', value: 'IN_PROGRESS', count: inProgressCount },
    { label: 'Done', value: 'DONE', count: doneCount },
    { label: 'Blocked', value: 'BLOCKED' },
  ]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">My Tasks</h1>
          <p className="text-on-surface-variant mt-1">Track and manage your assigned tasks across all projects.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-lg hover:opacity-90 shadow-sm transition-opacity"
        >
          <span className="material-symbols-outlined text-lg">add</span> New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <select value={projectFilter} onChange={e => {setProjectFilter(e.target.value); setPage(1)}} className="bg-white border-outline-variant/20 rounded-lg text-sm px-3 py-2 cursor-pointer font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20">
          <option value="ALL">All Projects</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
        </select>
        
        <select value={assigneeFilter} onChange={e => {setAssigneeFilter(e.target.value); setPage(1)}} className="bg-white border-outline-variant/20 rounded-lg text-sm px-3 py-2 cursor-pointer font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20">
          <option value="ALL">All Assignees</option>
          {team.map(u => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
        </select>

        <select value={priorityFilter} onChange={e => {setPriorityFilter(e.target.value); setPage(1)}} className="bg-white border-outline-variant/20 rounded-lg text-sm px-3 py-2 cursor-pointer font-medium text-on-surface-variant focus:ring-2 focus:ring-primary/20">
          <option value="ALL">Any Priority</option>
          <option value="CRITICAL">Critical</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'To Do', value: todoCount, icon: 'edit_note', color: 'bg-primary/10 text-primary', sub: 'Pending action' },
          { label: 'In Progress', value: inProgressCount, icon: 'autorenew', color: 'bg-secondary/10 text-secondary', sub: 'Currently active' },
          { label: 'Completed', value: doneCount, icon: 'task_alt', color: 'bg-green-100 text-green-600', sub: 'This sprint' },
          { label: 'Overdue', value: overdueCount, icon: 'alarm', color: 'bg-error-container text-error', sub: overdueCount > 0 ? 'Needs attention' : 'All on track' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-xl p-6 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${card.color}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{card.label}</p>
              <p className="text-2xl font-extrabold">{card.value}</p>
              <p className="text-xs text-on-surface-variant">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Task Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Tab bar */}
        <div className="px-6 flex items-center justify-between border-b border-outline-variant/10">
          <div className="flex items-center">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => { setStatusFilter(t.value); setPage(1) }}
                className={`px-4 py-4 text-sm flex items-center gap-2 border-b-2 transition-all ${
                  statusFilter === t.value ? 'text-primary font-bold border-primary' : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'
                }`}
              >
                {t.label}
                {t.count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${statusFilter === t.value ? 'bg-primary text-white' : 'bg-surface-container-high text-on-surface-variant'}`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 bg-surface-container-low rounded-lg p-1 mr-4 my-2">
            <button
              onClick={() => { setViewMode('table'); setPage(1) }}
              className={`p-1.5 rounded transition-all ${viewMode === 'table' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-lg">table_rows</span>
            </button>
            <button
              onClick={() => { setViewMode('kanban'); setPage(1) }}
              className={`p-1.5 rounded transition-all ${viewMode === 'kanban' ? 'bg-white shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}
            >
              <span className="material-symbols-outlined text-lg">view_kanban</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
            <p className="text-sm mt-2">Loading tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div className="p-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-outline">task_alt</span>
            <p className="font-semibold mt-2">No tasks found</p>
            <p className="text-sm mt-1">You&apos;re all caught up!</p>
          </div>
        ) : viewMode === 'kanban' ? (
          <div className="bg-surface-container-lowest p-6 rounded-b-xl">
            <TaskKanbanBoard tasks={tasks} onUpdateStatus={updateTaskStatus} onTaskClick={setSelectedTask} />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="text-on-surface-variant text-xs font-bold uppercase tracking-widest border-b border-outline-variant/10 bg-surface-container-low">
                <th className="px-6 py-4">Task</th>
                <th className="px-6 py-4">Project</th>
                <th className="px-6 py-4">Priority</th>
                <th className="px-6 py-4">Due Date</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {tasks.map(task => (
                <tr key={task.id} onClick={(e) => { 
                  if (!(e.target as HTMLElement).closest('button') && (e.target as HTMLElement).tagName !== 'INPUT') {
                    setSelectedTask(task)
                  }
                }} className="group hover:bg-surface-container-low/50 transition-all cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={task.status === 'DONE'}
                        onChange={() => updateTaskStatus(task.id, task.status === 'DONE' ? 'TODO' : 'DONE')}
                        className="w-4 h-4 rounded border-outline-variant accent-primary cursor-pointer"
                      />
                      <div>
                        <p className={`text-sm font-bold ${task.status === 'DONE' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>{task.title}</p>
                        {isOverdue(task.dueDate) && task.status !== 'DONE' && (
                          <span className="text-[10px] font-bold text-error uppercase">Overdue</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-on-surface-variant px-2 py-1 bg-surface-container rounded-full">
                      {task.project.title}
                    </span>
                  </td>
                  <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                  <td className="px-6 py-4">
                    {task.dueDate ? (
                      <span className={`text-sm font-medium ${isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-error font-bold' : 'text-on-surface-variant'}`}>
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                    ) : <span className="text-on-surface-variant text-sm">—</span>}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {task.status !== 'IN_PROGRESS' && task.status !== 'DONE' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all text-xs font-bold"
                        >
                          Start
                        </button>
                      )}
                      {task.status !== 'DONE' && (
                        <button
                          onClick={() => updateTaskStatus(task.id, 'DONE')}
                          className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all text-xs font-bold"
                        >
                          Done
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-outline-variant/5 flex items-center justify-between">
          <p className="text-xs text-on-surface-variant">Showing {Math.min((page-1)*pageSize+1, total)}–{Math.min(page*pageSize, total)} of {total}</p>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="p-1.5 rounded hover:bg-surface-container disabled:opacity-40">
              <span className="material-symbols-outlined text-sm">chevron_left</span>
            </button>
            <button onClick={() => setPage(p => p+1)} disabled={page >= Math.ceil(total/pageSize)} className="p-1.5 rounded hover:bg-surface-container disabled:opacity-40">
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        </div>
      </div>

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchTasks}
      />
      
      <EditTaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => { setSelectedTask(null); fetchTasks(); }}
        task={selectedTask}
      />
    </div>
  )
}
