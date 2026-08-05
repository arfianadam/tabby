import assert from "node:assert/strict";
import test from "node:test";
import {
  CACHE_WARNING_DELAY_MS,
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
