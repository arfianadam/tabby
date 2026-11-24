import { useCallback, useEffect, useState } from "react";
import type { Banner, BannerTone } from "../components/types";
import {
  createSyncToastTracker,
  type CollectionSyncSource,
  type SyncToastKind,
} from "../syncNotification";

const DEFAULT_TOAST_DURATION_MS = 4000;
const ACTION_TOAST_DURATION_MS = 7500;

const getInitialOnlineStatus = () =>
  typeof navigator === "undefined" ? true : navigator.onLine;

export const useDashboardNotifications = (
  allowSync: boolean,
  syncSource: CollectionSyncSource,
  isLoading: boolean,
  hasSyncError: boolean,
) => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [renderedBanner, setRenderedBanner] = useState<Banner | null>(null);
  const [bannerPaused, setBannerPaused] = useState(false);
  const [syncToastVisible, setSyncToastVisible] = useState(false);
  const [syncToastShouldRender, setSyncToastShouldRender] = useState(false);
  const [syncToastKind, setSyncToastKind] =
    useState<SyncToastKind>("cache-warning");
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const [syncToasts] = useState(createSyncToastTracker);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    const step = syncToasts.next({
      source: syncSource,
      allowSync,
      hasSyncError,
      isOnline,
      isLoading,
    });
    if (!step) {
      return;
    }
    if (step.type === "hide") {
      setSyncToastVisible(false);
      return;
    }

    let hideTimeout: number | undefined;
    const showToast = () => {
      syncToasts.shown(step.kind);
      setSyncToastKind(step.kind);
      setSyncToastShouldRender(true);
      setSyncToastVisible(true);
      hideTimeout = window.setTimeout(() => {
        setSyncToastVisible(false);
      }, step.hideAfterMs);
    };
    const showTimeout = window.setTimeout(showToast, step.delayMs);

    return () => {
      window.clearTimeout(showTimeout);
      if (hideTimeout !== undefined) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [allowSync, hasSyncError, isLoading, isOnline, syncSource, syncToasts]);

  useEffect(() => {
    if (!banner || bannerPaused) {
      return;
    }
    const duration = banner.action
      ? ACTION_TOAST_DURATION_MS
      : DEFAULT_TOAST_DURATION_MS;
    const timeout = window.setTimeout(() => {
      setBanner(null);
    }, duration);
    return () => window.clearTimeout(timeout);
  }, [banner, bannerPaused]);

  const notify = useCallback(
    (text: string, tone: BannerTone = "info", action?: Banner["action"]) => {
      const nextBanner: Banner = { text, tone, action };
      setBannerPaused(false);
      setRenderedBanner(nextBanner);
      setBanner(nextBanner);
    },
    [],
  );

  const handleBannerDismiss = useCallback(() => {
    setBannerPaused(false);
    setBanner(null);
  }, []);

  const handleBannerExited = useCallback(() => {
    setRenderedBanner(null);
  }, []);

  const handleBannerPause = useCallback((paused: boolean) => {
    setBannerPaused(paused);
  }, []);

  const handleSyncToastDismiss = useCallback(() => {
    setSyncToastVisible(false);
  }, []);

  const handleSyncToastExited = useCallback(() => {
    setSyncToastShouldRender(false);
  }, []);

  return {
    banner,
    renderedBanner,
    isOnline,
    notify,
    syncToastVisible,
    syncToastShouldRender,
    syncToastKind,
    handleBannerDismiss,
    handleBannerExited,
    handleBannerPause,
    handleSyncToastDismiss,
    handleSyncToastExited,
  };
};
