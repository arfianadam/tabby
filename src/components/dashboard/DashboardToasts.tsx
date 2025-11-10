import type { Banner } from '../Dashboard'
import AnimatedToast from './AnimatedToast'
import { toastToneClasses } from './constants'

type DashboardToastsProps = {
  banner: Banner | null
  renderedBanner: Banner | null
  syncToastVisible: boolean
  syncToastShouldRender: boolean
  onBannerExited: () => void
  onBannerDismiss: () => void
  onSyncToastExited: () => void
  onSyncToastDismiss: () => void
}

const DashboardToasts = ({
  banner,
  renderedBanner,
  syncToastVisible,
  syncToastShouldRender,
  onBannerExited,
  onBannerDismiss,
  onSyncToastExited,
  onSyncToastDismiss,
}: DashboardToastsProps) =>
  (renderedBanner || syncToastShouldRender) ? (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-2">
      {renderedBanner && (
        <AnimatedToast isVisible={Boolean(banner)} onExited={onBannerExited}>
          <div
            className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl ${toastToneClasses[renderedBanner.tone]}`}
          >
            <span>{renderedBanner.text}</span>
            <button
              type="button"
              className="rounded-full p-1 hover:bg-white/20"
              onClick={onBannerDismiss}
              aria-label="Dismiss message"
            >
              ×
            </button>
          </div>
        </AnimatedToast>
      )}
      {syncToastShouldRender && (
        <AnimatedToast isVisible={syncToastVisible} onExited={onSyncToastExited}>
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
            <span>Workspace reconnected. Changes sync automatically.</span>
            <button
              type="button"
              className="rounded-full p-1 text-white/80 hover:bg-emerald-500/40"
              onClick={onSyncToastDismiss}
              aria-label="Dismiss sync status"
            >
              ×
            </button>
          </div>
        </AnimatedToast>
      )}
    </div>
  ) : null

export default DashboardToasts
