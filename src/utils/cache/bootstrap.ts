import { deriveKeyMaterial } from "@/utils/cache/crypto";
import { readPersistedValue, writePersistedValue } from "@/utils/cache/storage";

export type CacheBootstrapRecord = {
  uid: string;
  email?: string | null;
  keyMaterial: string;
};

const BOOTSTRAP_KEY = "tabby:cacheBootstrap:v1";

const isValidRecord = (value: unknown): value is CacheBootstrapRecord => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Partial<CacheBootstrapRecord>;
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

export const getCacheBootstrapRecord =
  async (): Promise<CacheBootstrapRecord | null> => {
    const raw = await readPersistedValue(BOOTSTRAP_KEY);
    if (!raw) {
      return null;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isValidRecord(parsed)) {
        await writePersistedValue(BOOTSTRAP_KEY, null);
        return null;
      }
      return parsed;
    } catch {
      await writePersistedValue(BOOTSTRAP_KEY, null);
      return null;
    }
  };

export const setCacheBootstrapRecord = async (
  record: CacheBootstrapRecord | null,
) => {
  await writePersistedValue(
    BOOTSTRAP_KEY,
    record ? JSON.stringify(record) : null,
  );
};

export const clearCacheBootstrapRecord = async () => {
  await writePersistedValue(BOOTSTRAP_KEY, null);
};

export const setCacheBootstrapFromSecret = async (params: {
  uid: string;
  email?: string | null;
  secret: string;
}) => {
  try {
    const keyMaterial = await deriveKeyMaterial(params.uid, params.secret);
    await setCacheBootstrapRecord({
      uid: params.uid,
      email: params.email,
      keyMaterial,
    });
  } catch {
    // best-effort: crypto can be unavailable or blocked
  }
};
