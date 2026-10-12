import assert from "node:assert/strict";
import test from "node:test";
import {
  getCachedFavicon,
  resolveFavicon,
  withSiblingFaviconUrls,
} from "../src/utils/favicons.ts";

class StubFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;

  readAsDataURL(blob: Blob) {
    blob.text().then((text) => {
      this.result = `data:text/plain,${text}`;
      this.onloadend?.();
    });
  }
}

const storage = new Map<string, string>();
let storageLimit = Infinity;

Object.assign(globalThis, {
  FileReader: StubFileReader,
  window: {
    localStorage: {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        if (value.length > storageLimit) {
          throw new Error("QuotaExceededError");
        }
        storage.set(key, value);
      },
    },
  },
});

// Each import is a separate module instance sharing storage, like a new tab.
let tabCount = 0;
const openTab = (): Promise<typeof import("../src/utils/favicons.ts")> =>
  import(`../src/utils/favicons.ts?tab=${++tabCount}`);

const requests: string[] = [];
let respond: (source: string) => Response | Promise<Response> = () =>
  new Response(null, { status: 404 });

globalThis.fetch = (async (input: string | URL | Request) => {
  const source = String(input);
  requests.push(source);
  return respond(source);
}) as typeof fetch;

const iconFor = (host: string) => `data:text/plain,${host}`;

// Serves an icon whose payload is the requested host, for the given hosts only.
const serveHosts = (...hosts: string[]) => {
  respond = (source) => {
    const host = hosts.find((candidate) =>
      decodeURIComponent(source).includes(`https://${candidate}`),
    );
    return host
      ? new Response(new Blob([host]))
      : new Response(null, { status: 404 });
  };
};

const requestCount = () => {
  const count = requests.length;
  requests.length = 0;
  return count;
};

test("a custom lookup only reuses an icon saved for the same custom URL", async () => {
  serveHosts("custom-a.test", "main-a.test");
  await resolveFavicon({ url: "https://custom-a.test/icon" });
  await resolveFavicon({ url: "https://main-a.test/page" });
  const custom = {
    url: "https://main-a.test/other",
    faviconUrl: "https://custom-a.test/x.png",
  };

  // Neither host's own icon stands in for the custom lookup.
  assert.equal(getCachedFavicon(custom), null);
  await resolveFavicon(custom);

  assert.equal(getCachedFavicon(custom), iconFor("custom-a.test"));
  assert.equal(
    getCachedFavicon({
      url: "https://main-a.test/other",
      faviconUrl: "https://uncached-a.test/x.png",
    }),
    null,
  );
  assert.equal(getCachedFavicon({ url: "https://unknown-a.test" }), null);
});

test("resolve fetches the custom URL first and keeps its icon out of the bookmark host", async () => {
  serveHosts("custom-b.test", "main-b.test");
  requestCount();

  const icon = await resolveFavicon({
    url: "https://main-b.test/page",
    faviconUrl: "https://custom-b.test/icon.png",
  });

  assert.equal(icon, iconFor("custom-b.test"));
  assert.equal(requestCount(), 1);
  assert.equal(
    getCachedFavicon({ url: "https://main-b.test/elsewhere" }),
    null,
  );
});

test("resolve falls back to the bookmark URL when the custom URL has no icon", async () => {
  serveHosts("main-c.test");
  requestCount();

  const icon = await resolveFavicon({
    url: "https://main-c.test/page",
    faviconUrl: "https://custom-c.test/icon.png",
  });

  assert.equal(icon, iconFor("main-c.test"));
  // Both custom sources fail before the first bookmark source succeeds.
  assert.equal(requestCount(), 3);
});

test("resolve returns a cached icon without fetching", async () => {
  serveHosts("main-d.test");
  await resolveFavicon({ url: "https://main-d.test" });
  requestCount();

  const icon = await resolveFavicon({ url: "https://main-d.test/another" });

  assert.equal(icon, iconFor("main-d.test"));
  assert.equal(requestCount(), 0);
});

test("concurrent resolves for the same host share one request", async () => {
  serveHosts("main-e.test");
  requestCount();

  const icons = await Promise.all([
    resolveFavicon({ url: "https://main-e.test/one" }),
    resolveFavicon({ url: "https://main-e.test/two" }),
    resolveFavicon({ url: "https://MAIN-E.test/three" }),
  ]);

  assert.deepEqual(icons, [
    iconFor("main-e.test"),
    iconFor("main-e.test"),
    iconFor("main-e.test"),
  ]);
  assert.equal(requestCount(), 1);
});

test("a plain lookup does not answer for a custom lookup on the same host", async () => {
  serveHosts("custom-g.test");

  // The plain sibling starts first, as when it comes earlier in a collection.
  const [plain, custom] = await Promise.all([
    resolveFavicon({ url: "https://main-g.test/one" }),
    resolveFavicon({
      url: "https://main-g.test/two",
      faviconUrl: "https://custom-g.test/icon.png",
    }),
  ]);

  assert.equal(custom, iconFor("custom-g.test"));
  assert.equal(plain, null);
});

test("a plain lookup does not overwrite the icon a custom lookup saved", async () => {
  serveHosts("custom-i.test", "main-i.test");
  const serve = respond;
  // The bookmark host answers late, so the plain lookup finishes last.
  respond = async (source) => {
    if (decodeURIComponent(source).includes("https://main-i.test")) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return serve(source);
  };

  await Promise.all([
    resolveFavicon({ url: "https://main-i.test/one" }),
    resolveFavicon({
      url: "https://main-i.test/two",
      faviconUrl: "https://custom-i.test/icon.png",
    }),
  ]);

  const newTab = await openTab();
  assert.equal(
    newTab.getCachedFavicon({
      url: "https://main-i.test/two",
      faviconUrl: "https://custom-i.test/icon.png",
    }),
    iconFor("custom-i.test"),
  );
});

test("a custom lookup gives its icon to plain siblings when the custom host is cached", async () => {
  serveHosts("custom-j.test", "main-j.test");
  await resolveFavicon({ url: "https://custom-j.test" });
  const [custom, sibling] = withSiblingFaviconUrls([
    {
      url: "https://main-j.test/page",
      faviconUrl: "https://custom-j.test/icon.png",
    },
    { url: "https://main-j.test/other" },
  ]);

  const icon = await resolveFavicon(custom);

  assert.equal(icon, iconFor("custom-j.test"));
  assert.equal(getCachedFavicon(sibling), iconFor("custom-j.test"));
});

test("a custom URL added after the bookmark host was cached is fetched", async () => {
  serveHosts("custom-k.test", "main-k.test");
  await resolveFavicon({ url: "https://main-k.test/page" });

  const [custom, sibling] = withSiblingFaviconUrls([
    {
      url: "https://main-k.test/page",
      faviconUrl: "https://custom-k.test/icon.png",
    },
    { url: "https://main-k.test/other" },
  ]);

  const icon = await resolveFavicon(custom);

  assert.equal(icon, iconFor("custom-k.test"));
  assert.equal(getCachedFavicon(sibling), iconFor("custom-k.test"));
});

test("plain bookmarks show the icon of the first custom bookmark on their host", async () => {
  serveHosts("first-n.test", "second-n.test", "main-n.test");
  const targets = withSiblingFaviconUrls([
    { url: "https://other-n.test" },
    { url: "https://main-n.test/plain" },
    {
      url: "https://main-n.test/one",
      faviconUrl: "https://first-n.test/a.png",
    },
    {
      url: "https://MAIN-N.test/two",
      faviconUrl: "https://second-n.test/b.png",
    },
  ]);
  assert.deepEqual(
    targets.map((target) => target.faviconUrl),
    [
      undefined,
      "https://first-n.test/a.png",
      "https://first-n.test/a.png",
      "https://second-n.test/b.png",
    ],
  );

  // The second custom icon is saved last, but list order still decides.
  await resolveFavicon(targets[2]);
  await resolveFavicon(targets[3]);

  const newTab = await openTab();
  assert.equal(newTab.getCachedFavicon(targets[1]), iconFor("first-n.test"));
});

test("plain bookmarks show the host's own icon once the custom URL is removed", async () => {
  serveHosts("custom-o.test", "main-o.test");
  const [, sibling] = withSiblingFaviconUrls([
    {
      url: "https://main-o.test/one",
      faviconUrl: "https://custom-o.test/a.png",
    },
    { url: "https://main-o.test/two" },
  ]);
  assert.equal(await resolveFavicon(sibling), iconFor("custom-o.test"));

  const [, plain] = withSiblingFaviconUrls([
    { url: "https://main-o.test/one" },
    { url: "https://main-o.test/two" },
  ]);

  assert.equal(plain.faviconUrl, undefined);
  assert.equal(await resolveFavicon(plain), iconFor("main-o.test"));
});

test("saving an icon keeps the icons other tabs saved", async () => {
  serveHosts("custom-h.test", "other-h.test");
  const staleTab = await openTab();
  staleTab.getCachedFavicon({ url: "https://main-h.test" });

  const activeTab = await openTab();
  await activeTab.resolveFavicon({
    url: "https://main-h.test/page",
    faviconUrl: "https://custom-h.test/icon.png",
  });
  await staleTab.resolveFavicon({ url: "https://other-h.test" });

  const newTab = await openTab();
  assert.equal(
    newTab.getCachedFavicon({
      url: "https://main-h.test/page",
      faviconUrl: "https://custom-h.test/icon.png",
    }),
    iconFor("custom-h.test"),
  );
  assert.equal(
    newTab.getCachedFavicon({ url: "https://other-h.test" }),
    iconFor("other-h.test"),
  );
});

test("failed lookups resolve to null, are not cached, and can be retried", async () => {
  serveHosts();
  requestCount();

  const [first, second] = await Promise.all([
    resolveFavicon({ url: "https://missing-f.test" }),
    resolveFavicon({ url: "https://missing-f.test/page" }),
  ]);

  assert.equal(first, null);
  assert.equal(second, null);
  assert.equal(requestCount(), 2);
  assert.equal(getCachedFavicon({ url: "https://missing-f.test" }), null);

  serveHosts("missing-f.test");
  assert.equal(
    await resolveFavicon({ url: "https://missing-f.test" }),
    iconFor("missing-f.test"),
  );
});

test("non-http targets are not fetched", async () => {
  serveHosts("newtab");
  requestCount();

  assert.equal(await resolveFavicon({ url: "chrome://newtab" }), null);
  assert.equal(await resolveFavicon({ url: "" }), null);
  assert.equal(requestCount(), 0);
});

const CACHE_KEY = "tabby:favicons:v1";
const storedHosts = () =>
  Object.keys(JSON.parse(storage.get(CACHE_KEY) ?? "{}")).sort();
const seedEntries = (prefix: string, count: number, updatedAt: number) =>
  Object.fromEntries(
    Array.from({ length: count }, (_, index) => [
      `${prefix}-${index}.test`,
      { dataUrl: "data:,seed", updatedAt: updatedAt + index },
    ]),
  );

test("saving drops expired icons and keeps only the newest 500", async () => {
  const now = Date.now();
  storage.set(
    CACHE_KEY,
    JSON.stringify({
      ...seedEntries("expired-l", 1, 0),
      ...seedEntries("old-l", 500, now - 1000),
    }),
  );
  serveHosts("main-l.test");

  await resolveFavicon({ url: "https://main-l.test" });

  const hosts = storedHosts();
  assert.equal(hosts.length, 500);
  assert.ok(hosts.includes("main-l.test"));
  assert.ok(hosts.includes("old-l-499.test"));
  assert.ok(!hosts.includes("old-l-0.test"));
  assert.ok(!hosts.includes("expired-l-0.test"));
});

test("when storage is full, the oldest icons are dropped until the new one fits", async () => {
  const seed = JSON.stringify(seedEntries("old-m", 4, Date.now() - 1000));
  storage.set(CACHE_KEY, seed);
  storageLimit = seed.length;
  serveHosts("main-m.test");

  try {
    await resolveFavicon({ url: "https://main-m.test" });
  } finally {
    storageLimit = Infinity;
  }

  assert.deepEqual(storedHosts(), ["main-m.test", "old-m-3.test"]);
  const newTab = await openTab();
  assert.equal(
    newTab.getCachedFavicon({ url: "https://main-m.test" }),
    iconFor("main-m.test"),
  );
});
