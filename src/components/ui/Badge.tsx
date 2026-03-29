import { clsx } from 'clsx'

interface BadgeProps {
  variant?: 'active' | 'pending' | 'completed' | 'archived' | 'high' | 'medium' | 'low' | 'critical' | 'on-track' | 'milestone' | 'planning' | 'blocked'
  children: React.ReactNode
  className?: string
}

const variants: Record<string, string> = {
  active: 'bg-green-100 text-green-700',
  pending: 'bg-secondary/10 text-secondary',
  completed: 'bg-surface-container text-on-surface-variant',
  archived: 'bg-surface-container-high text-on-surface-variant',
  high: 'bg-error-container text-on-error-container',
  medium: 'bg-primary-fixed text-on-primary-fixed-variant',
  low: 'bg-surface-container-high text-on-surface-variant',
  critical: 'bg-error-container text-error',
  blocked: 'bg-error-container text-on-error-container',
  'on-track': 'bg-green-100 text-green-700',
  milestone: 'bg-secondary-fixed text-secondary',
  planning: 'bg-surface-container-high text-on-surface-variant',
}

const dots: Record<string, string> = {
  active: 'bg-green-600',
  pending: 'bg-secondary',
  completed: 'bg-on-surface-variant',
  archived: 'bg-on-surface-variant',
  high: 'bg-error',
  blocked: 'bg-error',
  critical: 'bg-error',
  'on-track': 'bg-green-600',
}

export function Badge({ variant = 'active', children, className }: BadgeProps) {
  return (
    <span className={clsx(
      'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-tight',
      variants[variant] || variants.active,
      className
    )}>
      {dots[variant] && (
        <span className={clsx('w-1.5 h-1.5 rounded-full', dots[variant])} />
      )}
      {children}
    </span>
  )
}

export function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    HIGH: 'high',
    MEDIUM: 'medium',
    LOW: 'low',
    CRITICAL: 'critical',
  }
  return <Badge variant={map[priority] || 'medium'}>{priority}</Badge>
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeProps['variant']> = {
    ACTIVE: 'active',
    PENDING: 'pending',
    COMPLETED: 'completed',
    ARCHIVED: 'archived',
    TODO: 'low',
    IN_PROGRESS: 'medium',
    DONE: 'completed',
    BLOCKED: 'blocked',
  }
  const labels: Record<string, string> = {
    ACTIVE: 'Active',
    PENDING: 'Pending',
    COMPLETED: 'Completed',
    ARCHIVED: 'Archived',
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    DONE: 'Done',
    BLOCKED: 'Blocked',
  }
  return <Badge variant={map[status] || 'active'}>{labels[status] || status}</Badge>
}
