'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ProfileSettings from '@/components/settings/ProfileSettings'
import CustomFieldManager from '@/components/settings/CustomFieldManager'
import AIConfigSettings from '@/components/settings/AIConfigSettings'
import NotificationSettings from '@/components/settings/NotificationSettings'

interface SettingsClientProps {
  orgName: string
}

export default function SettingsClient({ orgName }: SettingsClientProps) {
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'

  return (
    <div className="space-y-8">
      {activeTab === 'general' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <ProfileSettings />
        </div>
      )}

      {activeTab === 'workspace' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Organization */}
          <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">corporate_fare</span>
              Organization
            </h2>
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-on-surface">Organization Name</label>
                  <input
                    defaultValue={orgName}
                    className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-medium"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2 text-on-surface">Plan Status</label>
                  <div className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm flex items-center justify-between">
                    <span className="font-bold text-primary">Pro Enterprise</span>
                    <span className="px-2 py-1 rounded bg-secondary text-white text-[10px] font-bold uppercase tracking-wider">Active</span>
                  </div>
                </div>
              </div>
              <button className="px-8 py-2.5 bg-primary text-white rounded-lg text-sm font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20">
                Save Changes
              </button>
            </div>
          </section>

          {/* Governance & RBAC */}
          <section className="bg-surface-container-low rounded-xl p-8 border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-primary">security</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
                  <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>security</span> 
                  Governance &amp; RBAC
                </h2>
                <p className="text-sm text-on-surface-variant mt-1 font-medium max-w-md">Configure advanced permissions, custom roles, and security protocols for your entire team.</p>
              </div>
              <Link href="/settings/administration" className="px-6 py-3 bg-white text-primary border border-primary/20 rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all shadow-sm flex items-center gap-2 whitespace-nowrap">
                <span className="material-symbols-outlined text-sm">settings_suggest</span> Open Admin Panel
              </Link>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'ai' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <AIConfigSettings />
          <NotificationSettings />
        </div>
      )}

      {activeTab === 'customization' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <CustomFieldManager />
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/5">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-on-surface">
              <span className="material-symbols-outlined text-primary">payments</span>
              Billing & Plan
            </h2>
            <div className="p-8 bg-gradient-to-br from-primary/5 to-transparent rounded-2xl border border-primary/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <p className="text-sm font-black text-primary uppercase tracking-widest">Pro Plan</p>
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[10px] font-black rounded uppercase">Current</span>
                </div>
                <p className="text-2xl font-black text-on-surface mb-1">$29<span className="text-base font-medium text-on-surface-variant">/month</span></p>
                <p className="text-xs text-on-surface-variant font-medium">Up to 20 team members · All premium features · Unlimited projects</p>
              </div>
              <button className="px-8 py-3 bg-white border-2 border-primary text-primary rounded-xl text-sm font-bold hover:bg-primary hover:text-white transition-all shadow-sm active:scale-95">
                Manage Subscription
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Next Billing Date</span>
                <span className="text-sm font-bold text-on-surface">April 22, 2026</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl">
                <span className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Payment Method</span>
                <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">credit_card</span>
                  Visa •••• 4242
                </span>
              </div>
            </div>
          </section>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Danger Zone */}
          <section className="bg-error/5 rounded-xl p-8 border border-error/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="material-symbols-outlined text-8xl text-error">delete_forever</span>
            </div>
            <h2 className="text-xl font-bold text-error mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">warning</span>
              Enterprise Danger Zone
            </h2>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
              <div>
                <p className="text-sm font-bold text-on-surface mb-1 text-on-surface">Delete Organization</p>
                <p className="text-xs text-on-surface-variant font-medium max-w-md">This will permanently delete everything associated with **{orgName}**, including all projects, tasks, activities, and team members. This action is irreversible.</p>
              </div>
              <button className="px-8 py-3 bg-white text-error border border-error/20 hover:bg-error hover:text-white font-bold rounded-xl transition-all shadow-sm whitespace-nowrap active:scale-95">
                Delete Organization
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
