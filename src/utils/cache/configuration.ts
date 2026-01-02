import { hasCryptoSupport } from "@/utils/cache/environment";
import {
  createEncryptionContext,
  createEncryptionContextFromKeyMaterial,
  getEncryptionContext,
  setEncryptionContext,
} from "@/utils/cache/crypto";
import { resetUserPayloadCache } from "@/utils/cache/userCache";
import { resetCollectionsPayloadCache } from "@/utils/cache/collectionsCache";

export const configureCacheEncryption = async (
  uid: string | null,
  secret: string | null,
) => {
  if (!uid || !secret || !hasCryptoSupport()) {
    setEncryptionContext(null);
    resetUserPayloadCache();
    resetCollectionsPayloadCache();
    return;
  }

  const existing = getEncryptionContext();
  if (existing && existing.uid === uid && existing.secret === secret) {
    try {
      await existing.keyPromise;
    } catch {
      setEncryptionContext(null);
    }
    return;
  }

  const context = createEncryptionContext(uid, secret);
  setEncryptionContext(context);
  resetUserPayloadCache();
  resetCollectionsPayloadCache();

  try {
    await context.keyPromise;
  } catch {
    setEncryptionContext(null);
  }
};

export const configureCacheEncryptionKeyMaterial = async (
  uid: string | null,
  keyMaterial: string | null,
) => {
  if (!uid || !keyMaterial || !hasCryptoSupport()) {
    setEncryptionContext(null);
    resetUserPayloadCache();
    resetCollectionsPayloadCache();
    return;
  }

  const existing = getEncryptionContext();
  if (existing && existing.uid === uid && existing.secret === keyMaterial) {
    try {
      await existing.keyPromise;
    } catch {
      setEncryptionContext(null);
    }
    return;
  }

  const context = createEncryptionContextFromKeyMaterial(uid, keyMaterial);
  setEncryptionContext(context);
  resetUserPayloadCache();
  resetCollectionsPayloadCache();

  try {
    await context.keyPromise;
  } catch {
    setEncryptionContext(null);
  }
};
