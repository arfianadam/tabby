import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAndCacheFavicon,
  getCachedFaviconDataUrl,
} from "../utils/favicons";

export type FaviconTarget = {
  id: string;
  url: string;
};

type IconMap = Record<string, string>;

export const useFavicons = (targets: FaviconTarget[]) => {
  const [icons, setIcons] = useState<IconMap>({});
  const requestedRef = useRef<Set<string>>(new Set());

  // Drop icons for targets that no longer exist so we do not leak memory.
  useEffect(() => {
    setIcons((prev) => {
      const next: IconMap = {};
      targets.forEach((target) => {
        if (prev[target.id]) {
          next[target.id] = prev[target.id];
        }
      });
      if (Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }
      return next;
    });
    requestedRef.current.forEach((id) => {
      if (!targets.some((target) => target.id === id)) {
        requestedRef.current.delete(id);
      }
    });
  }, [targets]);

  useEffect(() => {
    if (!targets.length) {
      return;
    }

    const cachedUpdates: IconMap = {};
    const toFetch = targets.filter((target) => {
      if (!target.url || icons[target.id]) {
        return false;
      }
      const cached = getCachedFaviconDataUrl(target.url);
      if (cached) {
        cachedUpdates[target.id] = cached;
        return false;
      }
      if (requestedRef.current.has(target.id)) {
        return false;
      }
      requestedRef.current.add(target.id);
      return true;
    });

    if (Object.keys(cachedUpdates).length) {
      setIcons((prev) => ({ ...prev, ...cachedUpdates }));
    }

    if (!toFetch.length) {
      return;
    }

    let cancelled = false;
    const fetchIcons = async () => {
      const results = await Promise.allSettled(
        toFetch.map(async (target) => {
          const icon = await fetchAndCacheFavicon(target.url);
          return { id: target.id, icon };
        }),
      );

      if (cancelled) {
        return;
      }

      const updates: IconMap = {};
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.icon) {
          updates[result.value.id] = result.value.icon;
        }
      });

      if (Object.keys(updates).length) {
        setIcons((prev) => ({ ...prev, ...updates }));
      }
    };

    fetchIcons();

    return () => {
      cancelled = true;
    };
  }, [targets, icons]);

  return useMemo(() => {
    const map: Record<string, string | null> = {};
    targets.forEach((target) => {
      map[target.id] =
        icons[target.id] ?? getCachedFaviconDataUrl(target.url) ?? null;
    });
    return map;
  }, [targets, icons]);
};
