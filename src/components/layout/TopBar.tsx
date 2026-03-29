'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'

export default function TopBar() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 z-40 bg-surface-bright/80 backdrop-blur-md flex items-center justify-between px-8 shadow-[0_8px_24px_rgba(25,28,30,0.04)]">
      {/* Search */}
      <div className="flex items-center flex-1 max-w-md">
        <div className="relative w-full group">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl">
            search
          </span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search projects, tasks, or team..."
            className="w-full bg-surface-container-low border-none rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-2">
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all relative">
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-2 right-2 w-2 h-2 bg-secondary rounded-full border border-surface-bright"></span>
        </button>
        <button className="p-2 text-on-surface-variant hover:bg-surface-container-low rounded-full transition-all">
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        <div className="h-6 w-px bg-outline-variant/30 mx-2"></div>

        <button className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors px-2">
          Feedback
        </button>

        {(session?.user as any)?.organizationName && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary-container/30 rounded-full border border-secondary-container/50 ml-2">
            <span className="material-symbols-outlined text-secondary text-sm">domain</span>
            <span className="text-[11px] font-bold text-secondary uppercase tracking-wider">
              {(session as any)?.user?.organizationName}
            </span>
          </div>
        )}

        {/* User */}
        <div className="relative ml-2" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 p-1 rounded-full hover:bg-surface-container-low transition-all ring-1 ring-outline-variant/20 shadow-sm"
          >
            <Avatar 
              src={session?.user?.image} 
              name={session?.user?.name} 
              size={32} 
            />
            <span className="material-symbols-outlined text-sm text-on-surface-variant">
              {isDropdownOpen ? 'expand_less' : 'expand_more'}
            </span>
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-outline-variant/30 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.12)] p-2">
              <div className="px-3 py-2 border-b border-outline-variant/10 mb-2">
                <p className="text-sm font-bold truncate text-on-surface">{session?.user?.name || 'User'}</p>
                <p className="text-[10px] text-on-surface-variant truncate uppercase tracking-widest font-semibold">{(session?.user as any)?.role || 'Member'}</p>
              </div>
              <Link 
                href="/settings"
                onClick={() => setIsDropdownOpen(false)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-on-surface hover:bg-surface-container-low transition-all group"
              >
                <span className="material-symbols-outlined group-hover:text-primary transition-colors">account_circle</span>
                My Profile
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-error hover:bg-error-container/20 transition-all group mt-1"
              >
                <span className="material-symbols-outlined group-hover:text-error transition-colors">logout</span>
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
