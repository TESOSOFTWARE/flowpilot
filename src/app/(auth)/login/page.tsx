'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (res?.error) {
        toast.error('Invalid email or password')
      } else {
        toast.success('Welcome back!')
        router.push('/dashboard')
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e1dfff] via-[#f8f9fb] to-[#f3daff] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary to-primary-container rounded-2xl shadow-lg mb-4">
            <span className="material-symbols-outlined text-white text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
              architecture
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-on-surface">TinyBee</h1>
          <p className="text-on-surface-variant text-sm mt-1">Management Suite</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-[0_8px_40px_rgba(71,68,229,0.12)] p-8">
          <h2 className="text-xl font-bold text-on-surface mb-1">Sign in</h2>
          <p className="text-on-surface-variant text-sm mb-6">Welcome back — enter your credentials to continue.</p>

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
                <span className="bg-white px-2 text-on-surface-variant font-medium">Or continue with</span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@architectpro.io"
                required
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm text-on-surface border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-on-surface">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm text-on-surface border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-semibold py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shadow-[0_4px_14px_rgba(71,68,229,0.4)]"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-primary-fixed rounded-lg">
            <p className="text-xs font-semibold text-on-primary-fixed-variant mb-1">Demo credentials:</p>
            <p className="text-xs text-on-surface-variant">admin@architectpro.io / password123</p>
          </div>
        </div>

        <p className="text-center text-sm text-on-surface-variant mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-primary font-semibold hover:underline">
            Start free trial
          </Link>
        </p>
      </div>
    </div>
  )
}
