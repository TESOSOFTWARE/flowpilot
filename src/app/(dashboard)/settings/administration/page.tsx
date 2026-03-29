'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import AddRoleModal from '@/components/admin/AddRoleModal'
import EditRoleModal from '@/components/admin/EditRoleModal'

export default function AdministrationPage() {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false)
  const [selectedRole, setSelectedRole] = useState<any | null>(null)

  const fetchRoles = () => {
    setLoading(true)
    fetch('/api/admin/roles')
      .then(r => r.json())
      .then(d => { if (d.success) setRoles(d.data) })
      .catch(() => toast.error('Failed to load roles'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <div className="p-8 space-y-8 max-w-6xl mx-auto">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Administration</h1>
          <p className="text-on-surface-variant mt-1">Manage Roles, Permissions, and Workspace Security.</p>
        </div>
        <button 
          onClick={() => setIsAddRoleModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-lg">add_moderator</span> Create New Role
        </button>
      </div>

      {/* Roles Section */}
      <section className="bg-white rounded-2xl shadow-sm border border-outline-variant/10 overflow-hidden">
        <div className="px-6 py-5 border-b border-outline-variant/10 flex items-center justify-between bg-surface-container-low">
          <h2 className="text-xl font-bold">Roles &amp; Permissions</h2>
          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full uppercase tracking-wider">RBAC Module</span>
        </div>

        <div className="p-0">
          {loading ? (
            <div className="p-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
              <p className="mt-2 text-sm font-medium">Syncing security policies...</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-lowest text-on-surface-variant text-xs font-bold uppercase tracking-widest border-b border-outline-variant/5">
                  <th className="px-6 py-4 text-left font-extrabold">Role Name</th>
                  <th className="px-6 py-4 text-left font-extrabold">Permissions</th>
                  <th className="px-6 py-4 text-left font-extrabold">Active Members</th>
                  <th className="px-6 py-4 text-right font-extrabold pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5 font-sans">
                {roles.map(role => (
                  <tr key={role.id} className="hover:bg-surface-container-low/30 transition-all">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
                          <span className="material-symbols-outlined text-xl">security</span>
                        </span>
                        <div>
                          <p className="font-bold text-base">{role.name}</p>
                          <p className="text-xs text-on-surface-variant mt-0.5">{role.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {role.permissions?.map((p: any) => (
                          <span key={p.id} className="px-2.5 py-1 bg-surface-container text-on-surface-variant rounded-md text-[11px] font-bold border border-outline-variant/5">
                            {p.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-on-surface">{role._count?.teamMembers || 0}</span>
                        <span className="text-xs text-on-surface-variant">Members</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right pr-8">
                       <button 
                        onClick={() => setSelectedRole(role)}
                        className="p-2 text-on-surface-variant hover:text-primary hover:bg-primary/5 rounded-lg transition-all" 
                        title="Edit Role"
                      >
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Security Info Card */}
      <div className="p-6 bg-gradient-to-br from-primary-container/20 to-secondary-container/20 rounded-2xl border border-primary/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center text-primary flex-shrink-0">
            <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>policy</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">RBAC Enforcement Active</h3>
            <p className="text-sm text-on-surface-variant mt-1">
              Role-Based Access Control is enforced platform-wide. Only organization owners and administrators can modify these security policies. New members will be assigned the "Developer" role by default if not specified otherwise.
            </p>
          </div>
        </div>
      </div>

      <AddRoleModal 
        isOpen={isAddRoleModalOpen}
        onClose={() => setIsAddRoleModalOpen(false)}
        onSuccess={fetchRoles}
      />

      <EditRoleModal 
        isOpen={!!selectedRole}
        onClose={() => setSelectedRole(null)}
        onSuccess={fetchRoles}
        role={selectedRole}
      />
    </div>
  )
}
