import { useEffect, useMemo, useState } from "react";
import { getCachedFavicon, resolveFavicon } from "@/utils/favicons";

export type FaviconTarget = {
  id: string;
  url: string;
  faviconUrl?: string;
};

// Settled lookups per target id. A null icon records a failed lookup so it is
// not requested again until the target's URLs change.
type ResolvedMap = Record<string, { key: string; icon: string | null }>;

const targetKey = (target: FaviconTarget) =>
  `${target.url}|${target.faviconUrl ?? ""}`;

export const useFavicons = (targets: FaviconTarget[]) => {
  const [resolved, setResolved] = useState<ResolvedMap>({});

  // Drop entries for targets that no longer exist or whose URLs changed.
  useEffect(() => {
    setResolved((prev) => {
      const next: ResolvedMap = {};
      targets.forEach((target) => {
        const entry = prev[target.id];
        if (entry && entry.key === targetKey(target)) {
          next[target.id] = entry;
        }
      });
      if (Object.keys(prev).length === Object.keys(next).length) {
        return prev;
      }
      return next;
    });
  }, [targets]);

  useEffect(() => {
    const missing = targets.filter(
      (target) =>
        target.url &&
        resolved[target.id]?.key !== targetKey(target) &&
        !getCachedFavicon(target),
    );
    if (!missing.length) {
      return;
    }

    let cancelled = false;
    Promise.all(
      missing.map(async (target) => ({
        id: target.id,
        key: targetKey(target),
        icon: await resolveFavicon(target),
      })),
    ).then((results) => {
      if (cancelled) {
        return;
      }
      setResolved((prev) => {
        const next = { ...prev };
        results.forEach(({ id, key, icon }) => {
          next[id] = { key, icon };
        });
        return next;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [targets, resolved]);

  return useMemo(() => {
    const map: Record<string, string | null> = {};
    targets.forEach((target) => {
      const entry = resolved[target.id];
      const icon = entry?.key === targetKey(target) ? entry.icon : null;
      map[target.id] = icon ?? getCachedFavicon(target);
    });
    return map;
  }, [targets, resolved]);
};
