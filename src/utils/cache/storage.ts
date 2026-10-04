export type KeyValueStorage = {
  read: (key: string) => Promise<string | null>;
  write: (key: string, value: string | null) => Promise<void>;
};

export type MemoryStorage = KeyValueStorage & {
  entries: Map<string, string>;
};

const hasWindow = () => typeof window !== "undefined";

const hasIndexedDbSupport = () =>
  hasWindow() && typeof window.indexedDB !== "undefined";

export const localStorageAdapter: KeyValueStorage = {
  read: async (key) => {
    if (!hasWindow()) {
      return null;
    }
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  write: async (key, value) => {
    if (!hasWindow()) {
      return;
    }
    try {
      if (value === null) {
        window.localStorage.removeItem(key);
      } else {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // ignore quota/security errors
    }
  },
};

const DB_NAME = "tabbyCache";
const DB_STORE = "kv";
const DB_VERSION = 1;

export const createIndexedDbStorage = (
  fallback: KeyValueStorage,
): KeyValueStorage => {
  let dbPromise: Promise<IDBDatabase> | null = null;

  const openDatabase = () => {
    if (!hasIndexedDbSupport()) {
      return null;
    }
    if (!dbPromise) {
      dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(DB_STORE)) {
            db.createObjectStore(DB_STORE);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () =>
          reject(request.error ?? new Error("Failed to open cache database."));
        request.onblocked = () => reject(new Error("Cache database blocked."));
      }).catch((error) => {
        dbPromise = null;
        throw error;
      });
    }
    return dbPromise;
  };

  const getDatabase = async () => {
    const promise = openDatabase();
    if (!promise) {
      return null;
    }
    try {
      return await promise;
    } catch {
      return null;
    }
  };

  return {
    read: async (key) => {
      if (!hasWindow()) {
        return null;
      }
      const db = await getDatabase();
      if (!db) {
        return fallback.read(key);
      }
      return new Promise<string | null>((resolve) => {
        const fallBack = () => {
          void fallback.read(key).then(resolve);
        };
        try {
          const tx = db.transaction(DB_STORE, "readonly");
          const store = tx.objectStore(DB_STORE);
          const request = store.get(key);
          request.onsuccess = () => {
            const value = request.result;
            resolve(typeof value === "string" ? value : null);
          };
          request.onerror = fallBack;
          tx.onerror = fallBack;
          tx.onabort = fallBack;
        } catch {
          fallBack();
        }
      });
    },
    write: async (key, value) => {
      if (!hasWindow()) {
        return;
      }
      const db = await getDatabase();
      if (!db) {
        await fallback.write(key, value);
        return;
      }
      await new Promise<void>((resolve) => {
        const fallBack = () => {
          void fallback.write(key, value).then(resolve);
        };
        try {
          const tx = db.transaction(DB_STORE, "readwrite");
          const store = tx.objectStore(DB_STORE);
          const request =
            value === null ? store.delete(key) : store.put(value, key);
          tx.oncomplete = () => resolve();
          request.onerror = fallBack;
          tx.onerror = fallBack;
          tx.onabort = fallBack;
        } catch {
          fallBack();
        }
      });
    },
  };
};

export const createBrowserStorage = () =>
  createIndexedDbStorage(localStorageAdapter);

export const createMemoryStorage = (
  initial?: Record<string, string>,
): MemoryStorage => {
  const entries = new Map<string, string>(Object.entries(initial ?? {}));
  return {
    entries,
    read: async (key) => entries.get(key) ?? null,
    write: async (key, value) => {
      if (value === null) {
        entries.delete(key);
      } else {
        entries.set(key, value);
      }
    },
  };
};
