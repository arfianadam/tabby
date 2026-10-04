import type { Collection } from "../../types.ts";

export type CollectionSyncSource = "none" | "cache" | "server";

/** Same shape as `subscribeToCollections`; returns an unsubscribe function. */
export type CollectionSnapshotSource = (
  uid: string,
  onChange: (
    collections: Collection[],
    metadata: { fromCache: boolean },
  ) => void,
  onError: (error: Error) => void,
) => () => void;

export type CollectionCache = {
  readCollections: (uid: string) => Promise<Collection[]>;
  writeCollections: (uid: string, collections: Collection[]) => Promise<void>;
};

export type CollectionSyncStatus = {
  collections: Collection[];
  source: CollectionSyncSource;
  loading: boolean;
  error: Error | null;
};

export type CollectionSyncDeps = {
  uid: string;
  snapshots: CollectionSnapshotSource;
  cache: CollectionCache;
  /** Sync permission at creation, so `loading` starts out right; nothing subscribes until `setSyncAllowed(true)`. */
  syncAllowed?: boolean;
};

export type CollectionSync = {
  getSnapshot: () => CollectionSyncStatus;
  subscribe: (listener: () => void) => () => void;
  /** Hydrates from the Workspace cache each time it becomes ready. */
  setCacheReady: (ready: boolean) => void;
  /** Starts or stops the snapshot subscription. */
  setSyncAllowed: (allowed: boolean) => void;
  stop: () => void;
};

type SyncState = {
  collections: Collection[];
  hasServerSnapshot: boolean;
  source: CollectionSyncSource;
};

type SyncEvent =
  | { type: "hydrate-cache"; collections: Collection[] }
  | { type: "snapshot"; collections: Collection[]; fromCache: boolean };

const isAuthoritative = (fromCache: boolean) => !fromCache;

const markCached = (state: SyncState): SyncState =>
  state.source === "cache" ? state : { ...state, source: "cache" };

const reduce = (state: SyncState, event: SyncEvent): SyncState => {
  if (event.type === "hydrate-cache") {
    // A server snapshot always wins over the durable cache.
    if (state.hasServerSnapshot) {
      return state;
    }
    if (state.collections.length > 0 || event.collections.length === 0) {
      return markCached(state);
    }
    return { ...state, collections: event.collections, source: "cache" };
  }

  // An empty offline snapshot never wipes collections we already have.
  if (
    event.fromCache &&
    event.collections.length === 0 &&
    state.collections.length > 0
  ) {
    return markCached(state);
  }

  return {
    collections: event.collections,
    hasServerSnapshot:
      state.hasServerSnapshot || isAuthoritative(event.fromCache),
    source: event.fromCache ? "cache" : "server",
  };
};

export const createCollectionSync = ({
  uid,
  snapshots,
  cache,
  syncAllowed = false,
}: CollectionSyncDeps): CollectionSync => {
  let state: SyncState = {
    collections: [],
    hasServerSnapshot: false,
    source: "none",
  };
  let loading = syncAllowed;
  let error: Error | null = null;
  let status: CollectionSyncStatus = {
    collections: state.collections,
    source: state.source,
    loading,
    error,
  };
  const listeners = new Set<() => void>();

  let unsubscribe: (() => void) | null = null;
  let subscription = 0;
  let cacheReady = false;
  let hydration = 0;

  const emit = () => {
    if (
      status.collections === state.collections &&
      status.source === state.source &&
      status.loading === loading &&
      status.error === error
    ) {
      return;
    }
    status = {
      collections: state.collections,
      source: state.source,
      loading,
      error,
    };
    listeners.forEach((listener) => listener());
  };

  const hydrate = async (id: number) => {
    let collections: Collection[] = [];
    try {
      collections = await cache.readCollections(uid);
    } catch {
      // an unreadable cache hydrates as empty
    }
    if (id !== hydration) {
      return;
    }
    state = reduce(state, { type: "hydrate-cache", collections });
    emit();
  };

  const writeBack = (collections: Collection[]) => {
    void cache.writeCollections(uid, collections).catch(() => {
      // best-effort cache write; ignore crypto failures
    });
  };

  const setCacheReady = (ready: boolean) => {
    if (ready === cacheReady) {
      return;
    }
    cacheReady = ready;
    hydration += 1;
    if (ready) {
      void hydrate(hydration);
    }
  };

  const setSyncAllowed = (allowed: boolean) => {
    if (!allowed) {
      if (unsubscribe) {
        subscription += 1;
        unsubscribe();
        unsubscribe = null;
      }
      loading = false;
      emit();
      return;
    }
    if (unsubscribe) {
      return;
    }

    subscription += 1;
    const id = subscription;
    loading = true;
    error = null;
    emit();
    unsubscribe = snapshots(
      uid,
      (collections, { fromCache }) => {
        if (id !== subscription) {
          return;
        }
        state = reduce(state, { type: "snapshot", collections, fromCache });
        loading = false;
        if (isAuthoritative(fromCache)) {
          writeBack(collections);
        }
        emit();
      },
      (err) => {
        if (id !== subscription) {
          return;
        }
        error = err;
        loading = false;
        emit();
      },
    );
  };

  return {
    getSnapshot: () => status,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setCacheReady,
    setSyncAllowed,
    stop: () => {
      setCacheReady(false);
      setSyncAllowed(false);
    },
  };
};
