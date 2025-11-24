import { useEffect, useState } from "react";
import type { Collection } from "@/types";
import { getCachedCollections } from "@/utils/cache/collectionsCache";

export const useCachedCollections = (
  uid: string | null,
  cacheReady: boolean,
) => {
  const [cachedCollections, setCachedCollections] = useState<Collection[]>([]);

  useEffect(() => {
    let cancelled = false;
    if (!uid) {
      setCachedCollections([]);
      return;
    }
    if (!cacheReady) {
      return;
    }

    const loadCachedCollections = async () => {
      const data = await getCachedCollections(uid);
      if (!cancelled) {
        setCachedCollections(data);
      }
    };

    void loadCachedCollections();

    return () => {
      cancelled = true;
    };
  }, [uid, cacheReady]);

  return { cachedCollections };
};
