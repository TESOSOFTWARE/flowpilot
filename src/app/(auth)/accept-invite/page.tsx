'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useSession, signIn } from 'next-auth/react'
import toast from 'react-hot-toast'

function AcceptInviteContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { data: session, status, update } = useSession()
  const [invite, setInvite] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!token) {
      toast.error('Invalid token')
      router.push('/login')
      return
    }
    fetchInvite()
  }, [token])

  const fetchInvite = async () => {
    try {
      const res = await fetch(`/api/invites/${token}`)
      const data = await res.json()
      if (data.success) {
        setInvite(data.data)
      } else {
        toast.error(data.error || 'Invitation not found')
        router.push('/login')
      }
    } catch (error) {
      toast.error('Failed to load invitation')
    } finally {
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (status === 'unauthenticated') {
      router.push(`/register?token=${token}&email=${invite?.email}`)
      return
    }

    setAccepting(true)
    try {
      const res = await fetch(`/api/invites/${token}/accept`, { method: 'POST' })
      const data = await res.json()
      if (data.success) {
        // Update session with new org info
        await update({ 
          organizationId: data.organizationId,
          organizationName: invite.organization.name
        })
        toast.success('Joined workspace!')
        // Use window.location.href to ensure a full refresh and session propagation
        window.location.href = '/dashboard'
      } else {
        toast.error(data.error || 'Failed to join')
      }
    } catch (error) {
      toast.error('Something went wrong')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f3daff] via-[#f8f9fb] to-[#e1dfff] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center border border-primary/5">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-primary/10 rounded-full mb-6">
           <span className="material-symbols-outlined text-primary text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
             celebration
           </span>
        </div>
        
        <h1 className="text-2xl font-black text-slate-900 mb-2">You're invited!</h1>
        <p className="text-slate-600 mb-8 leading-relaxed">
          Join the <strong>{invite?.organization?.name}</strong> workspace as a <strong>{invite?.role}</strong>.
        </p>

        {status === 'authenticated' && session?.user?.email && session.user?.email !== invite?.email ? (
           <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left shadow-sm">
             <div className="flex items-center gap-2 mb-1 text-amber-800">
               <span className="material-symbols-outlined text-lg">warning</span>
               <span className="text-sm font-bold uppercase tracking-tight">Different Account</span>
             </div>
             <p className="text-amber-700 text-xs">
               This invite was sent to <strong className="text-amber-900">{invite?.email}</strong>. 
               You're currently logged in as <strong className="text-amber-900">{session.user?.email}</strong>.
             </p>
           </div>
        ) : null}

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-gradient-to-br from-primary to-primary-container text-white font-bold py-4 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-[0_8px_20px_-4px_rgba(var(--primary-rgb),0.5)] flex items-center justify-center gap-2"
        >
          {accepting ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
          ) : (
            <>
              {status === 'authenticated' ? 'Join Workspace Now' : 'Create Account'}
              <span className="material-symbols-outlined">arrow_forward</span>
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col gap-3">
          {status === 'authenticated' ? (
            <button 
              onClick={() => signIn(undefined, { callbackUrl: `/accept-invite?token=${token}` })} 
              className="text-primary text-sm font-semibold hover:underline"
            >
              Sign in with a different account
            </button>
          ) : (
            <div className="flex flex-col gap-1 items-center">
              <span className="text-slate-400 text-xs font-medium uppercase tracking-widest">Or join existing</span>
              <button 
                onClick={() => signIn(undefined, { callbackUrl: `/accept-invite?token=${token}` })} 
                className="text-primary text-sm font-bold hover:underline"
              >
                Sign in to your account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center" />}>
      <AcceptInviteContent />
    </Suspense>
  )
}
