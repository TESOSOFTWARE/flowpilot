'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface SettingsLayoutProps {
  children: React.ReactNode
}

const TABS = [
  { id: 'general', label: 'General', icon: 'person_outline', desc: 'Profile & Account' },
  { id: 'workspace', label: 'Workspace', icon: 'corporate_fare', desc: 'Organization & Team' },
  { id: 'ai', label: 'AI & Automation', icon: 'auto_awesome', desc: 'Gemini, OpenAI & Telegram' },
  { id: 'customization', label: 'Customization', icon: 'dashboard_customize', desc: 'Project Custom Fields' },
  { id: 'billing', label: 'Billing & Plan', icon: 'payments', desc: 'Subscriptions & Invoices' },
  { id: 'security', label: 'Security', icon: 'lock_open', desc: 'RBAC & Governance' },
]

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const activeTab = searchParams.get('tab') || 'general'

  const setActiveTab = (id: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', id)
    router.push(`/settings?${params.toString()}`)
  }

  return (
    <div className="flex flex-col md:flex-row gap-8 pb-20">
      {/* Sidebar */}
      <aside className="w-full md:w-72 flex-shrink-0">
        <div className="sticky top-24 flex flex-col min-h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            <p className="px-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Configuration Central</p>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all group relative overflow-hidden ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]'
                    : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
                }`}
              >
                {activeTab === tab.id && (
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                )}
                <span className={`material-symbols-outlined text-[22px] transition-transform duration-500 ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110'}`}>
                  {tab.icon}
                </span>
                <div className="text-left">
                  <p className="text-sm font-bold leading-tight">{tab.label}</p>
                  <p className={`text-[10px] leading-tight mt-0.5 ${activeTab === tab.id ? 'text-white/70' : 'text-on-surface-variant opacity-60'}`}>
                    {tab.desc}
                  </p>
                </div>
                {activeTab === tab.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Support Card */}
          <div className="mt-auto pt-12 space-y-4">
            <div className="p-6 bg-gradient-to-br from-secondary/5 to-transparent rounded-3xl border border-secondary/10 relative overflow-hidden group">
              <div className="absolute -top-6 -right-6 w-24 h-24 bg-secondary/5 rounded-full blur-2xl group-hover:bg-secondary/10 transition-all" />
              <h4 className="text-xs font-black uppercase tracking-widest text-secondary mb-2 whitespace-nowrap">Need help?</h4>
              <p className="text-[11px] text-on-surface-variant leading-relaxed mb-4">
                  Our enterprise support team is available 24/7 for organization-level configurations.
              </p>
              <button className="text-[10px] font-black text-secondary hover:underline flex items-center gap-1 uppercase tracking-widest">
                  <span className="material-symbols-outlined text-sm">contact_support</span>
                  Contact Support
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Content Area */}
      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {children}
        </div>
      </main>
    </div>
  )
}
