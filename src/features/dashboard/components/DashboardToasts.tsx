import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCloudArrowUp,
  faTriangleExclamation,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
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
  onSyncToastExited,
  onSyncToastDismiss,
}: DashboardToastsProps) => {
  const syncToast = syncToastPresentation[syncToastKind];

  return renderedBanner || syncToastShouldRender ? (
    <div className="fixed bottom-8 left-0 right-0 z-50 flex flex-col items-center gap-2">
      {renderedBanner && (
        <AnimatedToast isVisible={Boolean(banner)} onExited={onBannerExited}>
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl ${toastToneClasses[renderedBanner.tone]}`}
          >
            <FontAwesomeIcon
              icon={toastIcons[renderedBanner.tone]}
              className="text-base"
            />
            <span>{renderedBanner.text}</span>
            {renderedBanner.action && (
              <button
                type="button"
                className="rounded-full border cursor-pointer border-white/40 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white hover:bg-white/20"
                onClick={renderedBanner.action.onClick}
              >
                {renderedBanner.action.label}
              </button>
            )}
            <button
              type="button"
              className="rounded-full p-1 hover:bg-white/20"
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
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium shadow-2xl ${syncToast.className}`}
          >
            <FontAwesomeIcon icon={syncToast.icon} className="text-base" />
            <span>{syncToast.text}</span>
            <button
              type="button"
              className="rounded-full p-1 text-white/80 hover:bg-white/20"
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
