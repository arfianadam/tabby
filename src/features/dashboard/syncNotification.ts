import type { CollectionSyncSource } from "./collectionSync.ts";

export type { CollectionSyncSource } from "./collectionSync.ts";
export type SyncToastKind = "cache-warning" | "sync-success";

export const CACHE_WARNING_DELAY_MS = 4000;
export const SYNC_TOAST_HIDE_MS = 4000;

export type SyncToastPlan = {
  kind: SyncToastKind;
  delayMs: number;
};

export type SyncToastConditions = {
  source: CollectionSyncSource;
  allowSync: boolean;
  hasSyncError: boolean;
  isOnline: boolean;
  isLoading: boolean;
};

export const getSyncToastPlan = ({
  source,
  cacheWarningShown,
  allowSync,
  hasSyncError,
  isOnline,
  isLoading,
}: SyncToastConditions & {
  cacheWarningShown: boolean;
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

export type SyncToastStep =
  | (SyncToastPlan & { type: "show"; hideAfterMs: number })
  | { type: "hide" }
  | null;

export type SyncToastTracker = {
  /** What the sync toast should do now; loading forgets a shown cache warning. */
  next: (conditions: SyncToastConditions) => SyncToastStep;
  /** Records that a planned toast actually appeared. */
  shown: (kind: SyncToastKind) => void;
};

export const createSyncToastTracker = (): SyncToastTracker => {
  let cacheWarningShown = false;

  return {
    next: (conditions) => {
      const plan = getSyncToastPlan({ ...conditions, cacheWarningShown });
      if (plan) {
        return { type: "show", ...plan, hideAfterMs: SYNC_TOAST_HIDE_MS };
      }
      if (conditions.isLoading) {
        cacheWarningShown = false;
        return { type: "hide" };
      }
      return null;
    },
    shown: (kind) => {
      cacheWarningShown = kind === "cache-warning";
    },
  };
};
