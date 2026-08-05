import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner, BannerTone } from "../components/types";
import {
  getSyncToastPlan,
  type CollectionSyncSource,
  type SyncToastKind,
} from "../syncNotification";

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
  const [syncToastVisible, setSyncToastVisible] = useState(false);
  const [syncToastShouldRender, setSyncToastShouldRender] = useState(false);
  const [syncToastKind, setSyncToastKind] =
    useState<SyncToastKind>("cache-warning");
  const [isOnline, setIsOnline] = useState(getInitialOnlineStatus);
  const cacheWarningShownRef = useRef(false);

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
    const plan = getSyncToastPlan({
      source: syncSource,
      cacheWarningShown: cacheWarningShownRef.current,
      allowSync,
      hasSyncError,
      isOnline,
      isLoading,
    });
    if (!plan) {
      if (isLoading) {
        cacheWarningShownRef.current = false;
        setSyncToastVisible(false);
      }
      return;
    }

    let hideTimeout: number | undefined;
    const showToast = () => {
      cacheWarningShownRef.current = plan.kind === "cache-warning";
      setSyncToastKind(plan.kind);
      setSyncToastShouldRender(true);
      setSyncToastVisible(true);
      hideTimeout = window.setTimeout(() => {
        setSyncToastVisible(false);
      }, 4000);
    };
    const showTimeout = window.setTimeout(showToast, plan.delayMs);

    return () => {
      window.clearTimeout(showTimeout);
      if (hideTimeout !== undefined) {
        window.clearTimeout(hideTimeout);
      }
    };
  }, [allowSync, hasSyncError, isLoading, isOnline, syncSource]);

  useEffect(() => {
    if (!banner) {
      return;
    }
    const timeout = window.setTimeout(() => {
      setBanner(null);
    }, 4000);
    return () => window.clearTimeout(timeout);
  }, [banner]);

  const notify = useCallback(
    (text: string, tone: BannerTone = "info", action?: Banner["action"]) => {
      const nextBanner: Banner = { text, tone, action };
      setRenderedBanner(nextBanner);
      setBanner(nextBanner);
    },
    [],
  );

  const handleBannerDismiss = useCallback(() => {
    setBanner(null);
  }, []);

  const handleBannerExited = useCallback(() => {
    setRenderedBanner(null);
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
    notify,
    syncToastVisible,
    syncToastShouldRender,
    syncToastKind,
    handleBannerDismiss,
    handleBannerExited,
    handleSyncToastDismiss,
    handleSyncToastExited,
  };
};
