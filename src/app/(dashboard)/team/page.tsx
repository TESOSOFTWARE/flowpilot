'use client'

import { useState, useEffect } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import toast from 'react-hot-toast'
import InviteMemberModal from '@/components/team/InviteMemberModal'
import EditMemberModal from '@/components/team/EditMemberModal'

interface TeamMember {
  id: string
  roleId: string | null
  role: string
  capacity: number
  isActive: boolean
  skills: string | null
  joinedAt: string
  inviteEmail?: string | null
  user: { id: string; name: string | null; email: string; image: string | null; createdAt: string } | null
  Role?: { id: string; name: string } | null
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null)

  const fetchTeam = () => {
    setLoading(true)
    fetch('/api/team')
      .then(r => r.json())
      .then(d => { if (d.success) setMembers(d.data) })
      .catch(() => toast.error('Failed to load team'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchTeam()
  }, [])

  const filtered = members.filter(m =>
    !search || 
    (m.user?.name?.toLowerCase().includes(search.toLowerCase())) ||
    (m.user?.email.toLowerCase().includes(search.toLowerCase())) ||
    (m.inviteEmail?.toLowerCase().includes(search.toLowerCase())) ||
    m.role.toLowerCase().includes(search.toLowerCase()) ||
    m.Role?.name.toLowerCase().includes(search.toLowerCase())
  )

  const activeCount = members.filter(m => m.isActive && m.user).length
  const avgCapacity = members.length > 0 ? Math.round(members.reduce((a, m) => a + m.capacity, 0) / members.length) : 0

  const getCapacityColor = (cap: number) => {
    if (cap >= 80) return 'bg-error'
    if (cap >= 50) return 'bg-primary'
    if (cap > 0) return 'bg-green-500'
    return 'bg-surface-container-high'
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Team Directory</h1>
          <p className="text-on-surface-variant mt-1">{members.length} members in your workspace.</p>
        </div>
        <div className="flex gap-3">
          <a href="/settings/administration" className="flex items-center gap-2 px-5 py-2.5 bg-white border border-outline-variant/20 text-on-surface rounded-lg text-sm font-semibold hover:bg-surface-container-low transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">admin_panel_settings</span> Manage Roles
          </a>
          <button onClick={() => setIsInviteModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm">
            <span className="material-symbols-outlined text-lg">person_add</span> Invite Member
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Members', value: members.length, icon: 'groups', color: 'bg-primary/10 text-primary' },
          { label: 'Active Now', value: activeCount, icon: 'check_circle', color: 'bg-green-100 text-green-600' },
          { label: 'Avg Capacity', value: `${avgCapacity}%`, icon: 'donut_large', color: 'bg-secondary/10 text-secondary' },
          { label: 'Roles', value: new Set(members.map(m => m.roleId || m.role)).size, icon: 'badge', color: 'bg-orange-100 text-orange-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl p-6 flex items-center gap-4">
            <span className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${s.color}`}>
              <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
            </span>
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide">{s.label}</p>
              <p className="text-2xl font-extrabold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Team Table */}
      <div className="bg-white rounded-xl overflow-hidden">
        {/* Toolbar */}
        <div className="px-6 py-4 flex items-center gap-4 border-b border-outline-variant/10">
          <h2 className="text-lg font-bold mr-4">All Members</h2>
          <div className="relative flex-1 max-w-sm">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-lg">search</span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name, role..."
              className="w-full bg-surface-container-low rounded-lg pl-9 pr-4 py-2 text-sm border-none outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center">
            <span className="material-symbols-outlined text-4xl animate-spin">refresh</span>
          </div>
        ) : (
          <>
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low text-on-surface-variant text-xs font-bold uppercase tracking-widest">
                  <th className="px-6 py-4 text-left">Member</th>
                  <th className="px-6 py-4 text-left">Role</th>
                  <th className="px-6 py-4 text-left">Skills</th>
                  <th className="px-6 py-4 text-left">Capacity</th>
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/5">
                {filtered.map(m => {
                  const skills: string[] = m.skills ? JSON.parse(m.skills) : []
                  const isPending = !m.user;
                  return (
                    <tr key={m.id} onClick={() => setSelectedMember(m)} className="hover:bg-surface-container-low/50 transition-all group cursor-pointer">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={m.user?.image || null} name={m.user?.name || m.inviteEmail || 'P'} size={40} />
                          <div>
                            <p className="text-sm font-bold">{m.user?.name || 'Pending Invitation'}</p>
                            <p className="text-xs text-on-surface-variant">{m.user?.email || m.inviteEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-on-surface">{m.Role?.name || 'Member'}</span>
                          <span className="text-[11px] text-on-surface-variant font-medium uppercase tracking-tight">{m.role}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {skills.slice(0, 3).map(s => (
                            <span key={s} className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[11px] font-semibold">{s}</span>
                          ))}
                          {skills.length > 3 && (
                            <span className="px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-[11px]">+{skills.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3 w-36">
                          <div className="flex-1 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${getCapacityColor(m.capacity)}`}
                              style={{ width: `${m.capacity}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold w-8 text-right">{m.capacity}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isPending ? 'bg-orange-100 text-orange-700' : (m.isActive ? 'bg-green-100 text-green-700' : 'bg-surface-container-high text-on-surface-variant')}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isPending ? 'bg-orange-600' : (m.isActive ? 'bg-green-600' : 'bg-on-surface-variant')}`} />
                          {isPending ? 'Pending' : (m.isActive ? 'Active' : 'Away')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-on-surface-variant">
                          {new Date(m.joinedAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && search && (
              <div className="p-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-4xl">search_off</span>
                <p className="font-semibold mt-2">No results for &quot;{search}&quot;</p>
              </div>
            )}
          </>
        )}

        {/* AI Insight Card */}
        <div className="m-6 p-6 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-xl border border-secondary/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-primary text-white flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            </div>
            <div>
              <p className="text-sm font-bold">AI Resource Insight</p>
              <p className="text-sm text-on-surface-variant mt-1">
                {avgCapacity > 70
                  ? `Team capacity is at ${avgCapacity}% — consider redistributing workload to prevent burnout.`
                  : `Team capacity is healthy at ${avgCapacity}%. ${activeCount} members are currently available for new assignments.`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={fetchTeam}
      />
      
      <EditMemberModal
        isOpen={!!selectedMember}
        onClose={() => setSelectedMember(null)}
        onSuccess={() => { setSelectedMember(null); fetchTeam(); }}
        member={selectedMember}
      />
    </div>
  )
}
