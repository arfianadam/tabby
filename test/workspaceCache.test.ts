import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import type { Collection } from "../src/types.ts";
import {
  createMemoryStorage,
  createWorkspaceCache,
  type KeyValueStorage,
} from "../src/utils/cache/workspaceCache.ts";
import {
  deriveKeyMaterial,
  encryptPayload,
  importKeyMaterial,
} from "../src/utils/cache/crypto.ts";

const ALICE = { uid: "alice", email: "alice@example.com" };
const BOB = { uid: "bob", email: "bob@example.com" };
const SECRET = "refresh-token-alice";

const COLLECTIONS: Collection[] = [
  {
    id: "c1",
    name: "Reading",
    createdAt: 1,
    updatedAt: 2,
    folders: [
      {
        id: "f1",
        name: "Articles",
        createdAt: 1,
        bookmarks: [
          {
            id: "b1",
            title: "Example",
            url: "https://example.com",
            createdAt: 1,
          },
        ],
      },
    ],
  },
];

const collectionsKey = (uid: string) => `tabby:collections:${uid}`;
const USER_KEY = "tabby:lastUser";
const BOOTSTRAP_KEY = "tabby:cacheBootstrap:v1";

const countingStorage = (inner: KeyValueStorage) => {
  const writes: string[] = [];
  const storage: KeyValueStorage = {
    read: inner.read,
    write: async (key, value) => {
      writes.push(key);
      await inner.write(key, value);
    },
  };
  return { storage, writes };
};

test("open from a secret, then write and read collections back", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });

  assert.equal(await cache.open(ALICE, SECRET), true);
  assert.equal(cache.isReady(), true);
  assert.equal(cache.isReady(ALICE.uid), true);
  assert.equal(cache.isReady(BOB.uid), false);

  await cache.writeCollections(ALICE.uid, COLLECTIONS);
  assert.deepEqual(await cache.readCollections(ALICE.uid), COLLECTIONS);

  const raw = storage.entries.get(collectionsKey(ALICE.uid));
  assert.ok(raw);
  const payload = JSON.parse(raw) as Record<string, unknown>;
  assert.deepEqual(Object.keys(payload), ["v", "i", "d"]);
  assert.equal(payload.v, 1);
  assert.ok(!raw.includes("Reading"), "collections are stored encrypted");
  assert.ok(storage.entries.has(USER_KEY));
});

test("the bootstrap record keeps the existing key derivation", async () => {
  const storage = createMemoryStorage();
  await createWorkspaceCache({ storage }).open(ALICE, SECRET);

  const record = JSON.parse(storage.entries.get(BOOTSTRAP_KEY) ?? "null");
  const expected = createHash("sha256")
    .update(`${ALICE.uid}:${SECRET}:tabby:cache:v1`)
    .digest("base64");
  assert.deepEqual(record, { ...ALICE, keyMaterial: expected });
});

test("restoring from the bootstrap record decrypts what the secret wrote", async () => {
  const storage = createMemoryStorage();
  const first = createWorkspaceCache({ storage });
  await first.open(ALICE, SECRET);
  await first.writeCollections(ALICE.uid, COLLECTIONS);

  const reloaded = createWorkspaceCache({ storage });
  assert.equal(reloaded.isReady(), false);
  assert.deepEqual(await reloaded.restore(), { user: ALICE, ready: true });
  assert.equal(reloaded.isReady(ALICE.uid), true);
  assert.deepEqual(await reloaded.readCollections(ALICE.uid), COLLECTIONS);
});

test("restore returns null without a bootstrap record", async () => {
  const cache = createWorkspaceCache({ storage: createMemoryStorage() });
  assert.equal(await cache.restore(), null);
  assert.equal(cache.isReady(), false);
});

test("restore drops a corrupt bootstrap record", async () => {
  const storage = createMemoryStorage({
    [BOOTSTRAP_KEY]: JSON.stringify({ uid: "alice", keyMaterial: "short" }),
  });
  const cache = createWorkspaceCache({ storage });
  assert.equal(await cache.restore(), null);
  assert.equal(storage.entries.has(BOOTSTRAP_KEY), false);
});

test("a different secret cannot read and clears the entry", async () => {
  const storage = createMemoryStorage();
  const writer = createWorkspaceCache({ storage });
  await writer.open(ALICE, SECRET);
  await writer.writeCollections(ALICE.uid, COLLECTIONS);

  const intruder = createWorkspaceCache({ storage });
  await intruder.open(ALICE, "another-secret");
  assert.deepEqual(await intruder.readCollections(ALICE.uid), []);
  assert.equal(storage.entries.has(collectionsKey(ALICE.uid)), false);
});

test("a different user cannot read but keeps the entry", async () => {
  const storage = createMemoryStorage();
  const writer = createWorkspaceCache({ storage });
  await writer.open(ALICE, SECRET);
  await writer.writeCollections(ALICE.uid, COLLECTIONS);

  const other = createWorkspaceCache({ storage });
  await other.open(BOB, SECRET);
  assert.deepEqual(await other.readCollections(ALICE.uid), []);
  assert.equal(storage.entries.has(collectionsKey(ALICE.uid)), true);

  await other.open(ALICE, SECRET);
  assert.deepEqual(await other.readCollections(ALICE.uid), COLLECTIONS);
});

test("reading before the cache is open keeps the entry", async () => {
  const storage = createMemoryStorage();
  const writer = createWorkspaceCache({ storage });
  await writer.open(ALICE, SECRET);
  await writer.writeCollections(ALICE.uid, COLLECTIONS);

  const reloaded = createWorkspaceCache({ storage });
  assert.deepEqual(await reloaded.readCollections(ALICE.uid), []);
  assert.equal(storage.entries.has(collectionsKey(ALICE.uid)), true);

  await reloaded.restore();
  assert.deepEqual(await reloaded.readCollections(ALICE.uid), COLLECTIONS);
});

test("an entry that decrypts to invalid JSON is cleared", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open(ALICE, SECRET);
  const key = await importKeyMaterial(
    await deriveKeyMaterial(ALICE.uid, SECRET),
  );
  await storage.write(
    collectionsKey(ALICE.uid),
    await encryptPayload(key, "not json"),
  );

  assert.deepEqual(await cache.readCollections(ALICE.uid), []);
  assert.equal(storage.entries.has(collectionsKey(ALICE.uid)), false);
});

test("close forgets the key, last user, bootstrap record and collections", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open(ALICE, SECRET);
  await cache.writeCollections(ALICE.uid, COLLECTIONS);

  await cache.close({ clearCollectionsFor: ALICE.uid });

  assert.equal(cache.isReady(), false);
  assert.deepEqual([...storage.entries.keys()], []);
  assert.equal(await createWorkspaceCache({ storage }).restore(), null);
});

test("close keeps collections unless asked to clear them", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open(ALICE, SECRET);
  await cache.writeCollections(ALICE.uid, COLLECTIONS);

  await cache.close();

  assert.equal(cache.isReady(), false);
  assert.deepEqual([...storage.entries.keys()], [collectionsKey(ALICE.uid)]);
  await cache.open(ALICE, SECRET);
  assert.deepEqual(await cache.readCollections(ALICE.uid), COLLECTIONS);
});

test("writes are no-ops while the cache is not open", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });

  await cache.writeCollections(ALICE.uid, COLLECTIONS);
  assert.equal(storage.entries.size, 0);

  await cache.open(ALICE, SECRET);
  await cache.close();
  await cache.writeCollections(ALICE.uid, COLLECTIONS);
  assert.equal(storage.entries.has(collectionsKey(ALICE.uid)), false);
});

test("writes for another user are no-ops", async () => {
  const storage = createMemoryStorage();
  const cache = createWorkspaceCache({ storage });
  await cache.open(ALICE, SECRET);

  await cache.writeCollections(BOB.uid, COLLECTIONS);
  assert.equal(storage.entries.has(collectionsKey(BOB.uid)), false);
});

test("identical collection payloads are written once", async () => {
  const { storage, writes } = countingStorage(createMemoryStorage());
  const cache = createWorkspaceCache({ storage });
  await cache.open(ALICE, SECRET);

  await cache.writeCollections(ALICE.uid, COLLECTIONS);
  await cache.writeCollections(ALICE.uid, structuredClone(COLLECTIONS));
  const key = collectionsKey(ALICE.uid);
  assert.equal(writes.filter((written) => written === key).length, 1);

  await cache.writeCollections(ALICE.uid, []);
  assert.equal(writes.filter((written) => written === key).length, 2);
});

test("reopening with the same secret does not rewrite the last user", async () => {
  const { storage, writes } = countingStorage(createMemoryStorage());
  const cache = createWorkspaceCache({ storage });

  await cache.open(ALICE, SECRET);
  await cache.open(ALICE, SECRET);
  assert.equal(writes.filter((written) => written === USER_KEY).length, 1);
});
