import assert from "node:assert/strict";
import test from "node:test";
import {
  CACHE_WARNING_DELAY_MS,
  SYNC_TOAST_HIDE_MS,
  createSyncToastTracker,
  getSyncToastPlan,
} from "../src/features/dashboard/syncNotification.ts";

test("warns when the workspace falls back to cached collections", () => {
  assert.deepEqual(
    getSyncToastPlan({
      source: "cache",
      cacheWarningShown: false,
      allowSync: false,
      hasSyncError: false,
      isOnline: false,
      isLoading: false,
    }),
    { kind: "cache-warning", delayMs: 0 },
  );
});

test("does not warn while cached collections are still loading", () => {
  assert.equal(
    getSyncToastPlan({
      source: "cache",
      cacheWarningShown: false,
      allowSync: false,
      hasSyncError: false,
      isOnline: false,
      isLoading: true,
    }),
    null,
  );
});

test("shows success only after cached collections reconnect to the server", () => {
  assert.deepEqual(
    getSyncToastPlan({
      source: "server",
      cacheWarningShown: true,
      allowSync: true,
      hasSyncError: false,
      isOnline: true,
      isLoading: false,
    }),
    { kind: "sync-success", delayMs: 0 },
  );
});

test("does not announce success for a normal initial server sync", () => {
  assert.equal(
    getSyncToastPlan({
      source: "server",
      cacheWarningShown: false,
      allowSync: true,
      hasSyncError: false,
      isOnline: true,
      isLoading: false,
    }),
    null,
  );
});

test("gives an online server sync a grace period before warning", () => {
  assert.deepEqual(
    getSyncToastPlan({
      source: "cache",
      cacheWarningShown: false,
      allowSync: true,
      hasSyncError: false,
      isOnline: true,
      isLoading: false,
    }),
    { kind: "cache-warning", delayMs: CACHE_WARNING_DELAY_MS },
  );
});

const online = {
  allowSync: true,
  hasSyncError: false,
  isOnline: true,
  isLoading: false,
};

test("tracker: a shown cache warning turns the next server sync into success", () => {
  const toasts = createSyncToastTracker();

  assert.deepEqual(toasts.next({ ...online, source: "cache" }), {
    type: "show",
    kind: "cache-warning",
    delayMs: CACHE_WARNING_DELAY_MS,
    hideAfterMs: SYNC_TOAST_HIDE_MS,
  });
  toasts.shown("cache-warning");
  assert.equal(toasts.next({ ...online, source: "cache" }), null);

  assert.deepEqual(toasts.next({ ...online, source: "server" }), {
    type: "show",
    kind: "sync-success",
    delayMs: 0,
    hideAfterMs: SYNC_TOAST_HIDE_MS,
  });
  toasts.shown("sync-success");
  assert.equal(toasts.next({ ...online, source: "server" }), null);
});

test("tracker: a warning that never appeared earns no success toast", () => {
  const toasts = createSyncToastTracker();

  assert.equal(
    toasts.next({ ...online, source: "cache" })?.type,
    "show",
    "planned but cancelled before its delay elapsed",
  );
  assert.equal(toasts.next({ ...online, source: "server" }), null);
});

test("tracker: loading hides the toast and forgets the shown warning", () => {
  const toasts = createSyncToastTracker();
  toasts.next({ ...online, source: "cache", hasSyncError: true });
  toasts.shown("cache-warning");

  assert.deepEqual(
    toasts.next({ ...online, source: "cache", isLoading: true }),
    {
      type: "hide",
    },
  );
  assert.equal(toasts.next({ ...online, source: "server" }), null);
  assert.deepEqual(toasts.next({ ...online, source: "cache" }), {
    type: "show",
    kind: "cache-warning",
    delayMs: CACHE_WARNING_DELAY_MS,
    hideAfterMs: SYNC_TOAST_HIDE_MS,
  });
});

test("tracker: warns immediately when sync is off, failing or offline", () => {
  const toasts = createSyncToastTracker();
  for (const conditions of [
    { ...online, allowSync: false },
    { ...online, hasSyncError: true },
    { ...online, isOnline: false },
  ]) {
    const step = toasts.next({ ...conditions, source: "cache" });
    assert.equal(step?.type === "show" && step.delayMs, 0);
  }
  assert.equal(toasts.next({ ...online, source: "none" }), null);
});
