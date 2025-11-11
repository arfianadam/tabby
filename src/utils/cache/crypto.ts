import { hasCryptoSupport, hasWindow } from "./environment";

const ENCRYPTION_SALT = "tabby:cache:v1";
const IV_BYTE_LENGTH = 12;

type EncryptionContext = {
  uid: string;
  secret: string;
  keyPromise: Promise<CryptoKey>;
};

let encryptionContext: EncryptionContext | null = null;

const textEncoder =
  typeof TextEncoder !== "undefined" ? new TextEncoder() : null;
const textDecoder =
  typeof TextDecoder !== "undefined" ? new TextDecoder() : null;

const toBase64 = (buffer: ArrayBuffer) => {
  if (!hasWindow()) {
    return "";
  }
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const fromBase64 = (payload: string) => {
  if (!hasWindow()) {
    return new ArrayBuffer(0);
  }
  const binary = window.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

export const getEncryptionContext = () => encryptionContext;

export const setEncryptionContext = (context: EncryptionContext | null) => {
  encryptionContext = context;
};

export const isEncryptionConfigured = () => encryptionContext !== null;

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

export const createEncryptionContext = (uid: string, secret: string) => ({
  uid,
  secret,
  keyPromise: deriveKey(uid, secret),
});

export const encryptPayload = async (uid: string, plaintext: string) => {
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
    textEncoder.encode(plaintext),
  );
  return JSON.stringify({
    v: 1,
    i: toBase64(iv.buffer),
    d: toBase64(cipher),
  });
};

export const decryptPayload = async (
  uid: string | undefined,
  payload: string,
) => {
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
      fromBase64(parsed.d),
    );
    return textDecoder.decode(plaintext);
  } catch {
    return null;
  }
};
