'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Avatar } from '@/components/ui/Avatar'

const AVATARS = [
  'https://ui-avatars.com/api/?name=User&background=6366f1&color=fff',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Anya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Eric',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Maya',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Jai',
]

export default function ProfileSettings() {
  const { data: session, update } = useSession()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0])

  useState(() => {
    if (session?.user?.name) setName(session.user.name)
    if (session?.user?.image) setSelectedAvatar(session.user.image)
  })

  // Sync state with session if it changes (e.g. after login/update)
  const [hasInited, setHasInited] = useState(false)
  if (!hasInited && session?.user) {
    if (session.user.name) setName(session.user.name)
    if (session.user.image) setSelectedAvatar(session.user.image)
    setHasInited(true)
  }

  async function handleUpdateProfile() {
    setLoading(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, image: selectedAvatar }),
      })

      if (!res.ok) throw new Error('Failed to update profile')

      // Refresh session
      await update({ name, image: selectedAvatar })
      
      toast.success('Profile updated successfully!')
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-xl p-8 shadow-sm">
      <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
        <span className="material-symbols-outlined text-primary">person</span>
        Your Profile
      </h2>
      
      <div className="space-y-8">
        {/* Avatar Selection */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-on-surface">Profile Picture</label>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="relative w-20 h-20 rounded-full flex items-center justify-center ring-4 ring-primary/10 shadow-lg overflow-hidden">
              <Avatar
                src={selectedAvatar}
                name={name}
                size={80}
              />
            </div>
            <div className="flex gap-2 flex-wrap max-w-sm">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 rounded-full overflow-hidden transition-all border-2 ${
                    selectedAvatar === avatar ? 'border-primary scale-110 shadow-md' : 'border-transparent hover:border-outline-variant'
                  }`}
                >
                  <img src={avatar} alt="Avatar option" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your Name"
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm text-on-surface border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-on-surface">Email Address</label>
            <input
              type="email"
              value={session?.user?.email || ''}
              disabled
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm text-on-surface-variant border-none outline-none opacity-60 cursor-not-allowed font-medium"
            />
            <p className="text-[10px] text-on-surface-variant italic">Email cannot be changed.</p>
          </div>
        </div>

        <div>
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-lg text-sm font-bold hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shadow-md shadow-primary/20"
          >
            {loading ? 'Saving Changes...' : 'Save Profile Settings'}
          </button>
        </div>
      </div>
    </section>
  )
}
