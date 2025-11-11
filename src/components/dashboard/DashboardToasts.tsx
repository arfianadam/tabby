import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faCloudArrowUp,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import type { Banner } from "./types";
import AnimatedToast from "./AnimatedToast";
import { toastToneClasses } from "./constants";

type DashboardToastsProps = {
  banner: Banner | null;
  renderedBanner: Banner | null;
  syncToastVisible: boolean;
  syncToastShouldRender: boolean;
  onBannerExited: () => void;
  onBannerDismiss: () => void;
  onSyncToastExited: () => void;
  onSyncToastDismiss: () => void;
};

const toastIcons = {
  info: faCircleInfo,
  success: faCircleCheck,
  danger: faCircleExclamation,
} as const;

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
  renderedBanner || syncToastShouldRender ? (
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
          <div className="flex items-center gap-3 rounded-2xl bg-emerald-600/95 px-4 py-3 text-sm font-medium text-white shadow-2xl">
            <FontAwesomeIcon icon={faCloudArrowUp} className="text-base" />
            <span>Workspace reconnected. Changes sync automatically.</span>
            <button
              type="button"
              className="rounded-full p-1 text-white/80 hover:bg-emerald-500/40"
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

export default DashboardToasts;
