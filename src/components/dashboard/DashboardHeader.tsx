import type { DashboardUser } from '../Dashboard'
import { panelClass, subtleButtonClasses } from './constants'

type DashboardHeaderProps = {
  user: DashboardUser
  allowSync: boolean
  onSignOut: () => void
}

const DashboardHeader = ({ allowSync, user, onSignOut }: DashboardHeaderProps) => (
  <header className={`${panelClass} lg:flex-row lg:items-center lg:justify-between lg:gap-6`}>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
        Synced workspace
      </p>
      <h1 className="text-2xl font-semibold text-slate-900">Tabby</h1>
      <p className="text-sm text-slate-600">Toby-style collections kept in sync with Firebase.</p>
    </div>
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
      <div>
        <p className="text-sm font-medium text-slate-900">{user.email ?? 'Signed in'}</p>
        <p className="text-xs text-slate-500">{allowSync ? 'Synced' : 'Restoring…'}</p>
      </div>
      <button className={subtleButtonClasses} onClick={onSignOut} type="button">
        Sign out
      </button>
    </div>
  </header>
)

export default DashboardHeader
