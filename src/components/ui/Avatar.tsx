import Image from 'next/image'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: number
  className?: string
}

export function Avatar({ src, name, size = 32, className = '' }: AvatarProps) {
  const initials = name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || '?'
  if (src) {
    return (
      <Image
        src={src}
        alt={name || 'User'}
        width={size}
        height={size}
        unoptimized
        className={`rounded-full object-cover ${className}`}
      />
    )
  }
  return (
    <div
      className={`rounded-full bg-primary-fixed text-primary font-bold flex items-center justify-center ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {initials}
    </div>
  )
}

interface AvatarGroupProps {
  users: Array<{ id: string; name?: string | null; image?: string | null }>
  max?: number
  size?: number
}

export function AvatarGroup({ users, max = 4, size = 28 }: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max
  return (
    <div className="flex -space-x-2">
      {visible.map(u => (
        <Avatar
          key={u.id}
          src={u.image}
          name={u.name}
          size={size}
          className="border-2 border-white"
        />
      ))}
      {overflow > 0 && (
        <div
          className="rounded-full bg-surface-container-high border-2 border-white flex items-center justify-center text-xs font-bold text-on-surface-variant"
          style={{ width: size, height: size }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
