import {
  decryptPayload,
  encryptPayload,
  getEncryptionContext,
  isEncryptionConfigured,
} from "./crypto";
import { readPersistedValue, writePersistedValue } from "./storage";

export type CachedUser = {
  uid: string;
  email?: string | null;
};

const USER_KEY = "tabby:lastUser";
let lastUserPayload: string | null = null;

export const resetUserPayloadCache = () => {
  lastUserPayload = null;
};

export const getCachedUser = async (): Promise<CachedUser | null> => {
  if (!isEncryptionConfigured()) {
    return null;
  }
  const raw = await readPersistedValue(USER_KEY);
  if (!raw) {
    return null;
  }
  const decrypted = await decryptPayload(undefined, raw);
  if (!decrypted) {
    await writePersistedValue(USER_KEY, null);
    resetUserPayloadCache();
    return null;
  }
  try {
    return JSON.parse(decrypted) as CachedUser;
  } catch {
    await writePersistedValue(USER_KEY, null);
    resetUserPayloadCache();
    return null;
  }
};

export const setCachedUser = async (user: CachedUser | null) => {
  if (!user) {
    await writePersistedValue(USER_KEY, null);
    resetUserPayloadCache();
    return;
  }

  const context = getEncryptionContext();
  if (!context) {
    return;
  }

  const payload = JSON.stringify(user);
  if (payload === lastUserPayload) {
    return;
  }

  const encrypted = await encryptPayload(context.uid, payload);
  if (!encrypted) {
    return;
  }

  lastUserPayload = payload;
  await writePersistedValue(USER_KEY, encrypted);
};
