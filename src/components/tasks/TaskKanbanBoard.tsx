'use client'

import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/Badge'

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

interface TaskKanbanBoardProps {
  tasks: Task[]
  onUpdateStatus: (taskId: string, newStatus: string) => Promise<void>
  onTaskClick?: (task: Task) => void
}

const COLUMNS = [
  { id: 'TODO', label: 'To Do', color: 'bg-surface-variant/50 border-outline-variant/20' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'bg-secondary/5 border-secondary/20' },
  { id: 'DONE', label: 'Done', color: 'bg-green-50/50 border-green-200' },
  { id: 'BLOCKED', label: 'Blocked', color: 'bg-error-container/20 border-error/20' },
]

export default function TaskKanbanBoard({ tasks, onUpdateStatus, onTaskClick }: TaskKanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null)
  const [dragOverColId, setDragOverColId] = useState<string | null>(null)

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId)
    setDraggedTaskId(taskId)
  }

  const handleDragOver = (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverColId(colId)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOverColId(null)
  }

  const handleDrop = async (e: React.DragEvent, colId: string) => {
    e.preventDefault()
    setDragOverColId(null)
    setDraggedTaskId(null)
    const taskId = e.dataTransfer.getData('taskId')
    if (taskId) {
      const task = tasks.find(t => t.id === taskId)
      if (task && task.status !== colId) {
        await onUpdateStatus(taskId, colId)
      }
    }
  }

  function isOverdue(dueDate: string | null) {
    if (!dueDate) return false
    return new Date(dueDate) < new Date()
  }

  return (
    <div className="flex gap-6 overflow-x-auto pb-6 pt-2 items-start h-[calc(100vh-320px)] min-h-[500px]">
      {COLUMNS.map(col => {
        const columnTasks = tasks.filter(t => t.status === col.id)
        return (
          <div
            key={col.id}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            className={`flex-shrink-0 w-[320px] flex flex-col rounded-xl border ${col.color} ${dragOverColId === col.id ? 'ring-2 ring-primary ring-offset-2' : ''} transition-all h-full bg-white`}
          >
            {/* Column Header */}
            <div className="p-4 border-b border-inherit flex items-center justify-between bg-white/50 rounded-t-xl">
              <h3 className="font-bold text-on-surface flex items-center gap-2">
                {col.label} 
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant">
                  {columnTasks.length}
                </span>
              </h3>
            </div>

            {/* Column Body */}
            <div className="p-3 flex-1 overflow-y-auto space-y-3">
              {columnTasks.length === 0 && (
                <div className="h-24 border-2 border-dashed border-outline-variant/20 rounded-lg flex items-center justify-center text-xs font-semibold text-on-surface-variant">
                  Drop tasks here
                </div>
              )}
              {columnTasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onClick={() => onTaskClick?.(task)}
                  onDragStart={(e) => handleDragStart(e, task.id)}
                  onDragEnd={() => setDraggedTaskId(null)}
                  className={`bg-white border ${draggedTaskId === task.id ? 'border-primary shadow-lg scale-[1.02] opacity-50' : 'border-outline-variant/20 shadow-sm'} rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-outline-variant/50 transition-all`}
                >
                  <div className="flex justify-between items-start mb-2 gap-2">
                    <span className="text-[10px] uppercase font-extrabold tracking-wider text-on-surface-variant truncate">
                      {task.project.title}
                    </span>
                    <PriorityBadge priority={task.priority} />
                  </div>
                  
                  <h4 className={`text-sm font-bold leading-snug mb-3 ${task.status === 'DONE' ? 'line-through text-on-surface-variant' : 'text-on-surface'}`}>
                    {task.title}
                  </h4>
                  
                    <div className="flex items-center justify-between mt-auto gap-2 pt-2">
                      <div className="flex -space-x-1 overflow-hidden shrink-0">
                        {task.assignee ? (
                          <Avatar src={task.assignee.image} name={task.assignee.name} size={24} />
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-dashed border-outline-variant/40 flex items-center justify-center bg-surface-container-lowest">
                            <span className="material-symbols-outlined text-[12px] text-on-surface-variant">person_add</span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        {task.dueDate && (
                          <span className={`text-[10px] font-bold flex items-center gap-1 shrink-0 ${isOverdue(task.dueDate) && task.status !== 'DONE' ? 'text-error' : 'text-on-surface-variant'}`}>
                            <span className="material-symbols-outlined text-[10px]">schedule</span>
                            {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </span>
                        )}

                        {(task.estimatedHours !== null || task.loggedEffort > 0) && (
                          <div className="flex items-center gap-1 text-on-surface-variant/80 shrink-0">
                            <span className="material-symbols-outlined text-[10px]">timer</span>
                            <span className="text-[10px] font-bold">
                              {task.loggedEffort || 0} / {task.estimatedHours ?? 0}h
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
