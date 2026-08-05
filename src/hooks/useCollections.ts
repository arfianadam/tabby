import type { FirestoreError } from "firebase/firestore";
import { useEffect, useMemo, useReducer, useState } from "react";
import type { Collection } from "@/types";
import { subscribeToCollections } from "@/features/dashboard/services/collections";
import { setCachedCollections } from "@/utils/cache/collectionsCache";
import {
  isAuthoritativeCollectionSnapshot,
  reduceCollectionSyncState,
} from "@/hooks/collectionSyncState";

type UseCollectionsOptions = {
  initialData?: Collection[];
  initialDataLoaded?: boolean;
  cacheKey?: string;
};

export const useCollections = (
  uid: string | undefined,
  options?: UseCollectionsOptions,
) => {
  const {
    initialData = [],
    initialDataLoaded = initialData.length > 0,
    cacheKey,
  } = options ?? {};
  const [syncState, dispatch] = useReducer(reduceCollectionSyncState, {
    collections: initialData,
    hasServerSnapshot: false,
    source: initialDataLoaded ? "cache" : "none",
  });
  const [loading, setLoading] = useState(() => Boolean(uid));
  const [error, setError] = useState<FirestoreError | null>(null);

  useEffect(() => {
    if (initialDataLoaded) {
      dispatch({ type: "hydrate-cache", collections: initialData });
    }
  }, [initialData, initialDataLoaded]);

  useEffect(() => {
    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    const unsubscribe = subscribeToCollections(
      uid,
      (nextCollections: Collection[], { fromCache }) => {
        dispatch({
          type: "snapshot",
          collections: nextCollections,
          fromCache,
        });
        setLoading(false);
        if (cacheKey && isAuthoritativeCollectionSnapshot(fromCache)) {
          void setCachedCollections(cacheKey, nextCollections).catch(() => {
            // best-effort cache write; ignore crypto failures
          });
        }
      },
      (err: FirestoreError) => {
        setError(err);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [uid, cacheKey]);

  const derivedLoading = useMemo(() => (uid ? loading : false), [uid, loading]);

  return {
    collections: syncState.collections,
    syncSource: syncState.source,
    loading: derivedLoading,
    error,
  };
};
