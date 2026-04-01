'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

const PROVIDERS = [
  { id: 'gemini', name: 'Google Gemini', icon: 'auto_awesome', helpUrl: 'https://aistudio.google.com/app/apikey' },
  { id: 'openai', name: 'OpenAI (GPT-4o)', icon: 'psychology', helpUrl: 'https://platform.openai.com/api-keys' },
  { id: 'deepseek', name: 'Deepseek', icon: 'smart_toy', helpUrl: 'https://platform.deepseek.com/api_keys' },
]

export default function AIConfigSettings() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    provider: 'gemini',
    apiKey: '',
    isEnabled: true,
    instructions: '',
  })

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/settings/ai-config')
      const data = await res.json()
      if (data.success && data.data) {
        setConfig({
          provider: data.data.provider || 'gemini',
          apiKey: data.data.apiKey || '',
          isEnabled: data.data.isEnabled ?? true,
          instructions: data.data.instructions || '',
        })
      }
    } catch (err) {
      console.error('Failed to fetch AI config:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/ai-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      const data = await res.json()
      if (data.success) {
        toast.success('AI Configuration updated successfully')
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (err) {
      toast.error('An error occurred while saving')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm animate-pulse">
        <div className="h-6 w-48 bg-surface-container rounded mb-6"></div>
        <div className="space-y-4">
          <div className="h-10 bg-surface-container rounded w-full"></div>
          <div className="h-10 bg-surface-container rounded w-full"></div>
        </div>
      </div>
    )
  }

  const currentProvider = PROVIDERS.find(p => p.id === config.provider)

  return (
    <section className="bg-white rounded-xl p-8 shadow-sm border border-primary/10">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center gap-2 text-on-surface">
          <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
          AI Assistant Configuration
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-on-surface-variant">Enabled</span>
          <button
            onClick={() => setConfig(c => ({ ...c, isEnabled: !c.isEnabled }))}
            className={`w-10 h-6 rounded-full transition-colors relative ${config.isEnabled ? 'bg-primary' : 'bg-surface-container-high'}`}
          >
            <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${config.isEnabled ? 'translate-x-4' : ''}`} />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-3 text-on-surface">Select Provider</label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {PROVIDERS.map(provider => (
              <button
                key={provider.id}
                onClick={() => setConfig(c => ({ ...c, provider: provider.id }))}
                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left ${
                  config.provider === provider.id
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-outline-variant/30 hover:border-primary/40 text-on-surface-variant'
                }`}
              >
                <span className="material-symbols-outlined">{provider.icon}</span>
                <span className="font-bold text-sm">{provider.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-on-surface">API Key</label>
          <div className="relative">
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig(c => ({ ...c, apiKey: e.target.value }))}
              placeholder={`Enter your ${currentProvider?.name} API Key`}
              className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono pr-24"
            />
            {currentProvider?.helpUrl && (
              <a
                href={currentProvider.helpUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-primary hover:underline text-[10px] font-black uppercase tracking-widest flex items-center gap-1 bg-primary/5 px-2 py-1 rounded"
              >
                <span className="material-symbols-outlined text-xs">help</span>
                Get Key
              </a>
            )}
          </div>
          <p className="mt-2 text-[11px] text-on-surface-variant leading-relaxed">
            Your API key is encrypted and stored securely. It is only used to generate task suggestions for your organization.
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-on-surface">AI Assistant Instructions</label>
          <textarea
            value={config.instructions}
            onChange={(e) => setConfig(c => ({ ...c, instructions: e.target.value }))}
            placeholder="e.g. Always assign structural tasks to David Miller. Follow agile methodology. Break down large tasks into smaller subtasks."
            rows={4}
            className="w-full bg-surface-container-low rounded-lg px-4 py-3 text-sm border-none outline-none focus:ring-2 focus:ring-primary/40 transition-all leading-relaxed"
          />
          <p className="mt-2 text-[11px] text-on-surface-variant leading-relaxed">
            These instructions will be provided to the AI every time it generates suggestions to guide its behavior and decision-making.
          </p>
        </div>

        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 flex gap-3">
          <span className="material-symbols-outlined text-primary">info</span>
          <div className="text-xs text-on-surface-variant leading-relaxed">
            <p className="font-bold text-primary mb-1">How it works</p>
            The AI Assistant analyzes project descriptions, current tasks, and team member skills to suggest relevant next steps. It helps automate task creation and resource allocation.
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-outline-variant/10">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-8 py-3 bg-gradient-to-br from-primary to-primary-container text-white rounded-xl text-sm font-bold shadow-xl shadow-primary/20 hover:opacity-90 disabled:opacity-60 transition-all flex items-center gap-2"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm">refresh</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-sm">save</span>
                Save AI Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </section>
  )
}
