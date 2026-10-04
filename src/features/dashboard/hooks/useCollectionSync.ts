import { useEffect, useState, useSyncExternalStore } from "react";
import { workspaceCache } from "@/utils/cache/workspaceCache";
import { subscribeToCollections } from "../services/collections";
import { createCollectionSync } from "../collectionSync";

type UseCollectionSyncOptions = {
  uid: string;
  allowSync: boolean;
  cacheReady: boolean;
};

// Bound to one uid for its lifetime; the Dashboard remounts per user.
export const useCollectionSync = ({
  uid,
  allowSync,
  cacheReady,
}: UseCollectionSyncOptions) => {
  const [sync] = useState(() =>
    createCollectionSync({
      uid,
      snapshots: subscribeToCollections,
      cache: workspaceCache,
      syncAllowed: allowSync,
    }),
  );

  useEffect(() => {
    sync.setCacheReady(cacheReady);
    return () => sync.setCacheReady(false);
  }, [sync, cacheReady]);

  useEffect(() => {
    sync.setSyncAllowed(allowSync);
    return () => sync.setSyncAllowed(false);
  }, [sync, allowSync]);

  return useSyncExternalStore(sync.subscribe, sync.getSnapshot);
};
