import { auth } from '@/lib/auth'
import SettingsLayout from '@/components/settings/SettingsLayout'
import SettingsClient from './SettingsClient'

export default async function SettingsPage() {
  const session = await auth()
  const orgName = (session?.user as any)?.organizationName || 'Your Organization'

  return (
    <div className="p-8 space-y-8 max-w-6xl pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight">Settings</h1>
        <p className="text-on-surface-variant mt-1">Manage your workspace, profile, and billing preferences.</p>
      </div>

      <SettingsLayout>
        <SettingsClient orgName={orgName} />
      </SettingsLayout>
    </div>
  )
}
