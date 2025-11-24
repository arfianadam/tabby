import { useCallback, useEffect, useRef, useState } from "react";
import type { Banner, BannerTone } from "../components/types";

export const useDashboardNotifications = (allowSync: boolean) => {
  const [banner, setBanner] = useState<Banner | null>(null);
  const [renderedBanner, setRenderedBanner] = useState<Banner | null>(null);
  const [syncToastVisible, setSyncToastVisible] = useState(false);
  const [syncToastShouldRender, setSyncToastShouldRender] = useState(false);
  const wasRestoringRef = useRef(!allowSync);

  useEffect(() => {
    if (!allowSync) {
      wasRestoringRef.current = true;
      setSyncToastVisible(false);
      return;
    }
    if (wasRestoringRef.current) {
      wasRestoringRef.current = false;
      setSyncToastShouldRender(true);
      setSyncToastVisible(true);
      const timeout = window.setTimeout(() => {
        setSyncToastVisible(false);
      }, 4000);
      return () => window.clearTimeout(timeout);
    }
    return;
  }, [allowSync]);

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
    handleBannerDismiss,
    handleBannerExited,
    handleSyncToastDismiss,
    handleSyncToastExited,
  };
};
