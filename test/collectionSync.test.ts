import assert from "node:assert/strict";
import test from "node:test";
import type { Collection } from "../src/types.ts";
import {
  createCollectionSync,
  type CollectionCache,
  type CollectionSnapshotSource,
  type CollectionSyncStatus,
} from "../src/features/dashboard/collectionSync.ts";
import {
  createSyncToastTracker,
  type SyncToastConditions,
} from "../src/features/dashboard/syncNotification.ts";
import {
  createMemoryStorage,
  createWorkspaceCache,
} from "../src/utils/cache/workspaceCache.ts";

const UID = "alice";

const collection = (id: string): Collection => ({
  id,
  name: `Collection ${id}`,
  createdAt: 1,
  updatedAt: 1,
  folders: [],
});

const CACHED = [collection("cached")];
const SERVER = [collection("server")];

type Subscription = {
  uid: string;
  onChange: Parameters<CollectionSnapshotSource>[1];
  onError: Parameters<CollectionSnapshotSource>[2];
  active: boolean;
};

const scriptedSource = () => {
  const subscriptions: Subscription[] = [];
  const source: CollectionSnapshotSource = (uid, onChange, onError) => {
    const subscription = { uid, onChange, onError, active: true };
    subscriptions.push(subscription);
    return () => {
      subscription.active = false;
    };
  };
  const current = () => {
    const subscription = subscriptions.at(-1);
    assert.ok(subscription, "expected a snapshot subscription");
    return subscription;
  };
  return {
    source,
    subscriptions,
    active: () => subscriptions.filter((s) => s.active).length,
    snapshot: (collections: Collection[], fromCache: boolean) =>
      current().onChange(collections, { fromCache }),
    fail: (error: Error) => current().onError(error),
  };
};

const fakeCache = (stored: Collection[] = []) => {
  const writes: Collection[][] = [];
  let pending: ((collections: Collection[]) => void) | null = null;
  const cache: CollectionCache & {
    writes: Collection[][];
    deferReads: boolean;
    failWrites: boolean;
    failReads: boolean;
    resolveRead: () => void;
  } = {
    writes,
    deferReads: false,
    failWrites: false,
    failReads: false,
    readCollections: (uid) => {
      assert.equal(uid, UID);
      if (cache.failReads) {
        return Promise.reject(new Error("read failed"));
      }
      if (cache.deferReads) {
        return new Promise((resolve) => {
          pending = resolve;
        });
      }
      return Promise.resolve(stored);
    },
    writeCollections: (uid, collections) => {
      assert.equal(uid, UID);
      writes.push(collections);
      return cache.failWrites
        ? Promise.reject(new Error("write failed"))
        : Promise.resolve();
    },
    resolveRead: () => {
      assert.ok(pending, "expected a pending cache read");
      pending(stored);
      pending = null;
    },
  };
  return cache;
};

const flush = () => new Promise((resolve) => setImmediate(resolve));

const waitFor = async (predicate: () => boolean | Promise<boolean>) => {
  for (let attempt = 0; attempt < 200; attempt += 1) {
    if (await predicate()) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1));
  }
  assert.fail("condition never became true");
};

const setup = (
  options: { stored?: Collection[]; syncAllowed?: boolean } = {},
) => {
  const snapshots = scriptedSource();
  const cache = fakeCache(options.stored);
  const sync = createCollectionSync({
    uid: UID,
    snapshots: snapshots.source,
    cache,
    syncAllowed: options.syncAllowed,
  });
  const status = () => sync.getSnapshot();
  return { snapshots, cache, sync, status };
};

const pick = ({
  collections,
  source,
  loading,
  error,
}: CollectionSyncStatus) => ({
  collections,
  source,
  loading,
  error,
});

test("cold start shows cached collections without subscribing until sync is allowed", async () => {
  const { snapshots, cache, sync, status } = setup({ stored: CACHED });
  assert.deepEqual(pick(status()), {
    collections: [],
    source: "none",
    loading: false,
    error: null,
  });

  sync.setCacheReady(true);
  await flush();
  assert.deepEqual(pick(status()), {
    collections: CACHED,
    source: "cache",
    loading: false,
    error: null,
  });
  assert.equal(snapshots.subscriptions.length, 0);

  sync.setSyncAllowed(true);
  assert.equal(snapshots.subscriptions.length, 1);
  assert.equal(snapshots.subscriptions[0].uid, UID);
  assert.equal(status().loading, true);
  assert.deepEqual(status().collections, CACHED);

  snapshots.snapshot(SERVER, false);
  assert.deepEqual(pick(status()), {
    collections: SERVER,
    source: "server",
    loading: false,
    error: null,
  });
  assert.deepEqual(cache.writes, [SERVER]);
});

test("loading starts true when created with sync allowed, before any subscription", () => {
  const { snapshots, sync, status } = setup({ syncAllowed: true });
  assert.equal(status().loading, true);
  assert.equal(snapshots.subscriptions.length, 0);

  sync.setSyncAllowed(true);
  assert.equal(snapshots.subscriptions.length, 1);
  assert.equal(status().loading, true);
});

test("a late cache hydrate never overrides a server snapshot", async () => {
  const { snapshots, cache, sync, status } = setup({
    stored: CACHED,
    syncAllowed: true,
  });
  cache.deferReads = true;
  sync.setSyncAllowed(true);
  sync.setCacheReady(true);

  snapshots.snapshot([], false);
  cache.resolveRead();
  await flush();

  assert.deepEqual(status().collections, []);
  assert.equal(status().source, "server");
});

test("an empty offline snapshot after hydrating keeps the cached collections", async () => {
  const { snapshots, cache, sync, status } = setup({
    stored: CACHED,
    syncAllowed: true,
  });
  sync.setCacheReady(true);
  sync.setSyncAllowed(true);
  await flush();

  snapshots.snapshot([], true);
  assert.deepEqual(status().collections, CACHED);
  assert.equal(status().source, "cache");
  assert.equal(status().loading, false);
  assert.deepEqual(cache.writes, []);

  snapshots.snapshot([], false);
  assert.deepEqual(
    status().collections,
    [],
    "server deletion is authoritative",
  );
  assert.equal(status().source, "server");
  assert.deepEqual(cache.writes, [[]]);
});

test("retained server data is marked cached when connectivity is lost", () => {
  const { snapshots, sync, status } = setup({ syncAllowed: true });
  sync.setSyncAllowed(true);

  snapshots.snapshot(SERVER, false);
  snapshots.snapshot([], true);
  assert.deepEqual(status().collections, SERVER);
  assert.equal(status().source, "cache");

  snapshots.snapshot(SERVER, false);
  assert.equal(status().source, "server");
});

test("only server snapshots are written back to the cache", () => {
  const { snapshots, cache, sync, status } = setup({ syncAllowed: true });
  sync.setSyncAllowed(true);

  snapshots.snapshot(CACHED, true);
  assert.deepEqual(status().collections, CACHED);
  assert.equal(status().source, "cache");
  assert.deepEqual(cache.writes, []);

  snapshots.snapshot(SERVER, false);
  snapshots.snapshot(CACHED, true);
  snapshots.snapshot(CACHED, false);
  assert.deepEqual(cache.writes, [SERVER, CACHED]);
});

test("cache write failures are swallowed", async () => {
  const { snapshots, cache, sync, status } = setup({ syncAllowed: true });
  cache.failWrites = true;
  sync.setSyncAllowed(true);

  snapshots.snapshot(SERVER, false);
  await flush();
  assert.deepEqual(status().collections, SERVER);
  assert.equal(cache.writes.length, 1);
});

test("an empty cache still marks the workspace as cache-backed", async () => {
  const { snapshots, sync, status } = setup();
  sync.setCacheReady(true);
  await flush();
  assert.deepEqual(pick(status()), {
    collections: [],
    source: "cache",
    loading: false,
    error: null,
  });

  sync.setSyncAllowed(true);
  snapshots.snapshot(SERVER, false);
  sync.setCacheReady(false);
  sync.setCacheReady(true);
  await flush();
  assert.equal(status().source, "server");
});

test("an unreadable cache hydrates as empty", async () => {
  const { cache, sync, status } = setup({ stored: CACHED });
  cache.failReads = true;
  sync.setCacheReady(true);
  await flush();
  assert.deepEqual(status().collections, []);
  assert.equal(status().source, "cache");
});

test("the cache becoming unready cancels a pending hydrate", async () => {
  const { cache, sync, status } = setup({ stored: CACHED });
  cache.deferReads = true;
  sync.setCacheReady(true);
  sync.setCacheReady(false);
  cache.resolveRead();
  await flush();
  assert.equal(status().source, "none");
  assert.deepEqual(status().collections, []);

  cache.deferReads = false;
  sync.setCacheReady(true);
  await flush();
  assert.deepEqual(status().collections, CACHED);
});

test("a source error stops loading, keeps collections and clears on restart", async () => {
  const { snapshots, sync, status } = setup({
    stored: CACHED,
    syncAllowed: true,
  });
  sync.setCacheReady(true);
  sync.setSyncAllowed(true);
  await flush();

  const error = new Error("permission-denied");
  snapshots.fail(error);
  assert.deepEqual(pick(status()), {
    collections: CACHED,
    source: "cache",
    loading: false,
    error,
  });

  sync.setSyncAllowed(false);
  assert.equal(status().error, error, "stopping keeps the last error");
  sync.setSyncAllowed(true);
  assert.equal(status().error, null);
  assert.equal(status().loading, true);
  assert.equal(snapshots.subscriptions.length, 2);
});

test("stopping unsubscribes and ignores stale snapshots", async () => {
  const { snapshots, cache, sync, status } = setup({
    stored: CACHED,
    syncAllowed: true,
  });
  sync.setSyncAllowed(true);
  sync.setSyncAllowed(true);
  assert.equal(snapshots.subscriptions.length, 1, "start is idempotent");
  const first = snapshots.subscriptions[0];

  sync.setSyncAllowed(false);
  assert.equal(first.active, false);
  assert.equal(status().loading, false);

  first.onChange(SERVER, { fromCache: false });
  first.onError(new Error("late"));
  assert.deepEqual(pick(status()), {
    collections: [],
    source: "none",
    loading: false,
    error: null,
  });
  assert.deepEqual(cache.writes, []);

  sync.setSyncAllowed(true);
  cache.deferReads = true;
  sync.setCacheReady(true);
  sync.stop();
  cache.resolveRead();
  await flush();
  assert.equal(snapshots.active(), 0);
  assert.equal(status().source, "none");
});

test("listeners hear changes and snapshots stay stable in between", async () => {
  const { snapshots, sync, status } = setup({ stored: CACHED });
  let calls = 0;
  const unsubscribe = sync.subscribe(() => {
    calls += 1;
  });

  const initial = status();
  sync.setSyncAllowed(false);
  assert.equal(status(), initial, "no change keeps the same snapshot");
  assert.equal(calls, 0);

  sync.setCacheReady(true);
  await flush();
  assert.equal(calls, 1);

  sync.setSyncAllowed(true);
  snapshots.snapshot([], true);
  const afterEmptyOffline = status();
  snapshots.snapshot([], true);
  assert.equal(status(), afterEmptyOffline);
  assert.equal(calls, 3);

  unsubscribe();
  snapshots.snapshot(SERVER, false);
  assert.equal(calls, 3);
});

test("hydrates from and writes back to the real Workspace cache", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open({ uid: UID }, "secret");
  await cache.writeCollections(UID, CACHED);

  const snapshots = scriptedSource();
  const sync = createCollectionSync({
    uid: UID,
    snapshots: snapshots.source,
    cache,
  });
  sync.setCacheReady(true);
  await waitFor(() => sync.getSnapshot().source === "cache");
  assert.deepEqual(sync.getSnapshot().collections, CACHED);

  sync.setSyncAllowed(true);
  snapshots.snapshot(SERVER, true);
  snapshots.snapshot(SERVER, false);
  await waitFor(async () => {
    const stored = await cache.readCollections(UID);
    return stored[0]?.id === "server";
  });
});

test("a Workspace cache open for someone else hydrates empty and keeps the entry", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open({ uid: UID }, "secret");
  await cache.writeCollections(UID, CACHED);
  await cache.open({ uid: "bob" }, "secret");

  const sync = createCollectionSync({
    uid: UID,
    snapshots: scriptedSource().source,
    cache,
  });
  sync.setCacheReady(true);
  await waitFor(() => sync.getSnapshot().source === "cache");
  assert.deepEqual(sync.getSnapshot().collections, []);
  assert.equal(storage.entries.has(`tabby:collections:${UID}`), true);
});

test("sync statuses drive the toast: offline warning, then reconnect success", () => {
  const { snapshots, sync, status } = setup({ syncAllowed: true });
  const toasts = createSyncToastTracker();
  const conditions = (isOnline: boolean): SyncToastConditions => ({
    source: status().source,
    allowSync: true,
    hasSyncError: Boolean(status().error),
    isOnline,
    isLoading: status().loading,
  });

  sync.setSyncAllowed(true);
  assert.deepEqual(toasts.next(conditions(false)), { type: "hide" });

  snapshots.snapshot(CACHED, true);
  const warning = toasts.next(conditions(false));
  assert.deepEqual(warning, {
    type: "show",
    kind: "cache-warning",
    delayMs: 0,
    hideAfterMs: 4000,
  });
  toasts.shown("cache-warning");
  assert.equal(toasts.next(conditions(true)), null, "warning shows once");

  snapshots.snapshot(SERVER, false);
  assert.deepEqual(toasts.next(conditions(true)), {
    type: "show",
    kind: "sync-success",
    delayMs: 0,
    hideAfterMs: 4000,
  });
  toasts.shown("sync-success");
  assert.equal(toasts.next(conditions(true)), null);
});
