import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { runInNewContext } from "node:vm";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const themeInitializerPath = html.match(
  /<script data-theme-init src="\.\/(.+?)"[^>]*><\/script>/,
)?.[1];

function initializeTheme(storedTheme: string | null, prefersDark: boolean) {
  assert.ok(
    themeInitializerPath,
    "index.html must load a CSP-safe external theme initializer",
  );
  const themeInitializer = readFileSync(
    new URL(`../public/${themeInitializerPath}`, import.meta.url),
    "utf8",
  );

  let darkClassApplied = false;
  const documentElement = {
    classList: {
      toggle(className: string, force: boolean) {
        assert.equal(className, "dark");
        darkClassApplied = force;
      },
    },
    style: {
      colorScheme: "",
    },
  };

  runInNewContext(themeInitializer, {
    document: { documentElement },
    localStorage: {
      getItem(key: string) {
        assert.equal(key, "theme");
        return storedTheme;
      },
    },
    matchMedia(query: string) {
      assert.equal(query, "(prefers-color-scheme: dark)");
      return { matches: prefersDark };
    },
  });

  return {
    darkClassApplied,
    colorScheme: documentElement.style.colorScheme,
  };
}

test("initializes the theme before the application module loads", () => {
  const initializerPosition = html.indexOf("<script data-theme-init src=");
  const applicationPosition = html.indexOf(
    '<script type="module" src="/src/main.tsx"></script>',
  );

  assert.ok(initializerPosition >= 0);
  assert.ok(initializerPosition < applicationPosition);
  assert.doesNotMatch(html, /<script data-theme-init>[\s\S]*?<\/script>/);
});

test("applies a stored dark theme during document parsing", () => {
  assert.deepEqual(initializeTheme("dark", false), {
    darkClassApplied: true,
    colorScheme: "dark",
  });
});

test("keeps a stored light theme when the system prefers dark", () => {
  assert.deepEqual(initializeTheme("light", true), {
    darkClassApplied: false,
    colorScheme: "light",
  });
});

test("uses the system preference when no theme has been stored", () => {
  assert.deepEqual(initializeTheme(null, true), {
    darkClassApplied: true,
    colorScheme: "dark",
  });
});
