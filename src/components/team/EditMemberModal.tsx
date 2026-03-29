'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'

interface EditMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  member: any | null
}

export default function EditMemberModal({ isOpen, onClose, onSuccess, member }: EditMemberModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  
  const [formData, setFormData] = useState({
    roleId: '',
    role: '',
    capacity: 100,
    isActive: true,
    skills: '',
  })

  const [roles, setRoles] = useState<any[]>([])

  useEffect(() => {
    fetch('/api/admin/roles')
      .then(r => r.json())
      .then(d => { if (d.success) setRoles(d.data) })
  }, [])

  useEffect(() => {
    if (member) {
      setFormData({
        roleId: member.roleId || '',
        role: member.role || '',
        capacity: member.capacity ?? 100,
        isActive: member.isActive ?? true,
        skills: member.skills ? JSON.parse(member.skills).join(', ') : '',
      })
    }
  }, [member])

  if (!isOpen || !member) return null

  const update = (key: string, value: any) => setFormData(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if ((!formData.role && !formData.roleId) || formData.capacity < 0 || formData.capacity > 100) {
      toast.error('Valid role and capacity (0-100) are required')
      return
    }

    setLoading(true)
    try {
      const skillsArray = formData.skills
        ? formData.skills.split(',').map(s => s.trim()).filter(s => s)
        : []

      const res = await fetch(`/api/team/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleId: formData.roleId || null,
          role: formData.role, // Keep for display/fallback
          capacity: formData.capacity,
          isActive: formData.isActive,
          skills: skillsArray,
        }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Team member updated')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to update member')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to remove this member from the team?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/team/${member.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (data.success) {
        toast.success('Member removed')
        onSuccess()
        onClose()
      } else {
        toast.error(data.error || 'Failed to remove member')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Edit Team Member</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
          <div className="flex items-center gap-4 mb-6 p-4 bg-surface-container-lowest border border-outline-variant/20 rounded-xl">
            <Avatar src={member.user?.image} name={member.user?.name} size={48} />
            <div>
              <p className="text-sm font-bold">{member.user?.name}</p>
              <p className="text-xs text-on-surface-variant">{member.user?.email}</p>
            </div>
          </div>

          <form id="edit-member-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Workspace Role <span className="text-error">*</span></label>
              <div className="relative">
                <select
                  value={formData.roleId}
                  onChange={e => update('roleId', e.target.value)}
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer font-bold"
                  required
                >
                  <option value="">Select a role...</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
              </div>
              {roles.length === 0 && (session?.user as any)?.role === 'ADMIN' && (
                <div className="mt-2 p-3 bg-primary/5 rounded-lg border border-primary/10 flex items-start gap-3">
                  <span className="material-symbols-outlined text-primary text-lg mt-0.5">info</span>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-primary">No workspace roles found.</p>
                    <p className="text-[10px] text-on-surface-variant mt-1">
                      You need to create roles before you can assign them to members. 
                      <Link href="/settings/administration" className="text-primary hover:underline ml-1 font-bold" onClick={onClose}>
                        Go to Role Management →
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Job Title / Display Role</label>
              <input
                type="text"
                value={formData.role}
                onChange={e => update('role', e.target.value)}
                placeholder="e.g. Senior Frontend Engineer"
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Capacity (%) <span className="text-error">*</span></label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={formData.capacity}
                  onChange={e => update('capacity', parseInt(e.target.value))}
                  className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-on-surface">Status</label>
                <div className="relative">
                  <select
                    value={formData.isActive ? 'active' : 'inactive'}
                    onChange={e => update('isActive', e.target.value === 'active')}
                    className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 appearance-none cursor-pointer font-bold"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Away / Inactive</option>
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">keyboard_arrow_down</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Skills</label>
              <input
                type="text"
                value={formData.skills}
                onChange={e => update('skills', e.target.value)}
                placeholder="e.g. React, Node.js, Design Systems (comma separated)"
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
              />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-outline-variant/10 bg-surface-container-low flex justify-between items-center mt-auto">
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="px-4 py-2 text-sm font-bold text-error hover:bg-error-container rounded-lg transition-colors flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">person_remove</span>
            {deleting ? 'Removing...' : 'Remove'}
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="edit-member-form"
              disabled={loading}
              className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
