const ENCRYPTION_SALT = "tabby:cache:v1";
const IV_BYTE_LENGTH = 12;
const PAYLOAD_VERSION = 1;

type EncryptedPayload = { v: number; i: string; d: string };

export const hasCryptoSupport = () =>
  typeof globalThis.crypto !== "undefined" &&
  typeof globalThis.crypto.subtle !== "undefined" &&
  typeof globalThis.crypto.getRandomValues === "function" &&
  typeof TextEncoder !== "undefined" &&
  typeof TextDecoder !== "undefined" &&
  typeof globalThis.btoa === "function" &&
  typeof globalThis.atob === "function";

const assertCryptoSupport = () => {
  if (!hasCryptoSupport()) {
    throw new Error("Crypto unavailable");
  }
};

const toBase64 = (buffer: ArrayBuffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return globalThis.btoa(binary);
};

const fromBase64 = (payload: string) => {
  const binary = globalThis.atob(payload);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

// Base64 SHA-256 of `${uid}:${secret}:${salt}`; this is the raw AES-GCM key.
export const deriveKeyMaterial = async (uid: string, secret: string) => {
  assertCryptoSupport();
  const material = new TextEncoder().encode(
    `${uid}:${secret}:${ENCRYPTION_SALT}`,
  );
  const digest = await globalThis.crypto.subtle.digest("SHA-256", material);
  return toBase64(digest);
};

export const importKeyMaterial = async (keyMaterial: string) => {
  assertCryptoSupport();
  return globalThis.crypto.subtle.importKey(
    "raw",
    fromBase64(keyMaterial),
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
};

export const encryptPayload = async (key: CryptoKey, plaintext: string) => {
  assertCryptoSupport();
  const iv = globalThis.crypto.getRandomValues(new Uint8Array(IV_BYTE_LENGTH));
  const cipher = await globalThis.crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv,
    },
    key,
    new TextEncoder().encode(plaintext),
  );
  const payload: EncryptedPayload = {
    v: PAYLOAD_VERSION,
    i: toBase64(iv.buffer),
    d: toBase64(cipher),
  };
  return JSON.stringify(payload);
};

export const decryptPayload = async (key: CryptoKey, payload: string) => {
  if (!hasCryptoSupport()) {
    return null;
  }
  try {
    const parsed = JSON.parse(payload) as EncryptedPayload;
    if (parsed.v !== PAYLOAD_VERSION) {
      return null;
    }
    const plaintext = await globalThis.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: new Uint8Array(fromBase64(parsed.i)),
      },
      key,
      fromBase64(parsed.d),
    );
    return new TextDecoder().decode(plaintext);
  } catch {
    return null;
  }
};
