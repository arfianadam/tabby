import { useEffect, useState } from "react";
import type { Collection } from "@/types";
import { getCachedCollections } from "@/utils/cache/collectionsCache";

export const useCachedCollections = (
  uid: string | null,
  cacheReady: boolean,
) => {
  const [cachedCollections, setCachedCollections] = useState<Collection[]>([]);
  const [cacheLoaded, setCacheLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setCachedCollections([]);
      setCacheLoaded(false);
      return;
    }
    if (!cacheReady) {
      setCacheLoaded(false);
      return;
    }

    const loadCachedCollections = async () => {
      try {
        const data = await getCachedCollections(uid);
        if (!cancelled) {
          setCachedCollections(data);
        }
      } finally {
        if (!cancelled) {
          setCacheLoaded(true);
        }
      }
    };

    void loadCachedCollections();

    return () => {
      cancelled = true;
    };
  }, [uid, cacheReady]);

  return { cachedCollections, cacheLoaded };
};
