'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { useRouter } from 'next/navigation'
import AddTaskModal from '@/components/tasks/AddTaskModal'
import EditTaskModal from '@/components/tasks/EditTaskModal'
import AIAssistantModal from '@/components/tasks/AIAssistantModal'

function timeAgo(dateString: string | Date) {
  const date = new Date(dateString)
  const diff = Date.now() - date.getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return 'Yesterday'
}

type Tab = 'Overview' | 'Tasks' | 'Files' | 'Activity'

export default function ProjectTabsContent({ project, doneTasks }: { project: any, doneTasks: number }) {
  const [activeTab, setActiveTab] = useState<Tab>('Overview')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [teamMembers, setTeamMembers] = useState<any[]>([])
  const router = useRouter()

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      const res = await fetch('/api/team?pageSize=100')
      const data = await res.json()
      if (data.success) {
        setTeamMembers(data.data)
      }
    } catch (err) {
      console.error('Failed to fetch team members:', err)
    }
  }

  const tabs: Tab[] = ['Overview', 'Tasks', 'Files', 'Activity']

  return (
    <div className="col-span-12 lg:col-span-8 space-y-6">
      {/* Tabs list */}
      <div className="flex items-center gap-6 border-b border-outline-variant/10">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-sm pb-3 border-b-2 transition-all ${activeTab === tab ? 'text-primary font-bold border-primary' : 'text-on-surface-variant font-medium border-transparent hover:text-on-surface'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          {/* Progress Card */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Overall Progress</h3>
              <span className="text-2xl font-extrabold text-primary">{project.progress}%</span>
            </div>
            <div className="w-full h-3 bg-surface-container rounded-full overflow-hidden mb-8">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all"
                style={{ width: `${project.progress}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Time Elapsed', value: '142 Days' },
                { label: 'Completed Tasks', value: `${doneTasks} / ${project._count.tasks}` },
                { label: 'Health Score', value: project.progress > 70 ? 'Great' : project.progress > 40 ? 'Good' : 'At Risk', isStatus: true, isGood: project.progress > 50 },
              ].map(item => (
                <div key={item.label} className="p-4 bg-surface-container-low rounded-lg">
                  <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider block mb-1">{item.label}</span>
                  <span className={`text-lg font-bold ${item.isStatus ? (item.isGood ? 'text-green-600' : 'text-error') : 'text-on-surface'}`}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Priority Tasks */}
          <div className="bg-white rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Priority Tasks</h3>
              <button onClick={() => setActiveTab('Tasks')} className="text-sm text-primary font-semibold hover:underline">View All</button>
            </div>
            <div className="space-y-1">
              {project.tasks.length === 0 && (
                <p className="text-sm text-on-surface-variant text-center py-6">No tasks yet</p>
              )}
              {project.tasks.slice(0, 5).map((task: any) => {
                const priorityBg: Record<string, string> = {
                  HIGH: 'bg-error-container text-error',
                  CRITICAL: 'bg-error-container text-error',
                  MEDIUM: 'bg-primary-fixed text-primary',
                  LOW: 'bg-surface-variant text-on-surface-variant',
                }
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-surface-container-low transition-all">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${priorityBg[task.priority] || 'bg-surface-container text-on-surface-variant'}`}>
                        <span className="material-symbols-outlined text-lg">
                          {task.priority === 'HIGH' || task.priority === 'CRITICAL' ? 'warning' : 'task_alt'}
                        </span>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold">{task.title}</h4>
                        <p className="text-xs text-on-surface-variant">
                          {task.dueDate ? `Due ${new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'No due date'}
                          {task.assignee && ` · ${task.assignee.name}`}
                        </p>
                      </div>
                    </div>
                    <PriorityBadge priority={task.priority} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Activity */}
          {project.activities.length > 0 && (
            <div className="bg-white rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <button onClick={() => setActiveTab('Activity')} className="text-sm text-primary font-semibold hover:underline">View All</button>
              </div>
              <div className="space-y-4">
                {project.activities.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="flex gap-3 items-start">
                    <Avatar src={a.user.image} name={a.user.name} size={28} className="flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm"><span className="font-semibold">{a.user.name}</span> {a.action} {a.target && <span className="text-primary">{a.target}</span>}</p>
                      <span className="text-xs text-on-surface-variant">{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {activeTab === 'Tasks' && (
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold">All Tasks</h3>
            <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsAIAssistantOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary font-bold rounded-lg text-xs hover:bg-primary/20 transition-all border border-primary/20"
              >
                <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                AI Assistant
              </button>
              <button 
                onClick={() => setIsAddModalOpen(true)} 
                className="flex items-center gap-2 px-3 py-1.5 bg-primary text-white font-semibold rounded-lg text-xs hover:opacity-90 transition-opacity shadow-sm"
              >
                <span className="material-symbols-outlined text-sm">add</span> New Task
              </button>
            </div>
              <Link href={`/tasks?projectId=${project.id}`} className="flex items-center gap-2 px-3 py-1.5 bg-surface-container text-on-surface-variant font-semibold rounded-lg text-xs hover:bg-surface-container-high transition-colors">
                <span className="material-symbols-outlined text-sm">open_in_new</span> Focus Mode
              </Link>
            </div>
          </div>
          {project.tasks.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-5xl text-outline mb-3">task</span>
              <p className="font-semibold text-on-surface-variant">No tasks found</p>
            </div>
          ) : (
            <div className="divide-y divide-outline-variant/10">
              {project.tasks.map((task: any) => (
                <div key={task.id} onClick={() => setSelectedTask(task)} className="py-4 px-4 -mx-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-container-low/50 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <h4 className="text-sm font-bold text-on-surface mb-1 hover:text-primary transition-colors cursor-pointer">{task.title}</h4>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-on-surface-variant">
                      <PriorityBadge priority={task.priority} />
                      <span className={`px-2 py-0.5 rounded-full font-bold ${task.status === 'DONE' ? 'bg-green-100 text-green-700' : task.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' : 'bg-surface-variant text-on-surface-variant'}`}>{task.status.replace('_', ' ')}</span>
                      {task.dueDate && <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">event</span> {new Date(task.dueDate).toLocaleDateString()}</span>}
                      <div className="flex items-center gap-1 text-on-surface-variant/80">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        <span>{(task.workLogs?.reduce((sum: number, log: any) => sum + log.hours, 0) || 0)} / {(task.estimatedHours || 0)}h</span>
                      </div>
                    </div>
                  </div>
                  {task.assignee && (
                    <div className="flex items-center gap-2">
                      <Avatar src={task.assignee.image} name={task.assignee.name} size={28} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'Files' && (
        <div className="bg-white rounded-xl p-16 flex flex-col items-center justify-center text-center border border-dashed border-outline-variant/40">
          <div className="w-16 h-16 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant mb-4">
            <span className="material-symbols-outlined text-3xl">cloud_upload</span>
          </div>
          <h3 className="text-lg font-bold mb-2">Project Files</h3>
          <p className="text-sm text-on-surface-variant mb-6 max-w-sm">Upload architectural plans, blueprints, and meeting notes. Files module is coming soon in the next update.</p>
          <button className="px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 transition-opacity">
            Upload File
          </button>
        </div>
      )}

      {activeTab === 'Activity' && (
        <div className="bg-white rounded-xl p-6">
          <h3 className="text-lg font-bold mb-6">Full Activity History</h3>
          {project.activities.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-semibold text-on-surface-variant">No activity logged.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="relative border-l-2 border-surface-container ml-3 pl-6 space-y-8">
                {project.activities.map((a: any) => (
                  <div key={a.id} className="relative">
                    <div className="absolute -left-[35px] top-1">
                      <Avatar src={a.user.image} name={a.user.name} size={26} className="border-2 border-white bg-white" />
                    </div>
                    <div>
                      <p className="text-sm text-on-surface-variant">
                        <span className="font-bold text-on-surface">{a.user.name}</span> {a.action} <span className="font-medium text-primary">{a.target || ''}</span>
                      </p>
                      <span className="text-xs text-on-surface-variant font-medium mt-1 inline-block">{timeAgo(a.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <AddTaskModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          setIsAddModalOpen(false)
          router.refresh()
        }}
        defaultProjectId={project.id}
      />
      
      <EditTaskModal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSuccess={() => { setSelectedTask(null); router.refresh(); }}
        task={selectedTask}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        onSuccess={() => { setIsAIAssistantOpen(false); router.refresh(); }}
        projectId={project.id}
        teamMembers={teamMembers}
      />
    </div>
  )
}
