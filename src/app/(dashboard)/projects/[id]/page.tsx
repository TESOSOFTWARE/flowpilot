import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { ProgressBar } from '@/components/ui/ProgressBar'
import ProjectTabsContent from '@/components/projects/ProjectTabsContent'
import ShareButton from '@/components/projects/ShareButton'

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return 'Yesterday'
}

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId

  const project = await prisma.project.findFirst({
    where: { id: params.id, organizationId: orgId },
    include: {
      manager: { select: { id: true, name: true, image: true, email: true } },
      tasks: {
        include: {
          assignee: true,
          workLogs: true,
        },
        orderBy: [{ priority: 'asc' }, { dueDate: 'asc' }],
      },
      activities: {
        include: { user: { select: { id: true, name: true, image: true } } },
        orderBy: { createdAt: 'desc' },
        take: 50,
      },
      customValues: { include: { customField: true } },
      _count: { select: { tasks: true } },
    } as any,
  })

  if (!(project as any)) notFound()

  const doneTasks = (project as any).tasks.filter((t: any) => t.status === 'DONE').length
  const buddgetFormatted = (project as any).budget
    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format((project as any).budget)
    : 'N/A'

  const priorityColors: Record<string, string> = {
    HIGH: 'text-error',
    CRITICAL: 'text-error',
    MEDIUM: 'text-primary',
    LOW: 'text-on-surface-variant',
  }

  return (
    <div className="p-8">
      {/* Breadcrumb + Hero */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-4">
          <Link href="/projects" className="hover:text-primary">Projects</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="font-medium text-on-surface">{(project as any).title}</span>
        </nav>
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight">{(project as any).title}</h1>
              <StatusBadge status={(project as any).status} />
            </div>
            <p className="text-on-surface-variant max-w-2xl leading-relaxed">{(project as any).description || 'No description provided.'}</p>
          </div>
          <div className="flex items-center gap-3">
            <ShareButton 
              projectId={(project as any).id} 
              className="flex items-center gap-2 px-4 py-2 bg-surface-container text-primary font-semibold rounded-lg hover:bg-surface-container-high transition-all"
            />
            <Link href={`/projects/${(project as any).id}/edit`} className="flex items-center gap-2 px-6 py-2 bg-gradient-to-br from-primary to-primary-container text-white font-semibold rounded-lg hover:opacity-90 transition-all">
              <span className="material-symbols-outlined text-lg">edit</span> Manage Project
            </Link>
          </div>
        </div>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-12 gap-6">
        {/* Main Content (8 cols) */}
        <ProjectTabsContent project={project} doneTasks={doneTasks} />

        {/* Sidebar (4 cols) */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          {/* Project Details Card */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-6">Project Details</h3>
            <div className="space-y-6">
              {(project as any).manager && (
                <div>
                  <label className="text-xs font-semibold text-on-surface-variant block mb-3 uppercase tracking-wider">Project Manager</label>
                  <div className="flex items-center gap-4 bg-surface-container-low p-3 rounded-xl border border-outline-variant/10 min-w-0">
                    <Avatar src={(project as any).manager.image} name={(project as any).manager.name} size={44} className="flex-shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-bold block truncate">{(project as any).manager.name}</span>
                      <span className="text-xs text-on-surface-variant block truncate">{(project as any).manager.email}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-x-8 gap-y-5 pt-2">
                <div className="min-w-0">
                  <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5 uppercase tracking-widest">Budget</label>
                  <span className="text-sm font-extrabold text-on-surface">{buddgetFormatted}</span>
                </div>
                <div className="min-w-0">
                  <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5 uppercase tracking-widest">Priority</label>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${(project as any).priority === 'CRITICAL' || (project as any).priority === 'HIGH' ? 'bg-error' : (project as any).priority === 'MEDIUM' ? 'bg-primary' : 'bg-on-surface-variant'}`} />
                    <span className="text-sm font-extrabold text-on-surface capitalize">{(project as any).priority.toLowerCase()}</span>
                  </div>
                </div>
                <div className="col-span-2 min-w-0">
                  <label className="text-[10px] font-bold text-on-surface-variant block mb-1.5 uppercase tracking-widest">Category</label>
                  <span className="text-sm font-extrabold text-on-surface">{(project as any).category || 'General'}</span>
                </div>
              </div>
              {/* Timeline */}
              {((project as any).startDate || (project as any).deadline) && (
                <div className="pt-4 border-t border-outline-variant/10">
                  <label className="text-xs font-semibold text-on-surface-variant block mb-3">Timeline</label>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">calendar_today</span>
                      <span className="text-on-surface-variant">Start</span>
                      <span className="font-bold">{(project as any).startDate ? new Date((project as any).startDate).toLocaleDateString() : 'TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="material-symbols-outlined text-sm text-on-surface-variant">event</span>
                      <span className="text-on-surface-variant">Deadline</span>
                      <span className="font-bold">{(project as any).deadline ? new Date((project as any).deadline).toLocaleDateString() : 'TBD'}</span>
                    </div>
                  </div>
                </div>
              )}
              {/* Custom Values */}
              {((project as any).customValues || []).length > 0 && (
                <div className="pt-4 border-t border-outline-variant/10">
                  <label className="text-[10px] font-bold text-on-surface-variant block mb-3 uppercase tracking-widest">Custom Attributes</label>
                  <div className="space-y-3">
                    {(project as any).customValues.map((cv: any) => (
                      <div key={cv.id} className="flex items-center justify-between group/attr py-1">
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-secondary/30 group-hover/attr:bg-secondary transition-colors" />
                          <span className="text-xs text-on-surface-variant font-medium">{cv.customField.label}</span>
                        </div>
                        <span className="text-xs font-bold bg-surface-container-high px-2 py-0.5 rounded text-on-surface group-hover/attr:bg-secondary/5 group-hover/attr:text-secondary transition-all">
                          {cv.customField.fieldType === 'BOOLEAN' 
                            ? (cv.value === 'true' ? 'Yes' : 'No') 
                            : (cv.customField.fieldType === 'DATE' && cv.value)
                              ? new Date(cv.value).toLocaleDateString()
                              : cv.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl p-6">
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-widest mb-4">Quick Stats</h3>
            <div className="space-y-3">
              {[
                { label: 'Total Tasks', value: (project as any)._count.tasks },
                { label: 'Completed', value: (project as any).tasks.filter((t: any) => t.status === 'DONE').length },
                { label: 'Total Effort', value: `${(project as any).tasks.reduce((sum: number, t: any) => sum + (t.workLogs?.reduce((tsum: number, l: any) => tsum + l.hours, 0) || 0), 0)}h` },
                { label: 'Estimated', value: `${(project as any).estimatedHours || 0}h` },
              ].map(s => (
                <div key={s.label} className="flex justify-between items-center">
                  <span className="text-sm text-on-surface-variant">{s.label}</span>
                  <span className="text-sm font-bold">{s.value}</span>
                </div>
              ))}
              <div className="mt-4 space-y-3">
                <div>
                  <div className="flex justify-between mb-1 text-[10px] font-bold text-on-surface-variant uppercase">
                    <span>Task Progress</span>
                    <span>{(project as any).progress}%</span>
                  </div>
                  <ProgressBar value={(project as any).progress} />
                </div>
                <div>
                  <div className="flex justify-between mb-1 text-[10px] font-bold text-on-surface-variant uppercase">
                    {(() => {
                      const totalLogged = (project as any).tasks.reduce((sum: number, t: any) => sum + (t.workLogs?.reduce((tsum: number, l: any) => tsum + l.hours, 0) || 0), 0);
                      const percent = (project as any).estimatedHours ? Math.round((totalLogged / (project as any).estimatedHours) * 100) : 0;
                      return (
                        <>
                          <span>Effort Progress</span>
                          <span>{percent}%</span>
                        </>
                      );
                    })()}
                  </div>
                  <ProgressBar 
                    value={(() => {
                      const totalLogged = (project as any).tasks.reduce((sum: number, t: any) => sum + (t.workLogs?.reduce((tsum: number, l: any) => tsum + l.hours, 0) || 0), 0);
                      return (project as any).estimatedHours ? Math.min(100, (totalLogged / (project as any).estimatedHours) * 100) : 0;
                    })()}
                    color={(() => {
                       const totalLogged = (project as any).tasks.reduce((sum: number, t: any) => sum + (t.workLogs?.reduce((tsum: number, l: any) => tsum + l.hours, 0) || 0), 0);
                       return (project as any).estimatedHours && totalLogged > (project as any).estimatedHours ? 'error' : 'primary';
                    })()}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
