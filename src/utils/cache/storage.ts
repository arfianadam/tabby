import { hasIndexedDbSupport, hasWindow } from "@/utils/cache/environment";

const safeLocalStorageGet = (key: string) => {
  if (!hasWindow()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeLocalStorageSet = (key: string, value: string | null) => {
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
};

const DB_NAME = "tabbyCache";
const DB_STORE = "kv";
const DB_VERSION = 1;

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

export const readPersistedValue = async (key: string) => {
  if (!hasWindow()) {
    return null;
  }
  const db = await getDatabase();
  if (!db) {
    return safeLocalStorageGet(key);
  }
  return new Promise<string | null>((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, "readonly");
      const store = tx.objectStore(DB_STORE);
      const request = store.get(key);
      const fallBack = () => {
        resolve(safeLocalStorageGet(key));
      };
      request.onsuccess = () => {
        const value = request.result;
        resolve(typeof value === "string" ? value : null);
      };
      request.onerror = fallBack;
      tx.onerror = fallBack;
      tx.onabort = fallBack;
    } catch {
      resolve(safeLocalStorageGet(key));
    }
  });
};

export const writePersistedValue = async (
  key: string,
  value: string | null,
) => {
  if (!hasWindow()) {
    return;
  }
  const db = await getDatabase();
  if (!db) {
    safeLocalStorageSet(key, value);
    return;
  }
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(DB_STORE, "readwrite");
      const store = tx.objectStore(DB_STORE);
      const request =
        value === null ? store.delete(key) : store.put(value, key);
      const fallBack = () => {
        safeLocalStorageSet(key, value);
        resolve();
      };
      tx.oncomplete = () => resolve();
      request.onerror = fallBack;
      tx.onerror = fallBack;
      tx.onabort = fallBack;
    } catch {
      safeLocalStorageSet(key, value);
      resolve();
    }
  });
};
