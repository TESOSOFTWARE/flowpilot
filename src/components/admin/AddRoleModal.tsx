'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface AddRoleModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddRoleModal({ isOpen, onClose, onSuccess }: AddRoleModalProps) {
  const [loading, setLoading] = useState(false)
  const [permissions, setPermissions] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionKeys: [] as string[],
  })

  useEffect(() => {
    if (isOpen) {
      fetch('/api/admin/permissions')
        .then(r => r.json())
        .then(d => { if (d.success) setPermissions(d.data) })
    }
  }, [isOpen])

  if (!isOpen) return null

  const togglePermission = (key: string) => {
    setFormData(f => ({
      ...f,
      permissionKeys: f.permissionKeys.includes(key)
        ? f.permissionKeys.filter(k => k !== key)
        : [...f.permissionKeys, key]
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.name) {
      toast.error('Role name is required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/admin/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Role created')
        setFormData({ name: '', description: '', permissionKeys: [] })
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to create role')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Create New Role</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <form id="add-role-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Role Name <span className="text-error">*</span></label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Technical Architect"
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-bold"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Description</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief description of responsibilities"
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-on-surface">Select Permissions</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {permissions.map(p => {
                  const isSelected = formData.permissionKeys.includes(p.key)
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => togglePermission(p.key)}
                      className={`flex flex-col p-3 rounded-xl border text-left transition-all group ${
                        isSelected 
                          ? 'bg-primary/5 border-primary shadow-sm ring-1 ring-primary/20' 
                          : 'bg-white border-outline-variant/10 hover:border-primary/30 hover:bg-surface-container-low'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <p className={`text-xs font-bold uppercase tracking-wide ${isSelected ? 'text-primary' : 'text-on-surface'}`}>{p.name}</p>
                        <span className={`material-symbols-outlined text-lg ${isSelected ? 'text-primary' : 'text-on-surface-variant'}`}>{isSelected ? 'check_box' : 'check_box_outline_blank'}</span>
                      </div>
                      <p className="text-[11px] text-on-surface-variant line-clamp-2">{p.description}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low flex justify-end gap-3 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="add-role-form"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">shield</span>
            {loading ? 'Creating...' : 'Create Role'}
          </button>
        </div>
      </div>
    </div>
  )
}
