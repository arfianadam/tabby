import assert from "node:assert/strict";
import test from "node:test";
import type { Collection } from "../src/types.ts";
import {
  isAuthoritativeCollectionSnapshot,
  reduceCollectionSyncState,
  type CollectionSyncState,
} from "../src/hooks/collectionSyncState.ts";

const cachedCollection: Collection = {
  id: "cached-collection",
  name: "Cached collection",
  createdAt: 1,
  updatedAt: 1,
  folders: [],
};

const initialState = (): CollectionSyncState => ({
  collections: [],
  hasServerSnapshot: false,
  source: "none",
});

test("hydrates collections when the durable cache finishes loading", () => {
  const state = reduceCollectionSyncState(initialState(), {
    type: "hydrate-cache",
    collections: [cachedCollection],
  });

  assert.deepEqual(state.collections, [cachedCollection]);
  assert.equal(state.source, "cache");
});

test("keeps the last successful sync when an offline snapshot is empty", () => {
  const hydrated = reduceCollectionSyncState(initialState(), {
    type: "hydrate-cache",
    collections: [cachedCollection],
  });
  const offline = reduceCollectionSyncState(hydrated, {
    type: "snapshot",
    collections: [],
    fromCache: true,
  });

  assert.deepEqual(offline.collections, [cachedCollection]);
  assert.equal(offline.source, "cache");
});

test("accepts an empty server snapshot as an authoritative deletion", () => {
  const hydrated = reduceCollectionSyncState(initialState(), {
    type: "hydrate-cache",
    collections: [cachedCollection],
  });
  const synced = reduceCollectionSyncState(hydrated, {
    type: "snapshot",
    collections: [],
    fromCache: false,
  });

  assert.deepEqual(synced.collections, []);
  assert.equal(synced.hasServerSnapshot, true);
  assert.equal(synced.source, "server");
});

test("does not restore stale durable data after a server response", () => {
  const synced = reduceCollectionSyncState(initialState(), {
    type: "snapshot",
    collections: [],
    fromCache: false,
  });
  const lateCache = reduceCollectionSyncState(synced, {
    type: "hydrate-cache",
    collections: [cachedCollection],
  });

  assert.deepEqual(lateCache.collections, []);
});

test("marks retained server data as cached when connectivity is lost", () => {
  const synced = reduceCollectionSyncState(initialState(), {
    type: "snapshot",
    collections: [cachedCollection],
    fromCache: false,
  });
  const offline = reduceCollectionSyncState(synced, {
    type: "snapshot",
    collections: [],
    fromCache: true,
  });

  assert.deepEqual(offline.collections, [cachedCollection]);
  assert.equal(offline.source, "cache");
});

test("only server snapshots qualify for the durable last-sync cache", () => {
  assert.equal(isAuthoritativeCollectionSnapshot(true), false);
  assert.equal(isAuthoritativeCollectionSnapshot(false), true);
});
