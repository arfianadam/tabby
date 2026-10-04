import assert from "node:assert/strict";
import test from "node:test";
import { getCachedFavicon, resolveFavicon } from "../src/utils/favicons.ts";

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

Object.assign(globalThis, { FileReader: StubFileReader });

const requests: string[] = [];
let respond: (source: string) => Response = () =>
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

test("cached lookup prefers the custom favicon URL over the bookmark URL", async () => {
  serveHosts("custom-a.test", "main-a.test");
  await resolveFavicon({ url: "https://custom-a.test/icon" });
  await resolveFavicon({ url: "https://main-a.test/page" });

  assert.equal(
    getCachedFavicon({
      url: "https://main-a.test/other",
      faviconUrl: "https://custom-a.test/x.png",
    }),
    iconFor("custom-a.test"),
  );
  assert.equal(
    getCachedFavicon({ url: "https://main-a.test/other" }),
    iconFor("main-a.test"),
  );
  assert.equal(
    getCachedFavicon({
      url: "https://main-a.test/other",
      faviconUrl: "https://uncached-a.test/x.png",
    }),
    iconFor("main-a.test"),
  );
  assert.equal(getCachedFavicon({ url: "https://unknown-a.test" }), null);
});

test("resolve fetches the custom URL first and caches under the bookmark URL", async () => {
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
    iconFor("custom-b.test"),
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
