interface ProgressBarProps {
  value: number
  color?: 'primary' | 'secondary' | 'error' | 'green'
  className?: string
}

const colorMap = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  error: 'bg-error',
  green: 'bg-green-500',
}

export function ProgressBar({ value, color = 'primary', className }: ProgressBarProps) {
  const pct = Math.min(100, Math.max(0, value))
  return (
    <div className={`w-full h-1.5 bg-surface-container rounded-full overflow-hidden ${className || ''}`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ${colorMap[color]}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
