import type { Collection } from "../../types";
import { decryptPayload, encryptPayload } from "./crypto";
import { readPersistedValue, writePersistedValue } from "./storage";

const collectionsKey = (uid: string) => `tabby:collections:${uid}`;
const collectionsPayloadCache = new Map<string, string>();

export const resetCollectionsPayloadCache = () => {
  collectionsPayloadCache.clear();
};

export const getCachedCollections = async (
  uid: string,
): Promise<Collection[]> => {
  const key = collectionsKey(uid);
  const raw = await readPersistedValue(key);
  if (!raw) {
    return [];
  }
  const decrypted = await decryptPayload(uid, raw);
  if (!decrypted) {
    await writePersistedValue(key, null);
    collectionsPayloadCache.delete(uid);
    return [];
  }
  try {
    return JSON.parse(decrypted) as Collection[];
  } catch {
    await writePersistedValue(key, null);
    collectionsPayloadCache.delete(uid);
    return [];
  }
};

export const setCachedCollections = async (
  uid: string,
  collections: Collection[],
) => {
  const payload = JSON.stringify(collections);
  if (collectionsPayloadCache.get(uid) === payload) {
    return;
  }
  const encrypted = await encryptPayload(uid, payload);
  if (!encrypted) {
    return;
  }
  collectionsPayloadCache.set(uid, payload);
  await writePersistedValue(collectionsKey(uid), encrypted);
};

export const clearCachedCollections = async (uid: string) => {
  collectionsPayloadCache.delete(uid);
  await writePersistedValue(collectionsKey(uid), null);
};
