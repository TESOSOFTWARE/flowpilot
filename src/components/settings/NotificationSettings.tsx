'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

export default function NotificationSettings() {
  const [showToken, setShowToken] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testingReport, setTestingReport] = useState(false)
  const [loadingTests, setLoadingTests] = useState<Record<string, boolean>>({})
  const [selectedTestType, setSelectedTestType] = useState<'DAILY' | 'WEEKLY' | 'MONTHLY'>('DAILY')
  const [config, setConfig] = useState({
    botToken: '',
    chatId: '',
    dailyReport: false,
    dailyTime: '09:00',
    weeklyReport: false,
    weeklyDay: 1,
    weeklyTime: '09:00',
    monthlyReport: false,
    monthlyDay: 1,
    monthlyTime: '09:00',
    remindersEnabled: true,
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/notifications')
      const data = await res.json()
      if (data.success && data.data) {
        setConfig({
          botToken: data.data.botToken || '',
          chatId: data.data.chatId || '',
          dailyReport: data.data.dailyReport ?? false,
          dailyTime: data.data.dailyTime || '09:00',
          weeklyReport: data.data.weeklyReport ?? false,
          weeklyDay: data.data.weeklyDay ?? 1,
          weeklyTime: data.data.weeklyTime || '09:00',
          monthlyReport: data.data.monthlyReport ?? false,
          monthlyDay: data.data.monthlyDay ?? 1,
          monthlyTime: data.data.monthlyTime || '09:00',
          remindersEnabled: data.data.remindersEnabled ?? true,
        })
      }
    } catch (err) {
      console.error('Failed to fetch notification config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (isSchedule = false) => {
    if (isSchedule) setSavingSchedule(true)
    else setSaving(true)
    
    try {
      const res = await fetch('/api/settings/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(isSchedule ? 'Reporting schedule updated' : 'Integration settings saved')
        // Refresh config to ensure we have latest IDs and values
        await fetchConfig()
      } else {
        toast.error(data.error || 'Failed to save settings')
      }
    } catch (err: any) {
      console.error('Save error:', err)
      toast.error('Connection error: ' + (err.message || 'Check terminal logs'))
    } finally {
      setSaving(false)
      setSavingSchedule(false)
    }
  }

  const handleTestMessage = async () => {
    if (!config.botToken || !config.chatId) {
      toast.error('Please provide Bot Token and Chat ID first')
      return
    }
    setTesting(true)
    try {
      const res = await fetch('/api/settings/notifications/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ botToken: config.botToken, chatId: config.chatId }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('Test message sent to Telegram!')
      } else {
        toast.error(data.error || 'Failed to send test message')
      }
    } catch (err) {
      toast.error('Connection failed')
    } finally {
      setTesting(false)
    }
  }
  const handleTestReport = async (typeOverride?: 'DAILY' | 'WEEKLY' | 'MONTHLY') => {
    if (!config.botToken || !config.chatId) {
      toast.error('Please provide Bot Token and Chat ID first')
      return
    }
    const reportType = typeOverride || selectedTestType
    setTestingReport(true)
    setLoadingTests(prev => ({ ...prev, [reportType]: true }))
    
    try {
      const res = await fetch('/api/settings/notifications/test-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
        botToken: config.botToken, 
        chatId: config.chatId,
        remindersEnabled: config.remindersEnabled,
        reportType
      }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`${reportType} Report sent to Telegram!`)
      } else {
        toast.error(data.error || 'Failed to generate test report')
      }
    } catch (err) {
      toast.error('AI Processing error')
    } finally {
      setTestingReport(false)
      setLoadingTests(prev => ({ ...prev, [reportType]: false }))
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-surface-container rounded mb-6"></div>
        <div className="space-y-6">
          <div className="h-12 bg-surface-container rounded-lg w-full"></div>
          <div className="h-12 bg-surface-container rounded-lg w-full"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-20 bg-surface-container rounded-lg"></div>
            <div className="h-20 bg-surface-container rounded-lg"></div>
            <div className="h-20 bg-surface-container rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Telegram Bot Config */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5">
            <span className="material-symbols-outlined text-8xl text-primary">send</span>
        </div>
        
        <div className="flex items-center justify-between mb-8 relative z-10">
          <h2 className="text-xl font-bold flex items-center gap-3 text-on-surface">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
               <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>send</span>
            </div>
            Telegram Bot Integration
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10 mb-8">
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Bot Token</label>
              <div className="relative group/input">
                <input
                  type={showToken ? "text" : "password"}
                  value={config.botToken}
                  onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                  placeholder="123456789:ABCDE..."
                  className="w-full bg-surface-container-low rounded-2xl px-5 py-4 text-sm border-2 border-transparent outline-none focus:border-primary/20 focus:bg-white transition-all font-mono pr-14 shadow-sm"
                />
                <button 
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-all text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-xl">
                    {showToken ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed opacity-70">
                Obtain this from <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-primary font-bold hover:underline">@BotFather</a> on Telegram.
              </p>
            </div>
            <div>
              <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-3">Chat ID</label>
              <input
                type="text"
                value={config.chatId}
                onChange={(e) => setConfig(prev => ({ ...prev, chatId: e.target.value }))}
                placeholder="-100123456789"
                className="w-full bg-surface-container-low rounded-2xl px-5 py-4 text-sm border-2 border-transparent outline-none focus:border-primary/20 focus:bg-white transition-all font-mono shadow-sm"
              />
              <p className="mt-2 text-[10px] text-on-surface-variant leading-relaxed opacity-70">
                The ID of the group or private chat where reports will be sent.
              </p>
            </div>
          </div>

          <div className="bg-surface-container-low/50 rounded-2xl p-6 border border-outline-variant/10 shadow-sm">
             <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined text-lg">info</span>
                Setup Guide
             </h3>
             <ul className="text-[11px] space-y-3 text-on-surface-variant font-medium">
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">1</span>
                  Create group and add bot as admin.
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">2</span>
                  Send <code>/id</code> to get your Chat ID.
                </li>
                <li className="flex gap-2">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">3</span>
                  Verify bot can send messages.
                </li>
             </ul>
             <div className="mt-6">
               <button 
                  onClick={handleTestMessage}
                  disabled={testing || !config.botToken || !config.chatId}
                  className="w-full py-3 bg-white border-2 border-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
               >
                  {testing ? (
                      <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                  ) : (
                      <span className="material-symbols-outlined text-sm">notifications_active</span>
                  )}
                  {testing ? 'Sending...' : 'Send Test Ping'}
               </button>
             </div>
          </div>
        </div>

        <div className="flex justify-end pt-6 border-t border-outline-variant/10 relative z-10">
          <button 
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {saving ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
            Save Bot Integration
          </button>
        </div>
      </section>

      {/* Automated Reports */}
      <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/10">
        <h2 className="text-xl font-bold flex items-center gap-3 text-on-surface mb-8">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary shadow-inner">
               <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>assessment</span>
            </div>
            Automated Reporting Schedules
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[
            { id: 'dailyReport', label: 'Daily Reports', icon: 'today', desc: "Today's progress and blockers." },
            { id: 'weeklyReport', label: 'Weekly Reports', icon: 'date_range', desc: 'Project status and high-level metrics.' },
            { id: 'monthlyReport', label: 'Monthly Reports', icon: 'calendar_month', desc: 'Strategic overview and budget.' },
          ].map((report) => (
            <div key={report.id} 
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col gap-4 cursor-pointer relative overflow-hidden ${
                config[report.id as keyof typeof config]
                  ? 'border-secondary bg-secondary/5 ring-4 ring-secondary/5'
                  : 'border-outline-variant/20 hover:border-secondary/40 group bg-surface-container-lowest'
              }`}
              onClick={() => {
                setConfig(prev => ({ ...prev, [report.id]: !prev[report.id as keyof typeof config] }))
                setSelectedTestType(report.id.replace('Report', '').toUpperCase() as any)
              }}
            >
              <div className="flex justify-between items-center">
                 <span className={`material-symbols-outlined text-2xl ${config[report.id as keyof typeof config] ? 'text-secondary' : 'text-on-surface-variant opacity-40'}`}>
                    {report.icon}
                 </span>
                 <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${config[report.id as keyof typeof config] ? 'bg-secondary border-secondary' : 'border-outline-variant/30 group-hover:border-secondary/40'}`}>
                    {config[report.id as keyof typeof config] && <span className="material-symbols-outlined text-[10px] text-white font-black">check</span>}
                 </div>
              </div>
              <div>
                <p className="font-bold text-sm text-on-surface mb-1">{report.label}</p>
                <p className="text-[10px] text-on-surface-variant font-semibold leading-relaxed mb-4">{report.desc}</p>
                
                {config[report.id as keyof typeof config] && (
                  <div className="space-y-4 pt-4 border-t border-secondary/10 mt-2">
                    {report.id === 'weeklyReport' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-secondary uppercase tracking-widest pl-1">Day of week</label>
                        <select 
                          value={config.weeklyDay}
                          onChange={(e) => setConfig(prev => ({ ...prev, weeklyDay: parseInt(e.target.value) }))}
                          className="w-full bg-white rounded-xl px-3 py-2.5 text-[11px] border border-secondary/20 outline-none font-bold text-secondary shadow-sm"
                        >
                          <option value={1}>Monday</option>
                          <option value={2}>Tuesday</option>
                          <option value={3}>Wednesday</option>
                          <option value={4}>Thursday</option>
                          <option value={5}>Friday</option>
                          <option value={6}>Saturday</option>
                          <option value={0}>Sunday</option>
                        </select>
                      </div>
                    )}
                    {report.id === 'monthlyReport' && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-secondary uppercase tracking-widest pl-1">Day of month</label>
                        <input 
                          type="number"
                          min={1}
                          max={31}
                          value={config.monthlyDay}
                          onChange={(e) => setConfig(prev => ({ ...prev, monthlyDay: parseInt(e.target.value) }))}
                          className="w-full bg-white rounded-xl px-3 py-2.5 text-[11px] border border-secondary/20 outline-none font-bold text-secondary shadow-sm"
                        />
                        <p className="text-[8px] text-secondary/60 mt-1 pl-1 italic font-medium leading-tight">
                           * Days 29-31 will fallback to the month's last day if shorter.
                        </p>
                      </div>
                    )}
                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-secondary uppercase tracking-widest pl-1">Schedule Time</label>
                        <input 
                          type="time"
                          value={(config as any)[report.id.replace('Report', 'Time')]}
                          onChange={(e) => setConfig(prev => ({ ...prev, [report.id.replace('Report', 'Time')]: e.target.value }))}
                          className="w-full bg-white rounded-xl px-3 py-2.5 text-[11px] border border-secondary/20 outline-none font-bold text-secondary shadow-sm"
                        />
                    </div>

                    <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         handleTestReport(report.id.replace('Report', '').toUpperCase() as any);
                       }}
                       disabled={loadingTests[report.id.replace('Report', '').toUpperCase()] || !config.botToken || !config.chatId}
                       className="w-full py-2.5 bg-secondary/10 border border-secondary/20 text-secondary rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-secondary/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 group shadow-sm mt-2"
                    >
                       {loadingTests[report.id.replace('Report', '').toUpperCase()] ? (
                           <span className="material-symbols-outlined animate-spin text-[10px]">refresh</span>
                       ) : (
                           <span className="material-symbols-outlined text-[10px] group-hover:scale-110 transition-transform">{config.remindersEnabled ? 'auto_awesome' : 'send'}</span>
                       )}
                       {loadingTests[report.id.replace('Report', '').toUpperCase()] ? 'Processing...' : (config.remindersEnabled ? `Test ${report.id.replace('Report', '').toUpperCase()} AI Report` : `Test ${report.id.replace('Report', '').toUpperCase()} Auto`)}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Intelligence Controls & Actions */}
        <div className="mt-8 space-y-6">
           {/* Smart Mode Preview Frame */}
           <div className="p-5 bg-secondary/5 rounded-2xl border-2 border-dashed border-secondary/10 shadow-inner">
              <div className="flex items-start gap-4">
                 <div className={`w-11 h-5 rounded-full transition-all relative cursor-pointer flex-shrink-0 mt-1.5 shadow-inner ${config.remindersEnabled ? 'bg-secondary' : 'bg-surface-container-high'}`}
                      onClick={() => setConfig(prev => ({ ...prev, remindersEnabled: !prev.remindersEnabled }))}>
                    <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-md transition-transform ${config.remindersEnabled ? 'translate-x-6' : ''}`} />
                 </div>
                 <div className="space-y-1">
                    <h3 className="text-sm font-black flex items-center gap-2 text-on-surface">
                       AI-Enhanced Summaries
                       {config.remindersEnabled && <span className="px-1.5 py-0.5 bg-secondary/10 text-secondary text-[9px] font-black rounded uppercase tracking-tighter">Smart Mode</span>}
                    </h3>
                    <p className="text-[11px] text-on-surface-variant font-medium leading-relaxed opacity-70">
                       {config.remindersEnabled 
                         ? "AI generates high-level project health summaries and strategic next steps." 
                         : "Standard reports only contain basic task status and progress data."}
                    </p>
                 </div>
              </div>
              
              {config.remindersEnabled && (
                <div className="mt-4 pt-4 border-t border-secondary/10">
                   <div className="px-4 py-3 bg-secondary/5 rounded-xl flex items-center gap-3 border border-secondary/10">
                      <span className="material-symbols-outlined text-secondary text-sm">payments</span>
                      <p className="text-[10px] text-secondary/80 font-bold leading-relaxed">
                        Intelligence features involve AI token usage based on your configured provider settings. 
                        Ensure your API key has sufficient quota.
                      </p>
                   </div>
                </div>
              )}
           </div>

           {/* Global Save Action */}
           <div className="flex justify-end pt-6 border-t border-outline-variant/10 relative z-10 mt-4">
              <button 
                onClick={() => handleSave(true)}
                disabled={savingSchedule}
                className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
              >
                {savingSchedule ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                Save All Reporting Schedules
              </button>
           </div>
        </div>
      </section>
    </div>
  )
}
