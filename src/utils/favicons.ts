const hasWindow = () => typeof window !== "undefined" && !!window.localStorage;

const CACHE_VERSION = "v1";
const CACHE_KEY = `tabby:favicons:${CACHE_VERSION}`;
const SUCCESS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

type FaviconCacheEntry = {
  dataUrl: string;
  updatedAt: number;
};

type FaviconCache = Record<string, FaviconCacheEntry>;

const memoryCache: Map<string, string> = new Map();
const inflightFetches: Map<string, Promise<string | null>> = new Map();

let persistedCache: FaviconCache | null = null;

const readCache = (): FaviconCache => {
  if (persistedCache) {
    return persistedCache;
  }
  if (!hasWindow()) {
    return {};
  }
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) {
    persistedCache = {};
    return persistedCache;
  }
  try {
    persistedCache = JSON.parse(raw) as FaviconCache;
    return persistedCache;
  } catch {
    persistedCache = {};
    return persistedCache;
  }
};

const writeCache = (cache: FaviconCache) => {
  persistedCache = cache;
  if (!hasWindow()) {
    return;
  }
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore quota errors
  }
};

const getCacheKey = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
};

const isCacheEntryFresh = (entry: FaviconCacheEntry) =>
  Date.now() - entry.updatedAt < SUCCESS_TTL;

export const getCachedFaviconDataUrl = (url: string): string | null => {
  if (!url) {
    return null;
  }
  const cacheKey = getCacheKey(url);
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) ?? null;
  }
  const cache = readCache();
  const entry = cache[cacheKey];
  if (!entry) {
    return null;
  }
  if (!isCacheEntryFresh(entry)) {
    delete cache[cacheKey];
    writeCache(cache);
    memoryCache.delete(cacheKey);
    return null;
  }
  memoryCache.set(cacheKey, entry.dataUrl);
  return entry.dataUrl;
};

const persistCacheEntry = (url: string, dataUrl: string) => {
  if (!url || !dataUrl) {
    return;
  }
  const cacheKey = getCacheKey(url);
  const cache = readCache();
  cache[cacheKey] = {
    dataUrl,
    updatedAt: Date.now(),
  };
  memoryCache.set(cacheKey, dataUrl);
  writeCache(cache);
};

const blobToDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read favicon blob."));
    reader.onloadend = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject(new Error("Invalid favicon payload."));
      }
    };
    reader.readAsDataURL(blob);
  });

const encodeS2 = (target: string) =>
  `https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(
    target,
  )}`;
const encodeGstatic = (target: string) =>
  `https://t2.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&sz=64&url=${encodeURIComponent(
    target,
  )}`;

const buildSourcesForUrl = (url: string): string[] => {
  const trimmed = url.trim();
  if (!trimmed) {
    return [];
  }
  try {
    const parsed = new URL(trimmed);
    const origin = `${parsed.protocol}//${parsed.hostname}`;
    return [encodeS2(origin), encodeGstatic(origin)];
  } catch {
    return [encodeS2(trimmed), encodeGstatic(trimmed)];
  }
};

const buildFaviconSources = (url: string, customUrl?: string): string[] => {
  const sources: string[] = [];

  // Try custom URL first if provided
  if (customUrl) {
    sources.push(...buildSourcesForUrl(customUrl));
  }

  // Fall back to main URL
  sources.push(...buildSourcesForUrl(url));

  return sources;
};

const downloadFavicon = async (
  url: string,
  customUrl?: string,
): Promise<string | null> => {
  // At least one URL must be valid
  const hasValidUrl = /^https?:\/\//i.test(url);
  const hasValidCustomUrl = customUrl && /^https?:\/\//i.test(customUrl);
  if (!hasValidUrl && !hasValidCustomUrl) {
    return null;
  }
  const sources = buildFaviconSources(url, customUrl);
  for (const source of sources) {
    try {
      const response = await fetch(source, {
        mode: "cors",
      });
      if (!response.ok) {
        continue;
      }
      const blob = await response.blob();
      if (!blob.size) {
        continue;
      }
      return await blobToDataUrl(blob);
    } catch {
      // try next source
    }
  }
  return null;
};

export const fetchAndCacheFavicon = async (
  url: string,
  customUrl?: string,
): Promise<string | null> => {
  if (!url && !customUrl) {
    return null;
  }

  // Check cache for custom URL first, then main URL
  if (customUrl) {
    const cachedCustom = getCachedFaviconDataUrl(customUrl);
    if (cachedCustom) {
      return cachedCustom;
    }
  }
  if (url) {
    const cachedMain = getCachedFaviconDataUrl(url);
    if (cachedMain) {
      return cachedMain;
    }
  }

  // Use main URL as cache key (fallback to custom if main is empty)
  const cacheKey = getCacheKey(url || customUrl!);
  if (!inflightFetches.has(cacheKey)) {
    inflightFetches.set(
      cacheKey,
      (async () => {
        const dataUrl = await downloadFavicon(url, customUrl);
        if (dataUrl) {
          // Cache under main URL if available, otherwise custom URL
          persistCacheEntry(url || customUrl!, dataUrl);
        }
        return dataUrl;
      })(),
    );
  }

  try {
    return await inflightFetches.get(cacheKey)!;
  } finally {
    inflightFetches.delete(cacheKey);
  }
};
