import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faArrowRightFromBracket,
  faCircleUser,
  faCloudArrowDown,
  faCloudArrowUp,
} from '@fortawesome/free-solid-svg-icons'
import type { DashboardUser } from '../Dashboard'
import { panelClass, subtleButtonClasses } from './constants'

type DashboardHeaderProps = {
  user: DashboardUser
  allowSync: boolean
  onSignOut: () => void
}

const DashboardHeader = ({ allowSync, user, onSignOut }: DashboardHeaderProps) => {
  const syncDetails = allowSync
    ? { icon: faCloudArrowUp, text: 'Synced', tone: 'text-emerald-600' }
    : { icon: faCloudArrowDown, text: 'Restoring…', tone: 'text-amber-600' }

  return (
    <header className={`${panelClass} lg:flex-row lg:items-center lg:justify-between lg:gap-6`}>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
          Synced workspace
        </p>
        <h1 className="text-2xl font-semibold text-slate-900">Tabby</h1>
        <p className="text-sm text-slate-600">Toby-style collections kept in sync with Firebase.</p>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faCircleUser} className="text-lg text-slate-400" />
          <div>
            <p className="text-sm font-medium text-slate-900">{user.email ?? 'Signed in'}</p>
            <p className={`flex items-center gap-1 text-xs ${syncDetails.tone}`}>
              <FontAwesomeIcon icon={syncDetails.icon} />
              {syncDetails.text}
            </p>
          </div>
        </div>
        <button className={subtleButtonClasses} onClick={onSignOut} type="button">
          <FontAwesomeIcon icon={faArrowRightFromBracket} className="mr-2" />
          Sign out
        </button>
      </div>
    </header>
  )
}

export default DashboardHeader
