'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organizationName: '',
  })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || 'Registration failed')
      } else {
        toast.success('Account created! Please sign in.')
        router.push('/login')
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3daff] via-[#f8f9fb] to-[#e1dfff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              hive
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">TinyBee</h1>
          <p className="text-on-surface-variant text-sm mt-1">Start your free trial today</p>
        </div>

        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(132,56,186,0.12)] p-8">
          <h2 className="text-xl font-bold text-on-surface mb-1">Create your workspace</h2>
          <p className="text-on-surface-variant text-sm mb-6">Set up your organization in under a minute.</p>

          <div className="space-y-4 mb-8">
            <button
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
              className="w-full flex items-center justify-center gap-3 bg-white border border-outline-variant/30 text-on-surface py-3 rounded-lg hover:bg-surface-container-low transition-all font-semibold shadow-sm"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5" />
              Continue with Google
            </button>
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-outline-variant/20"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-on-surface-variant font-medium">Or create account with email</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Organization Name</label>
              <input
                type="text"
                value={formData.organizationName}
                onChange={e => setFormData(f => ({ ...f, organizationName: e.target.value }))}
                placeholder="e.g. Skyline Architecture Inc"
                required
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Your Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                placeholder="Alex Chen"
                required
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                required
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                placeholder="Min. 8 characters"
                required
                minLength={8}
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(71,68,229,0.4)]"
            >
              {loading ? 'Creating workspace...' : 'Create Free Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-primary font-semibold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
