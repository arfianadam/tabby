import type { Collection } from "../../types.ts";
import {
  decryptPayload,
  deriveKeyMaterial,
  encryptPayload,
  hasCryptoSupport,
  importKeyMaterial,
} from "./crypto.ts";
import { createBrowserStorage, type KeyValueStorage } from "./storage.ts";

export { createMemoryStorage } from "./storage.ts";
export type { KeyValueStorage, MemoryStorage } from "./storage.ts";

export type WorkspaceUser = {
  uid: string;
  email?: string | null;
};

export type RestoredWorkspace = {
  user: WorkspaceUser;
  ready: boolean;
};

export type WorkspaceCache = {
  /** Opens the encrypted cache for a signed-in user; resolves to readiness. */
  open: (user: WorkspaceUser, secret: string) => Promise<boolean>;
  /** Reopens the cache of the last user from the persisted bootstrap record. */
  restore: () => Promise<RestoredWorkspace | null>;
  /** Sign-out: forgets the key, the last user and the bootstrap record. */
  close: (options?: { clearCollectionsFor?: string | null }) => Promise<void>;
  readCollections: (uid: string) => Promise<Collection[]>;
  writeCollections: (uid: string, collections: Collection[]) => Promise<void>;
  isReady: (uid?: string) => boolean;
};

type BootstrapRecord = WorkspaceUser & {
  keyMaterial: string;
};

type EncryptionContext = {
  uid: string;
  keyMaterial: string;
  keyPromise: Promise<CryptoKey>;
};

const USER_KEY = "tabby:lastUser";
const BOOTSTRAP_KEY = "tabby:cacheBootstrap:v1";
const collectionsKey = (uid: string) => `tabby:collections:${uid}`;

const isBootstrapRecord = (value: unknown): value is BootstrapRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<BootstrapRecord>;
  if (typeof record.uid !== "string" || record.uid.trim().length === 0) {
    return false;
  }
  if (typeof record.keyMaterial !== "string" || record.keyMaterial.length < 8) {
    return false;
  }
  if (
    typeof record.email !== "undefined" &&
    record.email !== null &&
    typeof record.email !== "string"
  ) {
    return false;
  }
  return true;
};

export const createWorkspaceCache = ({
  storage = createBrowserStorage(),
}: { storage?: KeyValueStorage } = {}): WorkspaceCache => {
  let context: EncryptionContext | null = null;
  // Last plaintext written per record, to skip re-encrypting identical data.
  let lastUserPayload: string | null = null;
  const collectionsPayloads = new Map<string, string>();

  const resetPayloads = () => {
    lastUserPayload = null;
    collectionsPayloads.clear();
  };

  const isReady = (uid?: string) =>
    context !== null && (uid === undefined || context.uid === uid);

  const getKey = async (uid: string) => {
    if (!context || context.uid !== uid) {
      return null;
    }
    try {
      return await context.keyPromise;
    } catch {
      context = null;
      return null;
    }
  };

  const activate = async (uid: string, keyMaterial: string | null) => {
    if (!keyMaterial || !hasCryptoSupport()) {
      context = null;
      resetPayloads();
      return;
    }
    const existing = context;
    if (
      existing &&
      existing.uid === uid &&
      existing.keyMaterial === keyMaterial
    ) {
      try {
        await existing.keyPromise;
      } catch {
        context = null;
      }
      return;
    }
    const next: EncryptionContext = {
      uid,
      keyMaterial,
      keyPromise: importKeyMaterial(keyMaterial),
    };
    context = next;
    resetPayloads();
    try {
      await next.keyPromise;
    } catch {
      context = null;
    }
  };

  const writeLastUser = async (user: WorkspaceUser) => {
    try {
      if (!context) {
        return;
      }
      const payload = JSON.stringify(user);
      if (payload === lastUserPayload) {
        return;
      }
      const key = await getKey(context.uid);
      if (!key) {
        return;
      }
      const encrypted = await encryptPayload(key, payload);
      lastUserPayload = payload;
      await storage.write(USER_KEY, encrypted);
    } catch {
      // best-effort: the last-user record is informational only
    }
  };

  const readBootstrapRecord = async () => {
    const raw = await storage.read(BOOTSTRAP_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (isBootstrapRecord(parsed)) {
        return parsed;
      }
    } catch {
      // fall through and drop the corrupt record
    }
    await storage.write(BOOTSTRAP_KEY, null);
    return null;
  };

  const dropCollections = async (uid: string) => {
    collectionsPayloads.delete(uid);
    await storage.write(collectionsKey(uid), null);
  };

  return {
    open: async (user, secret) => {
      const summary: WorkspaceUser = { uid: user.uid, email: user.email };
      let keyMaterial: string | null = null;
      if (secret) {
        try {
          keyMaterial = await deriveKeyMaterial(summary.uid, secret);
        } catch {
          // crypto can be unavailable or blocked
        }
      }
      await activate(summary.uid, keyMaterial);
      if (keyMaterial) {
        const record: BootstrapRecord = { ...summary, keyMaterial };
        await storage.write(BOOTSTRAP_KEY, JSON.stringify(record));
      }
      await writeLastUser(summary);
      return isReady(summary.uid);
    },

    restore: async () => {
      const record = await readBootstrapRecord();
      if (!record) {
        return null;
      }
      const user: WorkspaceUser = { uid: record.uid, email: record.email };
      await activate(user.uid, record.keyMaterial);
      await writeLastUser(user);
      return { user, ready: isReady(user.uid) };
    },

    close: async ({ clearCollectionsFor } = {}) => {
      context = null;
      resetPayloads();
      await storage.write(USER_KEY, null);
      await storage.write(BOOTSTRAP_KEY, null);
      if (clearCollectionsFor) {
        await dropCollections(clearCollectionsFor);
      }
    },

    readCollections: async (uid) => {
      const raw = await storage.read(collectionsKey(uid));
      if (!raw) {
        return [];
      }
      const key = await getKey(uid);
      if (!key) {
        // not open for this uid: nothing proves the entry is unreadable
        return [];
      }
      const decrypted = await decryptPayload(key, raw);
      if (decrypted) {
        try {
          return JSON.parse(decrypted) as Collection[];
        } catch {
          // fall through and drop the unreadable entry
        }
      }
      await dropCollections(uid);
      return [];
    },

    writeCollections: async (uid, collections) => {
      const payload = JSON.stringify(collections);
      if (collectionsPayloads.get(uid) === payload) {
        return;
      }
      const key = await getKey(uid);
      if (!key) {
        return;
      }
      const encrypted = await encryptPayload(key, payload);
      collectionsPayloads.set(uid, payload);
      await storage.write(collectionsKey(uid), encrypted);
    },

    isReady,
  };
};

export const workspaceCache = createWorkspaceCache();
