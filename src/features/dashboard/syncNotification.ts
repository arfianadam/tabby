import type { CollectionSyncSource } from "../../hooks/collectionSyncState.ts";

export type { CollectionSyncSource } from "../../hooks/collectionSyncState.ts";
export type SyncToastKind = "cache-warning" | "sync-success";

export const CACHE_WARNING_DELAY_MS = 4000;

export type SyncToastPlan = {
  kind: SyncToastKind;
  delayMs: number;
};

export const getSyncToastPlan = ({
  source,
  cacheWarningShown,
  allowSync,
  hasSyncError,
  isOnline,
  isLoading,
}: {
  source: CollectionSyncSource;
  cacheWarningShown: boolean;
  allowSync: boolean;
  hasSyncError: boolean;
  isOnline: boolean;
  isLoading: boolean;
}): SyncToastPlan | null => {
  if (isLoading) {
    return null;
  }

  if (source === "cache" && !cacheWarningShown) {
    return {
      kind: "cache-warning",
      delayMs:
        !allowSync || hasSyncError || !isOnline ? 0 : CACHE_WARNING_DELAY_MS,
    };
  }

  if (source === "server" && cacheWarningShown) {
    return { kind: "sync-success", delayMs: 0 };
  }

  return null;
};
