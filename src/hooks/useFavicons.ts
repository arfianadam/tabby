import { useEffect, useMemo, useRef, useState } from "react";
import {
  fetchAndCacheFavicon,
  getCachedFaviconDataUrl,
} from "@/utils/favicons";

export type FaviconTarget = {
  id: string;
  url: string;
  faviconUrl?: string;
};

type IconMap = Record<
  string,
  { url: string; faviconUrl?: string; data: string }
>;

export const useFavicons = (targets: FaviconTarget[]) => {
  const [icons, setIcons] = useState<IconMap>({});
  const requestedRef = useRef<Map<string, string>>(new Map());

  // Drop icons for targets that no longer exist or whose URL changed.
  useEffect(() => {
    setIcons((prev) => {
      const next: IconMap = {};
      targets.forEach((target) => {
        const entry = prev[target.id];
        if (
          entry &&
          entry.url === target.url &&
          entry.faviconUrl === target.faviconUrl
        ) {
          next[target.id] = entry;
        }
      });
      if (Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }
      return next;
    });

    const currentTargetMap = new Map(
      targets.map((t) => [t.id, `${t.url}|${t.faviconUrl ?? ""}`]),
    );
    for (const [id, key] of requestedRef.current.entries()) {
      if (!currentTargetMap.has(id)) {
        requestedRef.current.delete(id);
      } else if (currentTargetMap.get(id) !== key) {
        requestedRef.current.delete(id);
      }
    }
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
      // Check cache for faviconUrl first, then main url
      const cachedCustom = target.faviconUrl
        ? getCachedFaviconDataUrl(target.faviconUrl)
        : null;
      const cachedMain = getCachedFaviconDataUrl(target.url);
      const cached = cachedCustom ?? cachedMain;
      if (cached) {
        cachedUpdates[target.id] = {
          url: target.url,
          faviconUrl: target.faviconUrl,
          data: cached,
        };
        return false;
      }
      const requestKey = `${target.url}|${target.faviconUrl ?? ""}`;
      if (requestedRef.current.get(target.id) === requestKey) {
        return false;
      }
      requestedRef.current.set(target.id, requestKey);
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
          const icon = await fetchAndCacheFavicon(
            target.url,
            target.faviconUrl,
          );
          return {
            id: target.id,
            url: target.url,
            faviconUrl: target.faviconUrl,
            icon,
          };
        }),
      );

      if (cancelled) {
        return;
      }

      const updates: IconMap = {};
      results.forEach((result) => {
        if (result.status === "fulfilled" && result.value.icon) {
          updates[result.value.id] = {
            url: result.value.url,
            faviconUrl: result.value.faviconUrl,
            data: result.value.icon,
          };
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
      const iconData = icons[target.id]?.data;
      if (iconData) {
        map[target.id] = iconData;
        return;
      }
      // Check cache for faviconUrl first, then main url
      const cachedCustom = target.faviconUrl
        ? getCachedFaviconDataUrl(target.faviconUrl)
        : null;
      map[target.id] =
        cachedCustom ?? getCachedFaviconDataUrl(target.url) ?? null;
    });
    return map;
  }, [targets, icons]);
};
