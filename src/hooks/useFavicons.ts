import { useEffect, useMemo, useRef, useState } from "react";
import {
  getCachedFavicon,
  resolveFavicon,
  withSiblingFaviconUrls,
} from "@/utils/favicons";

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

export const useFavicons = (list: FaviconTarget[]) => {
  const targets = useMemo(() => withSiblingFaviconUrls(list), [list]);
  const [resolved, setResolved] = useState<ResolvedMap>({});
  const inFlightKeysRef = useRef<Set<string>>(new Set());

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

  // Resolve each uncached target independently so fast hosts paint immediately
  // without waiting behind slow or hanging domains.
  useEffect(() => {
    const missing = targets.filter((target) => {
      const key = targetKey(target);
      const flightKey = `${target.id}::${key}`;
      return (
        target.url &&
        resolved[target.id]?.key !== key &&
        !getCachedFavicon(target) &&
        !inFlightKeysRef.current.has(flightKey)
      );
    });
    if (!missing.length) {
      return;
    }

    let cancelled = false;
    missing.forEach((target) => {
      const key = targetKey(target);
      const flightKey = `${target.id}::${key}`;
      inFlightKeysRef.current.add(flightKey);
      void resolveFavicon(target)
        .then((icon) => {
          if (cancelled) {
            return;
          }
          setResolved((prev) => {
            if (
              prev[target.id]?.key === key &&
              prev[target.id]?.icon === icon
            ) {
              return prev;
            }
            return {
              ...prev,
              [target.id]: { key, icon },
            };
          });
        })
        .finally(() => {
          inFlightKeysRef.current.delete(flightKey);
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
