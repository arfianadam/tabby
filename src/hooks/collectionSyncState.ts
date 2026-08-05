import type { Collection } from "@/types";

export type CollectionSyncSource = "none" | "cache" | "server";

export type CollectionSyncState = {
  collections: Collection[];
  hasServerSnapshot: boolean;
  source: CollectionSyncSource;
};

export type CollectionSyncEvent =
  | { type: "hydrate-cache"; collections: Collection[] }
  | {
      type: "snapshot";
      collections: Collection[];
      fromCache: boolean;
    };

export const isAuthoritativeCollectionSnapshot = (fromCache: boolean) =>
  !fromCache;

export const reduceCollectionSyncState = (
  state: CollectionSyncState,
  event: CollectionSyncEvent,
): CollectionSyncState => {
  if (event.type === "hydrate-cache") {
    if (state.hasServerSnapshot) {
      return state;
    }

    if (state.collections.length > 0 || event.collections.length === 0) {
      return state.source === "cache" ? state : { ...state, source: "cache" };
    }

    return {
      ...state,
      collections: event.collections,
      source: "cache",
    };
  }

  if (
    event.fromCache &&
    event.collections.length === 0 &&
    state.collections.length > 0
  ) {
    return state.source === "cache" ? state : { ...state, source: "cache" };
  }

  return {
    collections: event.collections,
    hasServerSnapshot:
      state.hasServerSnapshot ||
      isAuthoritativeCollectionSnapshot(event.fromCache),
    source: event.fromCache ? "cache" : "server",
  };
};
