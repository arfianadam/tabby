const hasWindow = () => typeof window !== "undefined" && !!window.localStorage;

export type FaviconLookup = {
  url: string;
  faviconUrl?: string;
};

const CACHE_VERSION = "v1";
const CACHE_KEY = `tabby:favicons:${CACHE_VERSION}`;
const SUCCESS_TTL = 1000 * 60 * 60 * 24 * 7; // 7 days
// Leaves room in localStorage for the app's other data, like the auth session.
const MAX_ENTRIES = 500;

type FaviconCacheEntry = {
  dataUrl: string;
  updatedAt: number;
};

type FaviconCache = Record<string, FaviconCacheEntry>;

const memoryCache: Map<string, string> = new Map();
const inflightFetches: Map<string, Promise<string | null>> = new Map();

let persistedCache: FaviconCache | null = null;

const isCacheEntryFresh = (entry: FaviconCacheEntry) =>
  Date.now() - entry.updatedAt < SUCCESS_TTL;

const readStoredCache = (): FaviconCache | null => {
  if (!hasWindow()) {
    return null;
  }
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) {
    return {};
  }
  try {
    return JSON.parse(raw) as FaviconCache;
  } catch {
    return {};
  }
};

const readCache = (): FaviconCache => {
  if (!persistedCache) {
    persistedCache = readStoredCache() ?? {};
  }
  return persistedCache;
};

// Saves the newest unexpired icons, dropping the oldest half while they do not
// fit in localStorage.
const writeCache = (cache: FaviconCache) => {
  let entries = Object.entries(cache)
    .filter(([, entry]) => isCacheEntryFresh(entry))
    .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_ENTRIES);
  persistedCache = Object.fromEntries(entries);
  if (!hasWindow()) {
    return;
  }
  for (;;) {
    try {
      window.localStorage.setItem(
        CACHE_KEY,
        JSON.stringify(Object.fromEntries(entries)),
      );
      return;
    } catch {
      if (!entries.length) {
        return;
      }
      entries = entries.slice(0, Math.floor(entries.length / 2));
    }
  }
};

// Every open tab shares the stored cache, so apply changes to its latest
// contents rather than this tab's snapshot, which would drop other tabs' icons.
const updateCache = (change: (cache: FaviconCache) => void) => {
  const cache = readStoredCache() ?? readCache();
  change(cache);
  writeCache(cache);
};

const getCacheKey = (url: string) => {
  try {
    const parsed = new URL(url);
    return parsed.hostname.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
};

const readCachedDataUrl = (cacheKey: string): string | null => {
  if (!cacheKey) {
    return null;
  }
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey) ?? null;
  }
  const cache = readCache();
  const entry = cache[cacheKey];
  if (!entry) {
    return null;
  }
  if (!isCacheEntryFresh(entry)) {
    updateCache((latest) => {
      const current = latest[cacheKey];
      if (current && !isCacheEntryFresh(current)) {
        delete latest[cacheKey];
      }
    });
    memoryCache.delete(cacheKey);
    return null;
  }
  memoryCache.set(cacheKey, entry.dataUrl);
  return entry.dataUrl;
};

const persistCacheEntry = (cacheKey: string, dataUrl: string) => {
  updateCache((cache) => {
    cache[cacheKey] = {
      dataUrl,
      updatedAt: Date.now(),
    };
  });
  memoryCache.set(cacheKey, dataUrl);
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

// Custom favicon URL is fetched before the bookmark URL.
const lookupOrder = ({ url, faviconUrl }: FaviconLookup): string[] =>
  faviconUrl ? [faviconUrl, url] : [url];

// Icons are stored under the bookmark URL, falling back to the custom URL.
const storageUrl = ({ url, faviconUrl }: FaviconLookup) => url || faviconUrl;

// Lookups share a request and a cached icon only when they try the same hosts,
// so a host's own icon and each custom icon on it are kept apart.
const lookupKey = (target: FaviconLookup) =>
  lookupOrder(target).map(getCacheKey).join("|");

const isHttpUrl = (url: string) => /^https?:\/\//i.test(url);

const downloadFavicon = async (
  target: FaviconLookup,
): Promise<string | null> => {
  const candidates = lookupOrder(target);
  if (!candidates.some(isHttpUrl)) {
    return null;
  }
  for (const source of candidates.flatMap(buildSourcesForUrl)) {
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

export const getCachedFavicon = (target: FaviconLookup): string | null =>
  readCachedDataUrl(lookupKey(target));

export const resolveFavicon = (
  target: FaviconLookup,
): Promise<string | null> => {
  const cached = getCachedFavicon(target);
  if (cached) {
    return Promise.resolve(cached);
  }
  const url = storageUrl(target);
  if (!url) {
    return Promise.resolve(null);
  }
  const key = lookupKey(target);
  const inflight = inflightFetches.get(key);
  if (inflight) {
    return inflight;
  }
  const request = downloadFavicon(target)
    .then((dataUrl) => {
      if (dataUrl) {
        persistCacheEntry(key, dataUrl);
      }
      return dataUrl;
    })
    .catch(() => null)
    .finally(() => {
      inflightFetches.delete(key);
    });
  inflightFetches.set(key, request);
  return request;
};

// Targets without a custom URL borrow the one of the first target on their
// host that has one, so list order, not fetch timing, picks their icon.
export const withSiblingFaviconUrls = <T extends FaviconLookup>(
  targets: T[],
): T[] => {
  const customUrls = new Map<string, string>();
  targets.forEach(({ url, faviconUrl }) => {
    const host = getCacheKey(url);
    if (faviconUrl && !customUrls.has(host)) {
      customUrls.set(host, faviconUrl);
    }
  });
  return targets.map((target) => {
    const faviconUrl =
      !target.faviconUrl && customUrls.get(getCacheKey(target.url));
    return faviconUrl ? { ...target, faviconUrl } : target;
  });
};
