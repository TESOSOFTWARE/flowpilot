import { auth } from '@/lib/auth'
import Link from 'next/link'
import ProfileSettings from '@/components/settings/ProfileSettings'
import CustomFieldManager from '@/components/settings/CustomFieldManager'
import AIConfigSettings from '@/components/settings/AIConfigSettings'

export default async function SettingsPage() {
  const session = await auth()
  const orgName = (session?.user as any)?.organizationName || 'Your Organization'

  return (
    <div className="p-8 space-y-8 max-w-4xl pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your workspace, profile, and billing preferences.</p>
      </div>

      {/* Profile Section (Moved up for prominence) */}
      <ProfileSettings />

      {/* Governance & RBAC */}
      <section className="bg-surface-container-low rounded-xl p-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span> 
              Governance &amp; RBAC
            </h2>
            <p className="text-sm text-on-surface-variant mt-1">Configure advanced permissions, custom roles, and security protocols.</p>
          </div>
          <Link href="/settings/administration" className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all shadow-sm flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">settings_suggest</span> Open Admin Panel
          </Link>
        </div>
      </section>

      {/* Organization */}
      <section className="bg-white rounded-xl p-8 shadow-sm">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-primary">corporate_fare</span>
          Organization
        </h2>
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-semibold mb-2">Organization Name</label>
              <input
                defaultValue={orgName}
                className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Plan Status</label>
              <div className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm flex items-center justify-between">
                <span className="font-semibold">Pro Enterprise</span>
                <span className="px-2 py-1 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">Active</span>
              </div>
            </div>
          </div>
          <button className="px-6 py-2.5 bg-primary text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
            Save Changes
          </button>
        </div>
      </section>

      {/* AI Assistant Configuration */}
      <AIConfigSettings />

      {/* Custom Fields */}
      <CustomFieldManager />

      {/* Billing */}
      <section className="bg-white rounded-xl p-8">
        <h2 className="text-xl font-bold mb-6">Billing & Plan</h2>
        <div className="p-6 bg-surface-container-low rounded-xl flex items-center justify-between mb-6">
          <div>
            <p className="text-sm font-bold text-primary">Pro Plan</p>
            <p className="text-xs text-on-surface-variant mt-1">$29/month · Up to 20 team members · All features</p>
          </div>
          <button className="px-5 py-2.5 border border-primary text-primary rounded-lg text-sm font-semibold hover:bg-primary/5 transition-all">
            Manage Subscription
          </button>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-on-surface-variant">Next billing date</span>
          <span className="font-semibold">April 22, 2026</span>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-error-container/30 rounded-xl p-8 border border-error/20">
        <h2 className="text-xl font-bold text-error mb-4">Danger Zone</h2>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Delete Organization</p>
            <p className="text-xs text-on-surface-variant">This will permanently delete all data. This action is irreversible.</p>
          </div>
          <button className="px-5 py-2.5 bg-error text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-all">
            Delete Organization
          </button>
        </div>
      </section>
    </div>
  )
}
