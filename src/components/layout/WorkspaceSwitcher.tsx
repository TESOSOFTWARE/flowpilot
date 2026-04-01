'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ChevronUpDownIcon, PlusIcon, CheckIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import toast from 'react-hot-toast'

export default function WorkspaceSwitcher() {
  const { data: session, update } = useSession()
  const [workspaces, setWorkspaces] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [newWorkspaceName, setNewWorkspaceName] = useState('')

  useEffect(() => {
    fetchWorkspaces()
  }, [])

  const fetchWorkspaces = async () => {
    try {
      const res = await fetch('/api/workspaces')
      const data = await res.json()
      if (data.success) {
        setWorkspaces(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch workspaces', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSwitch = async (orgId: string) => {
    if (orgId === (session?.user as any)?.organizationId) return

    const loadingToast = toast.loading('Switching workspace...')
    try {
      const res = await fetch('/api/workspaces/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId: orgId })
      })
      const data = await res.json()
      if (data.success) {
        await update({ organizationId: orgId })
        toast.success('Switched workspace', { id: loadingToast })
        window.location.reload() // Force reload to refresh all data context
      } else {
        toast.error(data.error || 'Failed to switch', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to switch workspace', { id: loadingToast })
    }
  }

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWorkspaceName.trim()) return

    const loadingToast = toast.loading('Creating workspace...')
    try {
      const res = await fetch('/api/workspaces', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newWorkspaceName })
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Workspace created', { id: loadingToast })
        setIsCreating(false)
        setNewWorkspaceName('')
        fetchWorkspaces()
        // Switch to new workspace
        handleSwitch(data.data.id)
      } else {
        toast.error(data.error || 'Failed to create', { id: loadingToast })
      }
    } catch (error) {
      toast.error('Failed to create workspace', { id: loadingToast })
    }
  }

  if (loading) return <div className="h-10 w-full animate-pulse bg-surface-variant/20 rounded-lg"></div>

  const activeOrgName = (session?.user as any)?.organizationName || 'Select Workspace'

  return (
    <div className="px-3 mb-6 relative z-50">
      <Menu as="div" className="relative">
        <Menu.Button className="w-full flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-surface-variant/10 hover:bg-surface-variant/20 transition-all border border-outline/10 group">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 text-primary font-bold">
              {activeOrgName.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-semibold text-on-surface truncate">
              {activeOrgName}
            </span>
          </div>
          <ChevronUpDownIcon className="w-4 h-4 text-on-surface-variant group-hover:text-on-surface" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute left-0 right-0 mt-2 w-full origin-top-left rounded-xl bg-surface border border-outline/10 shadow-xl focus:outline-none py-2 z-[60]">
            <div className="px-3 py-1 mb-1">
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">Your Workspaces</p>
            </div>
            
            <div className="max-h-60 overflow-y-auto">
              {workspaces.map((workspace) => (
                <Menu.Item key={workspace.id}>
                  {({ active }) => (
                    <button
                      onClick={() => handleSwitch(workspace.id)}
                      className={`${
                        active ? 'bg-primary/10 text-primary' : 'text-on-surface'
                      } flex w-full items-center justify-between gap-2 px-3 py-2 text-sm transition-colors`}
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className={`w-6 h-6 rounded bg-surface-variant/20 flex items-center justify-center text-xs font-medium ${active ? 'text-primary' : ''}`}>
                          {workspace.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{workspace.name}</span>
                      </div>
                      {workspace.id === (session?.user as any)?.organizationId && (
                        <CheckIcon className="w-4 h-4 text-primary" />
                      )}
                    </button>
                  )}
                </Menu.Item>
              ))}
            </div>

            <div className="mt-2 pt-2 border-t border-outline/5 px-2">
              {!isCreating ? (
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-on-surface-variant hover:text-primary transition-colors"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>Create Workspace</span>
                </button>
              ) : (
                <form onSubmit={handleCreateWorkspace} className="px-2 py-2 space-y-2">
                  <input
                    autoFocus
                    type="text"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === ' ') {
                        e.stopPropagation();
                      }
                    }}
                    placeholder="Workspace name..."
                    className="w-full text-xs px-2 py-1.5 rounded bg-surface-variant/10 border border-outline/10 focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 text-[10px] bg-primary text-on-primary py-1 rounded font-bold uppercase"
                    >
                      Create
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="flex-1 text-[10px] bg-surface-variant/20 text-on-surface py-1 rounded font-bold uppercase"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}
