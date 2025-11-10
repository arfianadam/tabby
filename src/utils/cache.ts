import type { Collection } from "../types";

export type CachedUser = {
  uid: string;
  email?: string | null;
};

const USER_KEY = "tabby:lastUser";
const collectionsKey = (uid: string) => `tabby:collections:${uid}`;

const hasWindow = () => typeof window !== "undefined";

const hasCryptoSupport = () =>
  hasWindow() &&
  typeof window.crypto !== "undefined" &&
  typeof window.crypto.subtle !== "undefined" &&
  typeof window.crypto.getRandomValues === "function" &&
  typeof TextEncoder !== "undefined" &&
  typeof TextDecoder !== "undefined" &&
  typeof window.btoa === "function" &&
  typeof window.atob === "function";

const safeGet = (key: string) => {
  if (!hasWindow()) {
    return null;
  }
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (key: string, value: string | null) => {
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

const textEncoder =
  typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const textDecoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

const ENCRYPTION_SALT = "tabby:cache:v1";
const IV_BYTE_LENGTH = 12;

type EncryptionContext = {
  uid: string;
  secret: string;
  keyPromise: Promise<CryptoKey>;
};

let encryptionContext: EncryptionContext | null = null;
let lastUserPayload: string | null = null;
const collectionsPayloadCache = new Map<string, string>();

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const fromBase64 = (payload: string) => {
  const binary = window.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const deriveKey = async (uid: string, secret: string) => {
  if (!textEncoder || !hasCryptoSupport()) {
    throw new Error("Crypto unavailable");
  }
  const material = textEncoder.encode(`${uid}:${secret}:${ENCRYPTION_SALT}`);
  const digest = await window.crypto.subtle.digest("SHA-256", material);
  return window.crypto.subtle.importKey("raw", digest, "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
};

const ensureCryptoKey = async (uid?: string) => {
  if (!hasCryptoSupport() || !encryptionContext) {
    return null;
  }
  if (uid && encryptionContext.uid !== uid) {
    return null;
  }
  try {
    return await encryptionContext.keyPromise;
  } catch {
    encryptionContext = null;
    return null;
  }
};

const encryptPayload = async (uid: string, plaintext: string) => {
  const key = await ensureCryptoKey(uid);
  if (!key || !textEncoder || !hasCryptoSupport()) {
    return null;
  }
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const cipher = await window.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    textEncoder.encode(plaintext)
  );
  return JSON.stringify({
    v: 1,
    i: toBase64(iv.buffer),
    d: toBase64(cipher),
  });
};

const decryptPayload = async (uid: string | undefined, payload: string) => {
  const key = await ensureCryptoKey(uid);
  if (!key || !textDecoder || !hasCryptoSupport()) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload) as { v: number; i: string; d: string };
    if (parsed.v !== 1) {
      return null;
    }
    const plaintext = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(fromBase64(parsed.i)),
      },
      key,
      fromBase64(parsed.d)
    );
    return textDecoder.decode(plaintext);
  } catch {
    return null;
  }
};

export const configureCacheEncryption = async (
  uid: string | null,
  secret: string | null
) => {
  if (!uid || !secret || !hasCryptoSupport()) {
    encryptionContext = null;
    lastUserPayload = null;
    collectionsPayloadCache.clear();
    return;
  }
  if (
    encryptionContext &&
    encryptionContext.uid === uid &&
    encryptionContext.secret === secret
  ) {
    try {
      await encryptionContext.keyPromise;
    } catch {
      encryptionContext = null;
    }
    return;
  }
  const keyPromise = deriveKey(uid, secret);
  encryptionContext = { uid, secret, keyPromise };
  try {
    await keyPromise;
  } catch {
    encryptionContext = null;
  }
};

export const getCachedUser = async (): Promise<CachedUser | null> => {
  if (!encryptionContext) {
    return null;
  }
  const raw = safeGet(USER_KEY);
  if (!raw) {
    return null;
  }
  const decrypted = await decryptPayload(undefined, raw);
  if (!decrypted) {
    return null;
  }
  try {
    return JSON.parse(decrypted) as CachedUser;
  } catch {
    return null;
  }
};

export const setCachedUser = async (user: CachedUser | null) => {
  if (!user) {
    safeSet(USER_KEY, null);
    lastUserPayload = null;
    return;
  }
  if (!encryptionContext) {
    return;
  }
  const payload = JSON.stringify(user);
  if (payload === lastUserPayload) {
    return;
  }
  const encrypted = await encryptPayload(encryptionContext.uid, payload);
  if (!encrypted) {
    return;
  }
  lastUserPayload = payload;
  safeSet(USER_KEY, encrypted);
};

export const getCachedCollections = async (
  uid: string
): Promise<Collection[]> => {
  const raw = safeGet(collectionsKey(uid));
  if (!raw) {
    return [];
  }
  const decrypted = await decryptPayload(uid, raw);
  if (!decrypted) {
    return [];
  }
  try {
    return JSON.parse(decrypted) as Collection[];
  } catch {
    return [];
  }
};

export const setCachedCollections = async (
  uid: string,
  collections: Collection[]
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
  safeSet(collectionsKey(uid), encrypted);
};

export const clearCachedCollections = (uid: string) => {
  collectionsPayloadCache.delete(uid);
  safeSet(collectionsKey(uid), null);
};
