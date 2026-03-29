'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { clsx } from 'clsx'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import WorkspaceSwitcher from './WorkspaceSwitcher'

const navItems = [
  { href: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { href: '/projects', icon: 'folder_open', label: 'Projects' },
  { href: '/tasks', icon: 'task_alt', label: 'My Tasks' },
  { href: '/team', icon: 'groups', label: 'Team' },
  { href: '/settings', icon: 'settings', label: 'Settings' },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="h-screen w-64 flex flex-col fixed left-0 top-0 bg-surface-container-low z-50 p-4 gap-2">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 mb-8">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary-container rounded-lg flex items-center justify-center text-white shadow-md">
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>
            architecture
          </span>
        </div>
        <div>
          <h1 className="text-base font-extrabold text-on-surface leading-tight">FlowPilot</h1>
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Management Suite</p>
        </div>
      </div>

      <WorkspaceSwitcher />

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm',
                isActive
                  ? 'bg-primary-fixed text-primary font-semibold'
                  : 'text-on-surface-variant hover:bg-surface-container font-medium'
              )}
            >
              <span
                className="material-symbols-outlined text-xl"
                style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* New Project CTA */}
      <div className="mt-auto pt-4 border-t border-outline-variant/10">
        <Link
          href="/projects/new"
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-br from-primary to-primary-container text-white py-3 rounded-lg text-sm font-semibold hover:opacity-90 active:scale-95 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          New Project
        </Link>
      </div>
    </aside>
  )
}
