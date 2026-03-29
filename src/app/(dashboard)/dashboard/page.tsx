import { auth } from '@/lib/auth'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { StatusBadge } from '@/components/ui/Badge'

async function getDashboardData(orgId: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  // Fetch directly from Prisma for SSR
  const { prisma } = await import('@/lib/prisma')

  const [
    totalProjects, activeProjects, pendingProjects, completedProjects,
    totalTasks, doneTasks, teamCount, recentActivity, recentProjects,
  ] = await Promise.all([
    prisma.project.count({ where: { organizationId: orgId } }),
    prisma.project.count({ where: { organizationId: orgId, status: 'ACTIVE' } }),
    prisma.project.count({ where: { organizationId: orgId, status: 'PENDING' } }),
    prisma.project.count({ where: { organizationId: orgId, status: 'COMPLETED' } }),
    prisma.task.count({ where: { project: { organizationId: orgId } } }),
    prisma.task.count({ where: { project: { organizationId: orgId }, status: 'DONE' } }),
    prisma.teamMember.count({ where: { organizationId: orgId } }),
    prisma.activity.findMany({
      where: { user: { organizationId: orgId } },
      include: { user: { select: { id: true, name: true, image: true } }, project: { select: { id: true, title: true } } },
      orderBy: { createdAt: 'desc' },
      take: 6,
    }),
    prisma.project.findMany({
      where: { organizationId: orgId },
      include: { manager: { select: { id: true, name: true, image: true } }, _count: { select: { tasks: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
    }),
  ])

  return {
    stats: { totalProjects, activeProjects, pendingProjects, completedProjects, totalTasks, doneTasks, teamCount },
    recentActivity,
    recentProjects,
  }
}

function timeAgo(date: Date) {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} minutes ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hours ago`
  return 'Yesterday'
}

export default async function DashboardPage() {
  const session = await auth()
  const orgId = (session?.user as any)?.organizationId
  const { stats, recentActivity, recentProjects } = await getDashboardData(orgId)

  const completionRate = stats.totalTasks > 0
    ? Math.round((stats.doneTasks / stats.totalTasks) * 1000) / 10
    : 0

  const barHeights = [32, 40, 24, 36, 44, 32, 28, 36, 48, 32, 24, 16]

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">Workspace Overview</h1>
        <p className="text-on-surface-variant mt-1">
          {stats.activeProjects} active projects · {stats.teamCount} team members
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Project Health (8 cols) */}
        <div className="col-span-12 lg:col-span-8 bg-white rounded-xl p-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold">Project Health Portfolio</h2>
            <select className="bg-surface-container-low border-none text-xs font-semibold rounded-lg py-1.5 px-3 focus:ring-1 focus:ring-primary/20 outline-none">
              <option>Last 30 Days</option>
              <option>Last 90 Days</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Completion Rate</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold">{completionRate}%</span>
                <span className="text-xs text-green-600 font-bold flex items-center">
                  <span className="material-symbols-outlined text-sm">arrow_upward</span> 12%
                </span>
              </div>
              <ProgressBar value={completionRate} color="primary" className="mt-3" />
            </div>
            <div>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">On-Track Tasks</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold">{stats.doneTasks}</span>
                <span className="text-xs text-on-surface-variant font-medium">/ {stats.totalTasks}</span>
              </div>
              <ProgressBar
                value={stats.totalTasks > 0 ? (stats.doneTasks / stats.totalTasks) * 100 : 0}
                color="secondary"
                className="mt-3"
              />
            </div>
            <div>
              <span className="text-on-surface-variant text-xs font-medium uppercase tracking-wider">Active Projects</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold">{stats.activeProjects}</span>
                <span className="text-xs text-on-surface-variant font-medium">/ {stats.totalProjects}</span>
              </div>
              <ProgressBar
                value={stats.totalProjects > 0 ? (stats.activeProjects / stats.totalProjects) * 100 : 0}
                color="primary"
                className="mt-3"
              />
            </div>
          </div>

          {/* Bar Chart */}
          <div className="mt-10 h-48 w-full bg-surface-container-low rounded-lg flex items-end px-4 gap-2 overflow-hidden">
            {barHeights.map((h, i) => (
              <div
                key={i}
                className="flex-1 bg-primary rounded-t-sm transition-all"
                style={{ height: `${h * 4}px`, opacity: 0.15 + (h / 48) * 0.7 }}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 px-1 text-[10px] text-on-surface-variant font-medium">
            <span>Jan</span><span>Feb</span><span>Mar</span><span>Apr</span><span>May</span>
            <span>Jun</span><span>Jul</span><span>Aug</span><span>Sep</span><span>Oct</span>
            <span>Nov</span><span>Dec</span>
          </div>
        </div>

        {/* Team Activity (4 cols) */}
        <div className="col-span-12 lg:col-span-4 bg-surface-container-low rounded-xl p-6">
          <h2 className="text-lg font-bold mb-6">Team Activity</h2>
          <div className="space-y-5">
            {recentActivity.length === 0 && (
              <p className="text-sm text-on-surface-variant text-center py-8">No activity yet</p>
            )}
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <Avatar src={activity.user.image} name={activity.user.name} size={36} className="flex-shrink-0" />
                <div>
                  <p className="text-sm">
                    <span className="font-bold">{activity.user.name}</span>
                    {' '}{activity.action}{' '}
                    {activity.target && (
                      <span className="text-primary font-semibold">{activity.target}</span>
                    )}
                  </p>
                  <span className="text-xs text-on-surface-variant">{timeAgo(activity.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
          <Link href="/projects" className="w-full mt-6 py-2 text-sm font-semibold text-primary hover:bg-surface-container-high rounded-lg transition-all text-center block">
            View All Activity
          </Link>
        </div>

        {/* Recent Projects (full width) */}
        <div className="col-span-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight">Recent Projects</h2>
            <Link href="/projects" className="text-sm font-bold text-primary flex items-center gap-1 group">
              Browse Full Directory
              <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">arrow_right_alt</span>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentProjects.map((project) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <div className="bg-white rounded-xl p-6 hover:bg-surface-container transition-all cursor-pointer h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>apartment</span>
                    </div>
                    <StatusBadge status={project.status} />
                  </div>
                  <h3 className="text-base font-bold text-on-surface mb-1 hover:text-primary transition-colors">{project.title}</h3>
                  <p className="text-on-surface-variant text-sm mb-4 line-clamp-2">{project.description || 'No description'}</p>
                  <div className="mt-auto">
                    <ProgressBar value={project.progress} />
                    <div className="flex items-center justify-between mt-3 border-t border-outline-variant/10 pt-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={project.manager?.image} name={project.manager?.name} size={22} />
                        <span className="text-xs font-semibold text-on-surface-variant">{project.manager?.name || 'Unassigned'}</span>
                      </div>
                      <span className="text-xs text-on-surface-variant">{project._count.tasks} tasks</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
