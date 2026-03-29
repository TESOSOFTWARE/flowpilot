'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import toast from 'react-hot-toast'

interface InviteMemberModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function InviteMemberModal({ isOpen, onClose, onSuccess }: InviteMemberModalProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '',
  })

  useEffect(() => {
    if (isOpen) {
      console.log('Fetching roles...')
      fetch('/api/admin/roles')
        .then(r => {
          console.log('Roles status:', r.status)
          return r.json()
        })
        .then(d => { 
          console.log('Roles data:', d)
          if (d.success) setRoles(d.data) 
        })
        .catch(err => console.error('Error fetching roles:', err))
    }
  }, [isOpen])

  if (!isOpen) return null

  const update = (key: string, value: string) => setFormData(f => ({ ...f, [key]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.email || !formData.roleId) {
      toast.error('Email and role are required')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      
      const text = await res.text()
      let data;
      try {
        data = JSON.parse(text)
      } catch (e) {
        console.error('Failed to parse response as JSON:', text)
        throw new Error('Server returned non-JSON response')
      }

      if (data.success) {
        toast.success('Invitation sent')
        setFormData({ name: '', email: '', roleId: '' })
        onSuccess()
        onClose()
      } else {
        console.error('API Error:', data.error)
        toast.error(data.error || 'Failed to invite member')
      }
    } catch (err: any) {
      console.error('Invitation Error:', err)
      toast.error(err.message === 'Server returned non-JSON response' ? 'Server error' : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">Invite Member</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>
        
        <div className="p-6">
          <form id="invite-member-form" onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Email Address <span className="text-error">*</span></label>
              <input
                type="email"
                value={formData.email}
                onChange={e => update('email', e.target.value)}
                placeholder="colleague@company.com"
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-sans"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-on-surface">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => update('name', e.target.value)}
                placeholder="John Doe"
                className="w-full bg-surface-container-low rounded-lg py-2.5 px-4 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>

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
                      You need to create roles before you can invite members. 
                      <Link href="/settings/administration" className="text-primary hover:underline ml-1 font-bold" onClick={onClose}>
                        Go to Role Management →
                      </Link>
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <p className="text-xs text-on-surface-variant flex items-center gap-2 mt-4">
              <span className="material-symbols-outlined text-[14px]">info</span>
              The new member will be assigned specific permissions based on this role.
            </p>
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
            form="invite-member-form"
            disabled={loading}
            className="px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-lg shadow-sm hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            {loading ? 'Sending...' : 'Send Invite'}
          </button>
        </div>
      </div>
    </div>
  )
}
