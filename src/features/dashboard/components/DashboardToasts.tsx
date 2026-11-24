import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCloudArrowUp,
  faTriangleExclamation,
  faXmark,
} from "@/utils/uiIcons";
import type { Banner } from "./types";
import type { SyncToastKind } from "../syncNotification";
import AnimatedToast from "./AnimatedToast";
import { toastToneClasses } from "./constants";

type DashboardToastsProps = {
  banner: Banner | null;
  renderedBanner: Banner | null;
  syncToastVisible: boolean;
  syncToastShouldRender: boolean;
  syncToastKind: SyncToastKind;
  onBannerExited: () => void;
  onBannerDismiss: () => void;
  onBannerPause: (paused: boolean) => void;
  onSyncToastExited: () => void;
  onSyncToastDismiss: () => void;
};

const toastIcons = {
  info: faCircleInfo,
  success: faCircleCheck,
  danger: faCircleExclamation,
  warning: faTriangleExclamation,
} as const;

const syncToastPresentation = {
  "cache-warning": {
    icon: faTriangleExclamation,
    text: "Failed to sync. Using your last cached workspace.",
    className: toastToneClasses.warning,
  },
  "sync-success": {
    icon: faCloudArrowUp,
    text: "Workspace reconnected. Changes sync automatically.",
    className: toastToneClasses.success,
  },
} as const;

const DashboardToasts = ({
  banner,
  renderedBanner,
  syncToastVisible,
  syncToastShouldRender,
  syncToastKind,
  onBannerExited,
  onBannerDismiss,
  onBannerPause,
  onSyncToastExited,
  onSyncToastDismiss,
}: DashboardToastsProps) => {
  const syncToast = syncToastPresentation[syncToastKind];

  return renderedBanner || syncToastShouldRender ? (
    <div className="pointer-events-none fixed bottom-6 left-0 right-0 z-50 flex flex-col items-center gap-2 px-4">
      {renderedBanner && (
        <AnimatedToast isVisible={Boolean(banner)} onExited={onBannerExited}>
          <div
            role={renderedBanner.tone === "danger" ? "alert" : "status"}
            aria-live={
              renderedBanner.tone === "danger" ? "assertive" : "polite"
            }
            onMouseEnter={() => onBannerPause(true)}
            onMouseLeave={() => onBannerPause(false)}
            onFocus={() => onBannerPause(true)}
            onBlur={() => onBannerPause(false)}
            className={`flex max-w-lg items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl ${toastToneClasses[renderedBanner.tone]}`}
          >
            <FontAwesomeIcon
              icon={toastIcons[renderedBanner.tone]}
              className="shrink-0 text-base"
            />
            <span>{renderedBanner.text}</span>
            {renderedBanner.action && (
              <button
                type="button"
                className="shrink-0 cursor-pointer rounded-full border border-white/45 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                onClick={renderedBanner.action.onClick}
              >
                {renderedBanner.action.label}
              </button>
            )}
            <button
              type="button"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={onBannerDismiss}
              aria-label="Dismiss message"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </AnimatedToast>
      )}
      {syncToastShouldRender && (
        <AnimatedToast
          isVisible={syncToastVisible}
          onExited={onSyncToastExited}
        >
          <div
            role="status"
            aria-live="polite"
            className={`flex max-w-lg items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl ${syncToast.className}`}
          >
            <FontAwesomeIcon
              icon={syncToast.icon}
              className="shrink-0 text-base"
            />
            <span>{syncToast.text}</span>
            <button
              type="button"
              className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-white/85 transition hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              onClick={onSyncToastDismiss}
              aria-label="Dismiss sync status"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
        </AnimatedToast>
      )}
    </div>
  ) : null;
};

export default DashboardToasts;
